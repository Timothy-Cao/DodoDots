import type { Graph } from '../graph';
import { getNode, isSolved, findUnreachableEdge, getValidNeighbors, hasNoValidMoves } from '../graph';

export type Phase = 'idle' | 'latched' | 'tracing' | 'won' | 'failed';

export type FailReason =
  | { type: 'unreachable_edge'; edgeId: string }
  | { type: 'stuck' }
  | null;

export type GameState = {
  graph: Graph;
  initialGraph: Graph;
  maxMoves: number;
  movesRemaining: number;
  phase: Phase;
  current: string | null;
  failReason: FailReason;
  failedEdge: string | null;
};

export function initGame(graph: Graph, maxMoves: number): GameState {
  return {
    graph: structuredClone(graph),
    initialGraph: structuredClone(graph),
    maxMoves,
    movesRemaining: maxMoves,
    phase: 'idle',
    current: null,
    failReason: null,
    failedEdge: null,
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
          n.id === a.nodeId ? { ...n, count: Math.max(0, n.count - 1) } : n
        ),
      };
      const next: GameState = { ...s, graph, current: a.nodeId, phase: 'latched', failReason: null, failedEdge: null };
      if (isSolved(graph)) return { ...next, phase: 'won' };
      const unreachableEdgeId = findUnreachableEdge(graph);
      if (unreachableEdgeId) return { ...next, phase: 'failed', failReason: { type: 'unreachable_edge', edgeId: unreachableEdgeId }, failedEdge: unreachableEdgeId };
      if (next.current && hasNoValidMoves(graph, next.current)) {
        return { ...next, phase: 'failed', failReason: { type: 'stuck' } };
      }
      return next;
    }
    case 'traverse': {
      if (s.phase !== 'latched' && s.phase !== 'tracing') return s;
      if (s.current === null) return s;
      // Reject traverse to a node that is already done (count ≤ 0)
      const destNode = getNode(s.graph, a.nodeId);
      if (!destNode || destNode.count <= 0) return s;
      const neighbors = getValidNeighbors(s.graph, s.current);
      const hit = neighbors.find(n => n.nodeId === a.nodeId);
      if (!hit) return s;
      const graph: Graph = {
        nodes: s.graph.nodes.map(n =>
          n.id === a.nodeId ? { ...n, count: Math.max(0, n.count - 1) } : n
        ),
        edges: s.graph.edges.map(e =>
          e.id === hit.edgeId ? { ...e, count: Math.max(0, e.count - 1) } : e
        ),
      };
      const movesRemaining = Math.max(0, s.movesRemaining - 1);
      const next: GameState = { ...s, graph, current: a.nodeId, movesRemaining, phase: 'latched', failReason: null, failedEdge: null };
      if (isSolved(graph)) return { ...next, phase: 'won' };
      const unreachableEdgeId = findUnreachableEdge(graph);
      if (unreachableEdgeId) return { ...next, phase: 'failed', failReason: { type: 'unreachable_edge', edgeId: unreachableEdgeId }, failedEdge: unreachableEdgeId };
      if (next.current && hasNoValidMoves(graph, next.current)) {
        return { ...next, phase: 'failed', failReason: { type: 'stuck' } };
      }
      return next;
    }
    case 'reset':
      return initGame(s.initialGraph, s.maxMoves);
    default:
      return s;
  }
}
