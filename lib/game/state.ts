import type { Graph } from '../graph';
import { getNode, isSolved, getValidNeighbors } from '../graph';

export type Phase = 'idle' | 'latched' | 'tracing' | 'won' | 'failed';

export type GameState = {
  graph: Graph;
  initialGraph: Graph;
  maxMoves: number;
  movesRemaining: number;
  phase: Phase;
  current: string | null;
};

export function initGame(graph: Graph, maxMoves: number): GameState {
  return {
    graph: structuredClone(graph),
    initialGraph: structuredClone(graph),
    maxMoves,
    movesRemaining: maxMoves,
    phase: 'idle',
    current: null,
  };
}

export type GameAction =
  | { type: 'latch'; nodeId: string }
  | { type: 'traverse'; nodeId: string }
  | { type: 'reset' };

export function reduce(s: GameState, a: GameAction): GameState {
  switch (a.type) {
    case 'latch': {
      if (s.phase !== 'idle') return s;
      const node = getNode(s.graph, a.nodeId);
      if (!node || !node.startEligible) return s;
      const graph: Graph = {
        ...s.graph,
        nodes: s.graph.nodes.map(n =>
          n.id === a.nodeId ? { ...n, count: n.count - 1 } : n
        ),
      };
      const next: GameState = { ...s, graph, current: a.nodeId, phase: 'latched' };
      return isSolved(graph) ? { ...next, phase: 'won' } : next;
    }
    case 'traverse': {
      if (s.phase !== 'latched' && s.phase !== 'tracing') return s;
      if (s.current === null) return s;
      if (s.movesRemaining <= 0) return s;
      const neighbors = getValidNeighbors(s.graph, s.current);
      const hit = neighbors.find(n => n.nodeId === a.nodeId);
      if (!hit) return s;
      const graph: Graph = {
        nodes: s.graph.nodes.map(n =>
          n.id === a.nodeId ? { ...n, count: n.count - 1 } : n
        ),
        edges: s.graph.edges.map(e =>
          e.id === hit.edgeId ? { ...e, count: e.count - 1 } : e
        ),
      };
      const movesRemaining = s.movesRemaining - 1;
      const next: GameState = { ...s, graph, current: a.nodeId, movesRemaining, phase: 'latched' };
      if (isSolved(graph)) return { ...next, phase: 'won' };
      if (movesRemaining === 0) return { ...next, phase: 'failed' };
      return next;
    }
    case 'reset':
      return initGame(s.initialGraph, s.maxMoves);
    default:
      return s;
  }
}
