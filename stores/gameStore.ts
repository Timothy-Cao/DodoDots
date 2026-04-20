'use client';
import { create } from 'zustand';
import { initGame, reduce, type GameState, type GameAction } from '@/lib/game/state';
import type { Graph } from '@/lib/graph';

type PendingAnim = { from: string; to: string; pendingAction: GameAction } | null;

type GameStore = {
  state: GameState | null;
  anim: PendingAnim;
  queued: GameAction | null;
  load: (graph: Graph, maxMoves: number) => void;
  dispatch: (a: GameAction) => void;
  finishAnim: () => void;
};

export const useGameStore = create<GameStore>((set, get) => ({
  state: null,
  anim: null,
  queued: null,
  load: (graph, maxMoves) => set({ state: initGame(graph, maxMoves), anim: null, queued: null }),
  dispatch: (a) => {
    const s = get().state; if (!s) return;
    if (get().anim && a.type === 'traverse') { set({ queued: a }); return; }
    if (a.type === 'traverse' && s.current) {
      set({ anim: { from: s.current, to: a.nodeId, pendingAction: a } });
      return;
    }
    set({ state: reduce(s, a) });
  },
  finishAnim: () => {
    const { state, anim, queued } = get(); if (!state || !anim) return;
    const next = reduce(state, anim.pendingAction);
    if (queued && queued.type === 'traverse' && next.current) {
      set({ state: next, anim: null, queued: null });
      get().dispatch(queued);
      return;
    }
    set({ state: next, anim: null, queued: null });
  },
}));
