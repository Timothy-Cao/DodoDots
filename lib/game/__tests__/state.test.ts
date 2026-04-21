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
  it('decrements edge and sets current; node counts are untouched', () => {
    let s = initGame(twoNode, 3);
    s = reduce(s, { type: 'latch', nodeId: 'a' });
    s = reduce(s, { type: 'traverse', nodeId: 'b' });
    expect(s.phase).toBe('won');
    expect(s.graph.edges[0].count).toBe(0);
    // Nodes no longer decrement — their counts stay at initial values.
    expect(s.graph.nodes[0].count).toBe(1);
    expect(s.graph.nodes[1].count).toBe(1);
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

  it('does NOT fail when movesRemaining hits 0 while the puzzle is still unsolved', () => {
    const g: Graph = {
      nodes: [
        { id: 'a', x: 0, y: 0, count: 2, startEligible: true },
        { id: 'b', x: 0.5, y: 0, count: 2, startEligible: false },
        { id: 'c', x: 1, y: 0, count: 1, startEligible: false },
      ],
      edges: [
        { id: 'e1', from: 'a', to: 'b', count: 1, direction: 'bi' },
        { id: 'e2', from: 'b', to: 'c', count: 1, direction: 'bi' },
      ],
    };
    // Use loose mode so edge locking doesn't strand the player
    let s = initGame(g, 1, 'loose');
    s = reduce(s, { type: 'latch', nodeId: 'a' });
    s = reduce(s, { type: 'traverse', nodeId: 'b' });
    // movesRemaining is now 0 but e2 still has count 1 → game not failed, not won
    expect(s.phase).toBe('latched');
    expect(s.movesRemaining).toBe(0);
  });
});

describe('node count no longer gates traversal', () => {
  it('allows traverse to a node at count 0 (nodes do not lock)', () => {
    const g: Graph = {
      nodes: [
        { id: 'a', x: 0, y: 0, count: 1, startEligible: true },
        { id: 'b', x: 1, y: 0, count: 0, startEligible: false }, // already at 0
      ],
      edges: [{ id: 'e1', from: 'a', to: 'b', count: 1, direction: 'bi' }],
    };
    let s = initGame(g, 3);
    s = reduce(s, { type: 'latch', nodeId: 'a' });
    const s2 = reduce(s, { type: 'traverse', nodeId: 'b' });
    expect(s2).not.toBe(s);
    expect(s2.current).toBe('b');
    expect(s2.phase).toBe('won'); // edge hit 0, node counts don't matter
  });
});

describe('unreachable edge detection', () => {
  it('no longer fails when endpoints are at 0 — nodes do not lock', () => {
    const g: Graph = {
      nodes: [
        { id: 'a', x: 0, y: 0, count: 1, startEligible: true },
        { id: 'b', x: 1, y: 0, count: 1, startEligible: true },
        { id: 'c', x: 2, y: 0, count: 0, startEligible: false },
      ],
      edges: [
        { id: 'e1', from: 'a', to: 'b', count: 1, direction: 'bi' },
        { id: 'e2', from: 'b', to: 'c', count: 1, direction: 'bi' },
      ],
    };
    let s = initGame(g, 3);
    s = reduce(s, { type: 'latch', nodeId: 'a' });
    s = reduce(s, { type: 'traverse', nodeId: 'b' });
    // With node-lock gating removed, b→c is still reachable; game continues.
    expect(s.phase).not.toBe('failed');
    expect(s.failedEdge).toBeNull();
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
    // All edge counts are 0 → phase 'won', not 'failed'
    expect(s.phase).toBe('won');
  });
});

describe('stuck state detection', () => {
  it('fails when current node has only locked neighbors and puzzle not solved', () => {
    // Star: a in center connects to b, c, d. All count 1, all edges count 1. Start a only.
    // After latch a then traverse b: b is 0, a is 0. b's only neighbor is a (locked).
    // e2 (a-c) and e3 (a-d) still have count 1 — one endpoint unlocked each, so NOT unreachable.
    // But we can't move anywhere from b. That's "stuck".
    const g: Graph = {
      nodes: [
        { id: 'a', x: 0.5, y: 0.5, count: 1, startEligible: true },
        { id: 'b', x: 0.2, y: 0.5, count: 1, startEligible: false },
        { id: 'c', x: 0.8, y: 0.5, count: 1, startEligible: false },
        { id: 'd', x: 0.5, y: 0.2, count: 1, startEligible: false },
      ],
      edges: [
        { id: 'e1', from: 'a', to: 'b', count: 1, direction: 'bi' },
        { id: 'e2', from: 'a', to: 'c', count: 1, direction: 'bi' },
        { id: 'e3', from: 'a', to: 'd', count: 1, direction: 'bi' },
      ],
    };
    let s = initGame(g, 5);
    s = reduce(s, { type: 'latch', nodeId: 'a' });
    s = reduce(s, { type: 'traverse', nodeId: 'b' });
    expect(s.phase).toBe('failed');
    expect(s.failReason?.type).toBe('stuck');
  });

  it('after latch with only a pre-locked neighbor, still latches (edge not locked)', () => {
    // a connects only to b (pre-count 0). Latching a decrements a to 0.
    // Edge e1 still has count 1; in strict mode it is not locked, so traversal to b is valid.
    const g: Graph = {
      nodes: [
        { id: 'a', x: 0, y: 0, count: 1, startEligible: true },
        { id: 'b', x: 1, y: 0, count: 0, startEligible: false },
      ],
      edges: [{ id: 'e1', from: 'a', to: 'b', count: 1, direction: 'bi' }],
    };
    let s = initGame(g, 3);
    s = reduce(s, { type: 'latch', nodeId: 'a' });
    expect(s.phase).toBe('latched');
    const s2 = reduce(s, { type: 'traverse', nodeId: 'b' });
    expect(s2.phase).toBe('won');
  });
});

