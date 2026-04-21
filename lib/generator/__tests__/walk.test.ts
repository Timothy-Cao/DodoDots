import { describe, it, expect } from 'vitest';
import { simulateWalk } from '../walk';
import { createRng } from '../../rng';
import { placeNodes } from '../placement';

describe('simulateWalk', () => {
  it('respects max degree 4', () => {
    const pts = placeNodes(createRng('a'), 8);
    const walk = simulateWalk(createRng('b'), pts, 20);
    const deg: Record<number, number> = {};
    for (const e of walk.edges) {
      deg[e.a] = (deg[e.a] ?? 0) + 1;
      deg[e.b] = (deg[e.b] ?? 0) + 1;
    }
    for (const v of Object.values(deg)) expect(v).toBeLessThanOrEqual(4);
  });
  it('steps length is at most requested length', () => {
    const pts = placeNodes(createRng('c'), 6);
    const walk = simulateWalk(createRng('d'), pts, 15);
    expect(walk.steps.length).toBeLessThanOrEqual(15);
    expect(walk.steps.length).toBeGreaterThan(0);
  });
  it('caps node and edge visits at 3', () => {
    const pts = placeNodes(createRng('cap'), 8);
    const walk = simulateWalk(createRng('cap2'), pts, 30);
    const nodeVisits = new Array(pts.length).fill(0);
    const edgeVisits = new Map<string, number>();
    nodeVisits[walk.start]++;
    for (const s of walk.steps) {
      nodeVisits[s.to]++;
      edgeVisits.set(s.edgeKey, (edgeVisits.get(s.edgeKey) ?? 0) + 1);
    }
    for (const v of nodeVisits) expect(v).toBeLessThanOrEqual(3);
    for (const v of edgeVisits.values()) expect(v).toBeLessThanOrEqual(3);
  });
});
