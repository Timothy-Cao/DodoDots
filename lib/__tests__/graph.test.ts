import { describe, it, expect } from 'vitest';
import { isSolved, getValidNeighbors, findEdge, type Graph } from '../graph';

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

const diamond: Graph = {
  nodes: [
    { id: 'a', x: 0, y: 0, count: 1, startEligible: true },
    { id: 'b', x: 1, y: 0, count: 1, startEligible: false },
    { id: 'c', x: 1, y: 1, count: 1, startEligible: false },
  ],
  edges: [
    { id: 'e1', from: 'a', to: 'b', count: 1, direction: 'bi' },
    { id: 'e2', from: 'a', to: 'c', count: 1, direction: 'forward' },
    { id: 'e3', from: 'c', to: 'a', count: 1, direction: 'forward' },
  ],
};

describe('getValidNeighbors', () => {
  it('includes bidirectional neighbors', () => {
    const n = getValidNeighbors(diamond, 'a');
    expect(n.map(x => x.nodeId).sort()).toEqual(['b', 'c']);
  });
  it('includes forward-direction when current is `from`', () => {
    const n = getValidNeighbors(diamond, 'a');
    expect(n.find(x => x.nodeId === 'c' && x.edgeId === 'e2')).toBeDefined();
  });
  it('excludes forward-direction when current is `to`', () => {
    const n = getValidNeighbors(diamond, 'b');
    expect(n.map(x => x.nodeId)).toEqual(['a']);
  });
});

describe('findEdge', () => {
  it('finds a valid edge between two nodes', () => {
    const e = findEdge(diamond, 'a', 'b');
    expect(e?.id).toBe('e1');
  });
  it('respects direction', () => {
    expect(findEdge(diamond, 'b', 'c')).toBeUndefined();
  });
});
