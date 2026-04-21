import { describe, it, expect } from 'vitest';
import { CAMPAIGN } from '../campaign';
import { initGame, reduce } from '../game/state';
import { isSolved } from '../graph';

const SOLUTIONS: Record<string, string[]> = {
  'lvlmo87m2107te': [
    'nmo87m7xatux',
    'nmo87m5f20ss',
    'nmo87m8dj7kk',
    'nmo87m5yurss',
    'nmo87m7xatux',
    'nmo87m7ikpjg',
    'nmo87m5f20ss',
    'nmo87m5yurss',
    'nmo87m7ikpjg',
  ],
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
