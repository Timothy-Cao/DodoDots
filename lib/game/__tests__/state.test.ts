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
