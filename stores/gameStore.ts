'use client';
import { create } from 'zustand';
import { initGame, reduce, type GameState, type GameAction } from '@/lib/game/state';
import { getValidNeighbors } from '@/lib/graph';
import type { Graph } from '@/lib/graph';

type LastCommit = { nodeId: string; edgeId: string; at: number };

type GameStore = {
  state: GameState | null;
  history: GameState[];         // past states for undo (excluding current)
  lastCommit: LastCommit | null;
  load: (graph: Graph, maxMoves: number) => void;
  dispatch: (a: GameAction) => void;
  undo: () => void;
  clearLastCommit: () => void;
};

export const useGameStore = create<GameStore>((set, get) => ({
  state: null,
  history: [],
  lastCommit: null,

  load: (graph, maxMoves) => set({
    state: initGame(graph, maxMoves),
    history: [],
    lastCommit: null,
  }),

  dispatch: (a) => {
    const { state, history } = get();
    if (!state) return;

    // Push current state to history before latch/traverse so we can undo
    let newHistory = history;
    if (a.type === 'latch' || a.type === 'traverse') {
      newHistory = [...history, state];
    } else if (a.type === 'reset') {
      newHistory = [];
    }

    const next = reduce(state, a);
    if (next === state) return; // no-op

    let lastCommit = get().lastCommit;

    if (a.type === 'traverse') {
      // Find the edge that was traversed
      const neighbors = getValidNeighbors(state.graph, state.current!);
      const hit = neighbors.find(n => n.nodeId === a.nodeId);
      if (hit) {
        lastCommit = { nodeId: a.nodeId, edgeId: hit.edgeId, at: Date.now() };
      }
    } else if (a.type === 'reset') {
      lastCommit = null;
    }

    set({ state: next, history: newHistory, lastCommit });
  },

  undo: () => {
    const { history } = get();
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    set({ state: prev, history: newHistory, lastCommit: null });
  },

  clearLastCommit: () => set({ lastCommit: null }),
}));
