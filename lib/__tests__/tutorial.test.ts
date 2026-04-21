import { describe, it, expect } from 'vitest';
import { TUTORIAL } from '../tutorial';
import { initGame, reduce } from '../game/state';
import { isSolved } from '../graph';
import { solveGraph } from '../solver';

describe('Tutorial levels', () => {
  for (const level of TUTORIAL) {
    it(`${level.id} (${level.title}) is solvable`, () => {
      const res = solveGraph(level.graph);
      expect(res.ok, res.ok ? '' : `solver: ${res.reason}`).toBe(true);
      if (!res.ok) return;
      const walk = res.walk;
      let state = initGame(level.graph, level.maxMoves);
      const [start, ...rest] = walk;
      state = reduce(state, { type: 'latch', nodeId: start });
      expect(state.phase, `latch failed for ${level.id}`).not.toBe('failed');
      for (const nodeId of rest) {
        state = reduce(state, { type: 'traverse', nodeId });
        expect(state.phase, `traverse to ${nodeId} failed for ${level.id}`).not.toBe('failed');
      }
      expect(state.phase, `not won at end for ${level.id}`).toBe('won');
      expect(isSolved(state.graph)).toBe(true);
    });
  }
});
