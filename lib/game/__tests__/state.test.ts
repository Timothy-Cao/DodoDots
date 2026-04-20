import { describe, it, expect } from 'vitest';
import { initGame } from '../state';
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
