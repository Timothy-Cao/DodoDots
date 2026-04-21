'use client';
import { create } from 'zustand';
import { initGame, reduce, type GameState, type GameAction } from '@/lib/game/state';
import { getValidNeighbors } from '@/lib/graph';
import type { Graph, Mode } from '@/lib/graph';
import { playSfx } from '@/lib/sfx';

function hapticCommit() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(8); } catch {}
  }
}

type LastCommit = { nodeId: string; edgeId: string; at: number };

type GameStore = {
  state: GameState | null;
  history: GameState[];         // past states for undo (excluding current)
  lastCommit: LastCommit | null;
  load: (graph: Graph, maxMoves: number, mode?: Mode) => void;
  dispatch: (a: GameAction) => void;
  undo: () => void;
  clearLastCommit: () => void;
  resetGame: () => void;
};

export const useGameStore = create<GameStore>((set, get) => ({
  state: null,
  history: [],
  lastCommit: null,

  load: (graph, maxMoves, mode = 'loose') => set({
    state: initGame(graph, maxMoves, mode),
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

    const prevPhase = state.phase;
    const next = reduce(state, a);

    // No-op: play invalid feedback for failed latch/traverse attempts
    if (next === state) {
      if (a.type === 'latch' || a.type === 'traverse') playSfx('invalid');
      return;
    }

    let lastCommit = get().lastCommit;

    if (a.type === 'latch') {
      playSfx('latch');
    } else if (a.type === 'traverse') {
      // Find the edge that was traversed
      const neighbors = getValidNeighbors(state.graph, state.current!);
      const hit = neighbors.find(n => n.nodeId === a.nodeId);
      if (hit) {
        lastCommit = { nodeId: a.nodeId, edgeId: hit.edgeId, at: Date.now() };
        hapticCommit();
        // Edge just hit 0 → "completed" SFX. Nodes no longer have a visit counter.
        const traversedEdge = next.graph.edges.find(e => e.id === hit.edgeId);
        if (traversedEdge?.count === 0) {
          playSfx('complete');
        } else {
          playSfx('traverse');
        }
      }
    } else if (a.type === 'reset') {
      lastCommit = null;
    }

    // Phase transition SFX
    if (next.phase === 'won' && prevPhase !== 'won') playSfx('win');
    else if (next.phase === 'failed' && prevPhase !== 'failed') playSfx('fail');

    set({ state: next, history: newHistory, lastCommit });
  },

  undo: () => {
    const { history } = get();
    if (history.length === 0) return;
    playSfx('undo');
    const prev = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    set({ state: prev, history: newHistory, lastCommit: null });
  },

  clearLastCommit: () => set({ lastCommit: null }),

  resetGame: () => {
    const { state } = get();
    if (!state) return;
    const next = reduce(state, { type: 'reset' });
    set({ state: next, history: [], lastCommit: null });
  },
}));
