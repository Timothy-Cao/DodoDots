'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/gameStore';
import { GameBoard } from './GameBoard';
import { HUD } from './HUD';
import { WinOverlay } from './WinOverlay';
import { FailOverlay } from './FailOverlay';
import { useKeyboardShortcuts } from '@/lib/keyboard';
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
  const { state, anim, load, dispatch, finishAnim } = useGameStore();

  useEffect(() => { load(graph, maxMoves); }, [graph, maxMoves, load]);

  useEffect(() => {
    if (!state) return;
    if (state.phase === 'won' && onWin) onWin();
    if (state.phase === 'failed' && onFail) onFail();
  }, [state?.phase, onWin, onFail, state]);

  useKeyboardShortcuts({
    r: () => dispatch({ type: 'reset' }),
    escape: () => router.push(menuHref),
  });

  if (!state) return null;

  const handleNode = (id: string) => {
    if (state.phase === 'idle') dispatch({ type: 'latch', nodeId: id });
    else if (state.phase === 'latched' || state.phase === 'tracing') dispatch({ type: 'traverse', nodeId: id });
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <HUD title={title} movesRemaining={state.movesRemaining} maxMoves={state.maxMoves} />
      <GameBoard
        graph={state.graph}
        current={state.current}
        phase={state.phase}
        anim={anim ? { from: anim.from, to: anim.to } : null}
        onNodeClick={handleNode}
        onAnimDone={finishAnim}
      />
      {state.phase === 'won' && <WinOverlay onMenu={() => router.push(menuHref)} />}
      {state.phase === 'failed' && <FailOverlay onRetry={() => dispatch({ type: 'reset' })} onMenu={() => router.push(menuHref)} />}
    </div>
  );
}
