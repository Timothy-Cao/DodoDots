'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/gameStore';
import { GameBoard } from './GameBoard';
import type { PulseEntry } from './GameBoard';
import { HUD } from './HUD';
import { WinOverlay } from './WinOverlay';
import { FailOverlay } from './FailOverlay';
import { ActionBar } from '@/components/ui/ActionBar';
import { SolverControls } from './SolverControls';
import { useKeyboardShortcuts } from '@/lib/keyboard';
import { getNode } from '@/lib/graph';
import type { Graph, Mode } from '@/lib/graph';
import { shareResult } from '@/lib/share';
import { unlockAudio, playSfx } from '@/lib/sfx';

export function GameScreen({
  graph, maxMoves, title, onWin, onFail, onNext, menuHref = '/', hideWinOverlay = false, shareData, mode = 'loose', showSolverControls = false,
}: {
  graph: Graph;
  maxMoves: number;
  title: string;
  onWin?: (movesUsed: number) => void;
  onFail?: () => void;
  onNext?: () => void;
  menuHref?: string;
  hideWinOverlay?: boolean;
  shareData?: { date: string };
  mode?: Mode;
  showSolverControls?: boolean;
}) {
  const router = useRouter();
  const { state, load, dispatch, undo, resetGame, lastCommit, clearLastCommit, history } = useGameStore();

  const [pulses, setPulses] = useState<PulseEntry[]>([]);
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [showFailOverlay, setShowFailOverlay] = useState(false);
  const [demoTimeouts, setDemoTimeouts] = useState<ReturnType<typeof setTimeout>[]>([]);
  const demoActive = demoTimeouts.length > 0;

  const clearDemo = useCallback(() => {
    setDemoTimeouts(prev => {
      prev.forEach(clearTimeout);
      return [];
    });
  }, []);

  useEffect(() => () => clearDemo(), [clearDemo]);

  useEffect(() => { load(graph, maxMoves, mode); }, [graph, maxMoves, mode, load]);

  // Unlock Web Audio on first pointer interaction (required by browsers)
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  // Reset overlays on load/state reset
  useEffect(() => {
    if (state?.phase === 'idle') {
      setShowWinOverlay(false);
      setShowFailOverlay(false);
    }
  }, [state?.phase]);

  // Looping win chime: plays every 2.4s while SOLVED stays on screen, matching
  // the CSS cascade loop. First chime is offset so it hits on the second pulse.
  useEffect(() => {
    if (state?.phase !== 'won') return;
    const id = window.setInterval(() => playSfx('winloop'), 2400);
    return () => window.clearInterval(id);
  }, [state?.phase]);

  useEffect(() => {
    if (!state) return;
    if (state.phase === 'won' && onWin) onWin(state.maxMoves - state.movesRemaining);
    if (state.phase === 'failed' && onFail) onFail();
  }, [state?.phase, onWin, onFail, state]);

  // Delay win/fail overlays
  useEffect(() => {
    if (!state) return;
    if (state.phase === 'won') {
      const t = setTimeout(() => setShowWinOverlay(true), 600);
      return () => clearTimeout(t);
    }
    if (state.phase === 'failed') {
      // Delay so the failed-edge red flash can play first (800ms)
      const t = setTimeout(() => setShowFailOverlay(true), 800);
      return () => clearTimeout(t);
    }
  }, [state?.phase, state?.failedEdge]);

  const removePulse = useCallback((id: string) => {
    setPulses(prev => prev.filter(p => p.id !== id));
  }, []);

  const handleReset = useCallback(() => {
    clearDemo();
    dispatch({ type: 'reset' });
    setShowWinOverlay(false);
    setShowFailOverlay(false);
  }, [dispatch, clearDemo]);

  const runDemo = useCallback((walk: string[]) => {
    clearDemo();
    setShowWinOverlay(false);
    setShowFailOverlay(false);
    dispatch({ type: 'reset' });
    const DELAY = 250;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    walk.forEach((nodeId, i) => {
      timeouts.push(setTimeout(() => {
        if (i === 0) dispatch({ type: 'latch', nodeId });
        else dispatch({ type: 'traverse', nodeId });
        if (i === walk.length - 1) setDemoTimeouts([]);
      }, DELAY * (i + 1)));
    });
    setDemoTimeouts(timeouts);
  }, [dispatch, clearDemo]);

  useKeyboardShortcuts({
    r: handleReset,
    escape: () => router.push(menuHref),
    z: () => undo(),
    backspace: () => undo(),
  });

  if (!state) return null;

  const handleNode = (id: string) => {
    if (state.phase === 'idle') {
      const targetNode = getNode(state.graph, id);
      if (targetNode) {
        const pulseId = `pulse-${Date.now()}-${id}`;
        setPulses(prev => [...prev, { id: pulseId, x: targetNode.x, y: targetNode.y, color: 'var(--cyan)' }]);
      }
      dispatch({ type: 'latch', nodeId: id });
    } else if (state.phase === 'latched') {
      const targetNode = getNode(state.graph, id);
      if (targetNode) {
        const pulseId = `pulse-${Date.now()}-${id}`;
        setPulses(prev => [...prev, { id: pulseId, x: targetNode.x, y: targetNode.y, color: 'var(--cyan)' }]);
      }
      dispatch({ type: 'traverse', nodeId: id });
    }
  };

  const movesUsed = state.maxMoves - state.movesRemaining;
  const canUndo = history.length > 0;

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <HUD title={title} movesUsed={movesUsed} optimalMoves={state.maxMoves} />
      <GameBoard
        graph={state.graph}
        current={state.current}
        phase={state.phase}
        onNodeClick={handleNode}
        pulses={pulses}
        onPulseDone={removePulse}
        initialGraph={state.initialGraph}
        lastCommit={lastCommit}
        failedEdge={state.failedEdge}
        onCommitAnimationDone={clearLastCommit}
      />
      <ActionBar
        canUndo={canUndo}
        onUndo={() => undo()}
        onReset={handleReset}
        onMenu={() => router.push(menuHref)}
      />
      {showSolverControls && (
        <SolverControls
          initialGraph={graph}
          onDemo={runDemo}
          onStopDemo={clearDemo}
          demoActive={demoActive}
        />
      )}
      {!hideWinOverlay && showWinOverlay && state.phase === 'won' && (
        <WinOverlay
          movesUsed={movesUsed}
          optimalMoves={state.maxMoves}
          onMenu={() => router.push(menuHref)}
          onNext={onNext}
          onShare={shareData
            ? () => shareResult({ date: shareData.date, movesUsed, optimal: state.maxMoves })
            : undefined}
        />
      )}
      {showFailOverlay && state.phase === 'failed' && (
        <FailOverlay
          onRetry={handleReset}
          onMenu={() => router.push(menuHref)}
          reason={state.failReason?.type}
        />
      )}
    </div>
  );
}
