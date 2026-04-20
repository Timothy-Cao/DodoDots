'use client';
import { create } from 'zustand';
import { initGame, reduce, type GameState, type GameAction } from '@/lib/game/state';
import { getValidNeighbors } from '@/lib/graph';
import type { Graph } from '@/lib/graph';

const RECENT_WINDOW = 3;

type GameStore = {
  state: GameState | null;
  recentNodes: string[];
  recentEdges: string[];
  history: GameAction[];
  load: (graph: Graph, maxMoves: number) => void;
  dispatch: (a: GameAction) => void;
  undo: () => void;
};

export const useGameStore = create<GameStore>((set, get) => ({
  state: null,
  recentNodes: [],
  recentEdges: [],
  history: [],

  load: (graph, maxMoves) => set({
    state: initGame(graph, maxMoves),
    recentNodes: [],
    recentEdges: [],
    history: [],
  }),

  dispatch: (a) => {
    const { state, recentNodes, recentEdges, history } = get();
    if (!state) return;
    const next = reduce(state, a);
    if (next === state) return; // no-op

    let newRecentNodes = recentNodes;
    let newRecentEdges = recentEdges;
    let newHistory = history;

    if (a.type === 'traverse') {
      newRecentNodes = [...recentNodes, a.nodeId].slice(-RECENT_WINDOW);
      if (state.current) {
        const neighbors = getValidNeighbors(state.graph, state.current);
        const hit = neighbors.find(n => n.nodeId === a.nodeId);
        if (hit) {
          newRecentEdges = [...recentEdges, hit.edgeId].slice(-RECENT_WINDOW);
        }
      }
      newHistory = [...history, a];
    } else if (a.type === 'latch') {
      newHistory = [...history, a];
    } else if (a.type === 'reset') {
      newRecentNodes = [];
      newRecentEdges = [];
      newHistory = [];
    }

    set({ state: next, recentNodes: newRecentNodes, recentEdges: newRecentEdges, history: newHistory });
  },

  undo: () => {
    const { state, history } = get();
    if (!state || history.length === 0) return;

    const newHistory = history.slice(0, -1);

    // Replay from initial state
    let replayed = initGame(state.initialGraph, state.maxMoves);
    let newRecentNodes: string[] = [];
    let newRecentEdges: string[] = [];

    for (const a of newHistory) {
      if (a.type === 'traverse') {
        if (replayed.current) {
          const neighbors = getValidNeighbors(replayed.graph, replayed.current);
          const hit = neighbors.find(n => n.nodeId === a.nodeId);
          if (hit) newRecentEdges = [...newRecentEdges, hit.edgeId].slice(-RECENT_WINDOW);
        }
        newRecentNodes = [...newRecentNodes, a.nodeId].slice(-RECENT_WINDOW);
      }
      replayed = reduce(replayed, a);
    }

    set({ state: replayed, history: newHistory, recentNodes: newRecentNodes, recentEdges: newRecentEdges });
  },
}));
