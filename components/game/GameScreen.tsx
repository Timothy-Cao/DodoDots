'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/gameStore';
import { GameBoard } from './GameBoard';
import type { PulseEntry } from './GameBoard';
import { HUD } from './HUD';
import { WinOverlay } from './WinOverlay';
import { FailOverlay } from './FailOverlay';
import { useKeyboardShortcuts } from '@/lib/keyboard';
import { getNode } from '@/lib/graph';
import type { Graph } from '@/lib/graph';

export function GameScreen({
  graph, maxMoves, title, onWin, onFail, menuHref = '/',
}: {
  graph: Graph;
  maxMoves: number;
  title: string;
  onWin?: () => void;
  onFail?: () => void;
  menuHref?: string;
}) {
  const router = useRouter();
  const { state, load, dispatch, undo, recentNodes, recentEdges } = useGameStore();

  const [pulses, setPulses] = useState<PulseEntry[]>([]);
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [showFailOverlay, setShowFailOverlay] = useState(false);

  useEffect(() => { load(graph, maxMoves); }, [graph, maxMoves, load]);

  // Reset overlays on load/state reset
  useEffect(() => {
    if (state?.phase === 'idle') {
      setShowWinOverlay(false);
      setShowFailOverlay(false);
    }
  }, [state?.phase]);

  useEffect(() => {
    if (!state) return;
    if (state.phase === 'won' && onWin) onWin();
    if (state.phase === 'failed' && onFail) onFail();
  }, [state?.phase, onWin, onFail, state]);

  // Delay win/fail overlays
  useEffect(() => {
    if (!state) return;
    if (state.phase === 'won') {
      const t = setTimeout(() => setShowWinOverlay(true), 800);
      return () => clearTimeout(t);
    }
    if (state.phase === 'failed') {
      // Immediate for unreachable edge (after flash animation)
      const delay = state.failReason?.type === 'unreachable_edge' ? 800 : 0;
      const t = setTimeout(() => setShowFailOverlay(true), delay);
      return () => clearTimeout(t);
    }
  }, [state?.phase, state?.failReason]);

  const removePulse = useCallback((id: string) => {
    setPulses(prev => prev.filter(p => p.id !== id));
  }, []);

  useKeyboardShortcuts({
    r: () => { dispatch({ type: 'reset' }); setShowWinOverlay(false); setShowFailOverlay(false); },
    escape: () => router.push(menuHref),
    z: () => undo(),
    backspace: () => undo(),
  });

  if (!state) return null;

  const handleNode = (id: string) => {
    if (state.phase === 'idle') {
      const targetNode = getNode(state.graph, id);
      if (targetNode) {
        const willComplete = targetNode.count === 1;
        const color = willComplete ? 'var(--neon-green)' : 'var(--cyan)';
        const pulseId = `pulse-${Date.now()}-${id}`;
        setPulses(prev => [...prev, { id: pulseId, x: targetNode.x, y: targetNode.y, color }]);
      }
      dispatch({ type: 'latch', nodeId: id });
    } else if (state.phase === 'latched') {
      const targetNode = getNode(state.graph, id);
      if (targetNode) {
        const willComplete = targetNode.count === 1;
        const color = willComplete ? 'var(--neon-green)' : 'var(--cyan)';
        const pulseId = `pulse-${Date.now()}-${id}`;
        setPulses(prev => [...prev, { id: pulseId, x: targetNode.x, y: targetNode.y, color }]);
      }
      dispatch({ type: 'traverse', nodeId: id });
    }
  };

  const failEdgeId = state.failReason?.type === 'unreachable_edge' ? state.failReason.edgeId : null;

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <HUD title={title} movesRemaining={state.movesRemaining} maxMoves={state.maxMoves} />
      <GameBoard
        graph={state.graph}
        current={state.current}
        phase={state.phase}
        onNodeClick={handleNode}
        pulses={pulses}
        onPulseDone={removePulse}
        recentNodes={new Set(recentNodes)}
        recentEdges={new Set(recentEdges)}
        failEdgeId={failEdgeId}
      />
      {showWinOverlay && state.phase === 'won' && <WinOverlay onMenu={() => router.push(menuHref)} />}
      {showFailOverlay && state.phase === 'failed' && (
        <FailOverlay
          onRetry={() => { dispatch({ type: 'reset' }); setShowWinOverlay(false); setShowFailOverlay(false); }}
          onMenu={() => router.push(menuHref)}
          reason={state.failReason?.type === 'unreachable_edge' ? 'unreachable_edge' : undefined}
        />
      )}
    </div>
  );
}
