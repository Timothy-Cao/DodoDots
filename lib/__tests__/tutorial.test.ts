import { describe, it, expect } from 'vitest';
import { TUTORIAL } from '../tutorial';
import { initGame, reduce } from '../game/state';
import { isSolved } from '../graph';

// Hardcoded solutions for each tutorial level
const SOLUTIONS: Record<string, string[]> = {
  '01-click': ['a', 'b'],
  '02-path': ['a', 'b', 'c', 'd'],
  '03-revisit': ['a', 'b', 'c', 'b', 'd'],
  '04-puzzle': ['a', 'b', 'c', 'd', 'b', 'e'],
};

describe('Tutorial levels', () => {
  for (const level of TUTORIAL) {
    const solution = SOLUTIONS[level.id];
    it(`${level.id} is solvable via intended solution`, () => {
      expect(solution).toBeDefined();
      let state = initGame(level.graph, level.maxMoves);
      const [start, ...rest] = solution;
      // Latch the first node
      state = reduce(state, { type: 'latch', nodeId: start });
      expect(state.phase).not.toBe('failed');
      // Traverse each subsequent node
      for (const nodeId of rest) {
        state = reduce(state, { type: 'traverse', nodeId });
        expect(state.phase).not.toBe('failed');
      }
      expect(state.phase).toBe('won');
      expect(isSolved(state.graph)).toBe(true);
    });
  }
});
