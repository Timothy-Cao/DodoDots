'use client';
import { create } from 'zustand';
import { initGame, reduce, type GameState, type GameAction } from '@/lib/game/state';
import type { Graph } from '@/lib/graph';

type GameStore = {
  state: GameState | null;
  load: (graph: Graph, maxMoves: number) => void;
  dispatch: (a: GameAction) => void;
};

export const useGameStore = create<GameStore>((set, get) => ({
  state: null,
  load: (graph, maxMoves) => set({ state: initGame(graph, maxMoves) }),
  dispatch: (a) => {
    const s = get().state;
    if (!s) return;
    set({ state: reduce(s, a) });
  },
}));