describe('strict mode', () => {
  it('rejects traversal along a locked edge (count ≤ 0) in strict mode', () => {
    // Graph: a -e1(count:1)- b -e2(count:0)- c
    // In strict mode, traversing b→c should be rejected because e2.count = 0
    const g: Graph = {
      nodes: [
        { id: 'a', x: 0, y: 0, count: 1, startEligible: true },
        { id: 'b', x: 0.5, y: 0, count: 1, startEligible: false },
        { id: 'c', x: 1, y: 0, count: 1, startEligible: false },
      ],
      edges: [
        { id: 'e1', from: 'a', to: 'b', count: 1, direction: 'bi' },
        { id: 'e2', from: 'b', to: 'c', count: 0, direction: 'bi' },
      ],
    };
    let s = initGame(g, 5, 'strict');
    s = reduce(s, { type: 'latch', nodeId: 'a' });
    s = reduce(s, { type: 'traverse', nodeId: 'b' });
    const s2 = reduce(s, { type: 'traverse', nodeId: 'c' }); // e2.count=0, should reject
    expect(s2).toBe(s);
  });

  it('allows traversal along a locked edge in loose mode', () => {
    // Keep an extra unsolved edge (e3) so the puzzle isn't won before the locked-edge traversal.
    const g: Graph = {
      nodes: [
        { id: 'a', x: 0, y: 0, count: 1, startEligible: true },
        { id: 'b', x: 0.5, y: 0, count: 2, startEligible: false },
        { id: 'c', x: 1, y: 0, count: 2, startEligible: false },
      ],
      edges: [
        { id: 'e1', from: 'a', to: 'b', count: 1, direction: 'bi' },
        { id: 'e2', from: 'b', to: 'c', count: 0, direction: 'bi' },
        { id: 'e3', from: 'c', to: 'a', count: 1, direction: 'bi' },
      ],
    };
    let s = initGame(g, 5, 'loose');
    s = reduce(s, { type: 'latch', nodeId: 'a' });
    s = reduce(s, { type: 'traverse', nodeId: 'b' });
    const s2 = reduce(s, { type: 'traverse', nodeId: 'c' }); // loose: allowed even though e2.count=0
    expect(s2).not.toBe(s);
    expect(s2.current).toBe('c');
  });

  it('reset preserves strict mode', () => {
    const g: Graph = {
      nodes: [
        { id: 'a', x: 0, y: 0, count: 1, startEligible: true },
        { id: 'b', x: 1, y: 0, count: 1, startEligible: false },
      ],
      edges: [{ id: 'e1', from: 'a', to: 'b', count: 1, direction: 'bi' }],
    };
    let s = initGame(g, 3, 'strict');
    s = reduce(s, { type: 'latch', nodeId: 'a' });
    const after = reduce(s, { type: 'reset' });
    expect(after.mode).toBe('strict');
  });
});

describe('reduce/latch', () => {
  it('transitions idle -> latched without decrementing the node counter', () => {
    const s0 = initGame(twoNode, 3);
    const s1 = reduce(s0, { type: 'latch', nodeId: 'a' });
    expect(s1.phase).toBe('latched');
    expect(s1.current).toBe('a');
    // Nodes no longer decrement — their counts stay at initial values.
    expect(s1.graph.nodes[0].count).toBe(1);
  });
  it('ignores latch on non-start-eligible node', () => {
    const s0 = initGame(twoNode, 3);
    const s1 = reduce(s0, { type: 'latch', nodeId: 'b' });
    expect(s1).toBe(s0);
  });
  it('transitions to won on latch if there are no edges to traverse', () => {
    const g: Graph = {
      nodes: [{ id: 'a', x: 0, y: 0, count: 1, startEligible: true }],
      edges: [],
    };
    const s1 = reduce(initGame(g, 1), { type: 'latch', nodeId: 'a' });
    expect(s1.phase).toBe('won');
  });
});
