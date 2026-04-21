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
  // Eulerian trail A→G across all 17 multi-edge traversals (A and G are the only odd-degree nodes)
  'lvlmo89ax8oxgb': [
    'nmo89b10b8fg',
    'nmo89b1psxhd',
    'nmo89b2pj8dx',
    'nmo89b2b392k',
    'nmo89b2pj8dx',
    'nmo89b3178pt',
    'nmo89b3psfik',
    'nmo89b2pj8dx',
    'nmo89b1psxhd',
    'nmo89b2b392k',
    'nmo89b3178pt',
    'nmo89b2pj8dx',
    'nmo89b10b8fg',
    'nmo89b4gk26z',
    'nmo89b423ddk',
    'nmo89b2pj8dx',
    'nmo89b3psfik',
    'nmo89b423ddk',
  ],
  // Eulerian trail B→K across all 20 edges (B=v95ey5, K=yyt3sb are the only odd-degree nodes)
  'lvlmo896rz12sn': [
    'nmo896v95ey5',
    'nmo896usoffj',
    'nmo896x2k2ka',
    'nmo896vvrp3d',
    'nmo896v95ey5',
    'nmo896vn6lxw',
    'nmo896usoffj',
    'nmo896vvrp3d',
    'nmo896xj0lnn',
    'nmo896w5u8i8',
    'nmo896ydz732',
    'nmo896yq18xe',
    'nmo896wjgi2o',
    'nmo896vn6lxw',
    'nmo896w5u8i8',
    'nmo896vvrp3d',
    'nmo896wjgi2o',
    'nmo896yyt3sb',
    'nmo896w5u8i8',
    'nmo896yq18xe',
    'nmo896yyt3sb',
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
