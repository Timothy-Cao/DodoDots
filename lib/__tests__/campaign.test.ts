import { describe, it, expect } from 'vitest';
import { CAMPAIGN } from '../campaign';
import { initGame, reduce } from '../game/state';
import { isSolved } from '../graph';

const SOLUTIONS: Record<string, string[]> = {
  '01-first-steps': ['a', 'b'],
  '02-three-in-a-row': ['a', 'b', 'c'],
  '03-the-triangle': ['a', 'b', 'c', 'a'],
  '04-the-square': ['a', 'b', 'c', 'd', 'a'],
  '05-branching-out': ['a', 'b', 'c', 'd', 'b', 'e'],
  '06-pentagon': ['a', 'b', 'c', 'd', 'e', 'a'],
  '07-the-bowtie': ['a', 'b', 'c', 'd', 'e', 'c'],
  '08-the-hexagon': ['a', 'b', 'c', 'd', 'e', 'f', 'a'],
  '09-pentagon-plus-cross': ['a', 'b', 'c', 'a', 'e', 'd', 'c'],
  '10-double-diamond': ['a', 'b', 'c', 'e', 'f', 'g', 'c', 'd', 'a'],
};

describe('Campaign levels', () => {
  for (const level of CAMPAIGN) {
    const solution = SOLUTIONS[level.id];
    it(`${level.id} is solvable in strict mode via intended solution`, () => {
      expect(solution).toBeDefined();
      let state = initGame(level.graph, level.maxMoves, level.mode);
      const [start, ...rest] = solution;
      state = reduce(state, { type: 'latch', nodeId: start });
      expect(state.phase, `latch failed for ${level.id}`).not.toBe('failed');
      for (const nodeId of rest) {
        state = reduce(state, { type: 'traverse', nodeId });
        expect(state.phase, `traverse to ${nodeId} failed for ${level.id}`).not.toBe('failed');
      }
      expect(state.phase, `not won at end for ${level.id}`).toBe('won');
      expect(isSolved(state.graph), `not solved for ${level.id}`).toBe(true);
    });
  }
});
