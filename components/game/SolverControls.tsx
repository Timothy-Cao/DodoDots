'use client';
import { useEffect, useRef, useState } from 'react';
import type { Graph } from '@/lib/graph';
import { solveGraph } from '@/lib/solver';

type CheckStatus =
  | { kind: 'idle' }
  | { kind: 'solvable'; moves: number }
  | { kind: 'impossible'; reason: string };

type Props = {
  initialGraph: Graph;
  onDemo: (walk: string[]) => void;
  onStopDemo: () => void;
  demoActive: boolean;
};

export function SolverControls({ initialGraph, onDemo, onStopDemo, demoActive }: Props) {
  const [status, setStatus] = useState<CheckStatus>({ kind: 'idle' });
  const clearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (clearRef.current) clearTimeout(clearRef.current);
  }, []);

  const check = () => {
    const res = solveGraph(initialGraph);
    if (res.ok) setStatus({ kind: 'solvable', moves: Math.max(0, res.walk.length - 1) });
    else setStatus({ kind: 'impossible', reason: res.reason });
    if (clearRef.current) clearTimeout(clearRef.current);
    clearRef.current = setTimeout(() => setStatus({ kind: 'idle' }), 4000);
  };

  const demo = () => {
    const res = solveGraph(initialGraph);
    if (!res.ok) {
      setStatus({ kind: 'impossible', reason: res.reason });
      if (clearRef.current) clearTimeout(clearRef.current);
      clearRef.current = setTimeout(() => setStatus({ kind: 'idle' }), 4000);
      return;
    }
    setStatus({ kind: 'solvable', moves: Math.max(0, res.walk.length - 1) });
    onDemo(res.walk);
  };

  return (
    <div className="solver-controls" role="toolbar" aria-label="Solver controls">
      <button
        className="solver-btn font-display"
        onPointerDown={(e) => { e.preventDefault(); check(); }}
      >
        CHECK
      </button>
      {demoActive ? (
        <button
          className="solver-btn solver-btn--active font-display"
          onPointerDown={(e) => { e.preventDefault(); onStopDemo(); }}
        >
          STOP
        </button>
      ) : (
        <button
          className="solver-btn font-display"
          onPointerDown={(e) => { e.preventDefault(); demo(); }}
        >
          DEMO
        </button>
      )}
      {status.kind === 'solvable' && (
        <span className="solver-status solver-status--ok font-display">
          SOLVABLE · {status.moves} MOVES
        </span>
      )}
      {status.kind === 'impossible' && (
        <span className="solver-status solver-status--bad font-display" title={status.reason}>
          UNSOLVABLE
        </span>
      )}
    </div>
  );
}
