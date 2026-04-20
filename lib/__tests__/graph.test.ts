import { describe, it, expect } from 'vitest';
import { isSolved, type Graph } from '../graph';

const g: Graph = {
  nodes: [{ id: 'a', x: 0.5, y: 0.5, count: 0, startEligible: true }],
  edges: [],
};

describe('isSolved', () => {
  it('returns true when all counts are <= 0', () => {
    expect(isSolved(g)).toBe(true);
  });
  it('returns false when any node count > 0', () => {
    expect(isSolved({ ...g, nodes: [{ ...g.nodes[0], count: 1 }] })).toBe(false);
  });
  it('returns false when any edge count > 0', () => {
    const g2: Graph = {
      nodes: [
        { id: 'a', x: 0, y: 0, count: 0, startEligible: true },
        { id: 'b', x: 1, y: 1, count: 0, startEligible: true },
      ],
      edges: [{ id: 'e1', from: 'a', to: 'b', count: 1, direction: 'bi' }],
    };
    expect(isSolved(g2)).toBe(false);
  });
});
