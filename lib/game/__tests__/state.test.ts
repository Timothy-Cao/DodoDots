import { describe, it, expect } from 'vitest';
import { initGame, reduce } from '../state';
import type { Graph } from '../../graph';

const twoNode: Graph = {
  nodes: [
    { id: 'a', x: 0, y: 0, count: 1, startEligible: true },
    { id: 'b', x: 1, y: 0, count: 1, startEligible: false },
  ],
  edges: [{ id: 'e1', from: 'a', to: 'b', count: 1, direction: 'bi' }],
};

describe('initGame', () => {
  it('starts in Idle phase with unmodified counts', () => {
    const s = initGame(twoNode, 3);
    expect(s.phase).toBe('idle');
    expect(s.graph.nodes[0].count).toBe(1);
    expect(s.movesRemaining).toBe(3);
    expect(s.current).toBeNull();
  });
});

describe('reduce/traverse', () => {
  it('decrements edge + destination node, sets current, decrements movesRemaining', () => {
    let s = initGame(twoNode, 3);
    s = reduce(s, { type: 'latch', nodeId: 'a' });
    s = reduce(s, { type: 'traverse', nodeId: 'b' });
    expect(s.phase).toBe('won');
    expect(s.graph.edges[0].count).toBe(0);
    expect(s.graph.nodes[1].count).toBe(0);
    expect(s.movesRemaining).toBe(2);
    expect(s.current).toBe('b');
  });

  it('ignores traverse to non-adjacent node', () => {
    let s = initGame({
      nodes: [
        { id: 'a', x: 0, y: 0, count: 1, startEligible: true },
        { id: 'b', x: 1, y: 0, count: 1, startEligible: false },
        { id: 'c', x: 2, y: 0, count: 1, startEligible: false },
      ],
      edges: [{ id: 'e1', from: 'a', to: 'b', count: 1, direction: 'bi' }],
    }, 3);
    s = reduce(s, { type: 'latch', nodeId: 'a' });
    const s2 = reduce(s, { type: 'traverse', nodeId: 'c' });
    expect(s2).toBe(s);
  });

  it('does NOT fail when movesRemaining hits 0 without an unreachable edge', () => {
    const g: Graph = {
      nodes: [
        { id: 'a', x: 0, y: 0, count: 2, startEligible: true },
        { id: 'b', x: 1, y: 0, count: 2, startEligible: false },
      ],
      edges: [{ id: 'e1', from: 'a', to: 'b', count: 1, direction: 'bi' }],
    };
    let s = initGame(g, 1);
    s = reduce(s, { type: 'latch', nodeId: 'a' });
    s = reduce(s, { type: 'traverse', nodeId: 'b' });
    // movesRemaining is now 0 (or negative) but game is not failed — only unreachable edge fails
    expect(s.phase).toBe('latched');
    expect(s.movesRemaining).toBe(0);
  });
});

describe('locked node rule', () => {
  it('ignores traverse to a node at count 0', () => {
    const g: Graph = {
      nodes: [
        { id: 'a', x: 0, y: 0, count: 1, startEligible: true },
        { id: 'b', x: 1, y: 0, count: 0, startEligible: false }, // already done
      ],
      edges: [{ id: 'e1', from: 'a', to: 'b', count: 1, direction: 'bi' }],
    };
    let s = initGame(g, 3);
    s = reduce(s, { type: 'latch', nodeId: 'a' });
    const s2 = reduce(s, { type: 'traverse', nodeId: 'b' });
    expect(s2).toBe(s);
  });
});

describe('unreachable edge detection', () => {
  it('fails when a remaining edge has both endpoints at 0', () => {
    const g: Graph = {
      nodes: [
        { id: 'a', x: 0, y: 0, count: 1, startEligible: true },
        { id: 'b', x: 1, y: 0, count: 1, startEligible: true },
        { id: 'c', x: 2, y: 0, count: 0, startEligible: false }, // already at 0
      ],
      edges: [
        { id: 'e1', from: 'a', to: 'b', count: 1, direction: 'bi' },
        { id: 'e2', from: 'b', to: 'c', count: 1, direction: 'bi' }, // count>0, but c=0 and b will become 0
      ],
    };
    let s = initGame(g, 3);
    s = reduce(s, { type: 'latch', nodeId: 'a' }); // a: 0
    s = reduce(s, { type: 'traverse', nodeId: 'b' }); // b: 0, e1: 0. Edge e2 has count 1 but b=0 c=0 → unreachable
    expect(s.phase).toBe('failed');
    expect(s.failedEdge).toBe('e2');
  });

  it('does not fail when movesRemaining hits 0 if the puzzle is still solvable', () => {
    const g: Graph = {
      nodes: [
        { id: 'a', x: 0, y: 0, count: 1, startEligible: true },
        { id: 'b', x: 1, y: 0, count: 1, startEligible: false },
      ],
      edges: [{ id: 'e1', from: 'a', to: 'b', count: 1, direction: 'bi' }],
    };
    let s = initGame(g, 1);
    s = reduce(s, { type: 'latch', nodeId: 'a' });
    s = reduce(s, { type: 'traverse', nodeId: 'b' });
    // All counts are 0 → phase 'won', not 'failed'
    expect(s.phase).toBe('won');
  });
});

describe('reduce/latch', () => {
  it('transitions idle -> latched and decrements the node counter', () => {
    const s0 = initGame(twoNode, 3);
    const s1 = reduce(s0, { type: 'latch', nodeId: 'a' });
    expect(s1.phase).toBe('latched');
    expect(s1.current).toBe('a');
    expect(s1.graph.nodes[0].count).toBe(0);
  });
  it('ignores latch on non-start-eligible node', () => {
    const s0 = initGame(twoNode, 3);
    const s1 = reduce(s0, { type: 'latch', nodeId: 'b' });
    expect(s1).toBe(s0);
  });
  it('transitions to won if the latched node was the last unfinished element', () => {
    const g: Graph = {
      nodes: [{ id: 'a', x: 0, y: 0, count: 1, startEligible: true }],
      edges: [],
    };
    const s1 = reduce(initGame(g, 1), { type: 'latch', nodeId: 'a' });
    expect(s1.phase).toBe('won');
  });
});
