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

  it('detects stuck immediately after latch if starting node has no unlocked neighbors', () => {
    // a connects only to b (pre-locked). Latching a makes a=0.
    // Puzzle is not solved (edge still count 1) and a's only neighbor is locked.
    // e1: a(0)-b(0) → unreachable; this should still be caught (unreachable takes precedence).
    const g: Graph = {
      nodes: [
        { id: 'a', x: 0, y: 0, count: 1, startEligible: true },
        { id: 'b', x: 1, y: 0, count: 0, startEligible: false },
      ],
      edges: [{ id: 'e1', from: 'a', to: 'b', count: 1, direction: 'bi' }],
    };
    let s = initGame(g, 3);
    s = reduce(s, { type: 'latch', nodeId: 'a' });
    expect(s.phase).toBe('failed');
    // Unreachable takes precedence over stuck when both apply
    expect(s.failReason?.type).toBe('unreachable_edge');
  });

  it('tutorial level 4: visiting e before c/d leaves e1 (a-b) unreachable and fails', () => {
    // Tutorial 04-puzzle graph: a(1)-b(2); b-c, b-d, b-e (all 1); c-d (1). Only a is start.
    // Path: latch a → traverse b (b=1) → traverse e (e=0) → back to b (b=0) → traverse c (c=0)
    //   → traverse d (d=0). Now all nodes are 0, but edge e1 (a-b) was only crossed once;
    //   its count is still 0 only if we actually went a→b. a→b decremented e1 to 0. So all
    //   edges: e1=0, e2 (b-c)=0, e3 (c-d)=0, e4 (b-d) still 1 — and b is 0, d is 0 → unreachable.
    const g: Graph = {
      nodes: [
        { id: 'a', x: 0.15, y: 0.5, count: 1, startEligible: true },
        { id: 'b', x: 0.4, y: 0.5, count: 2, startEligible: false },
        { id: 'c', x: 0.6, y: 0.3, count: 1, startEligible: false },
        { id: 'd', x: 0.6, y: 0.7, count: 1, startEligible: false },
        { id: 'e', x: 0.85, y: 0.5, count: 1, startEligible: false },
      ],
      edges: [
        { id: 'e1', from: 'a', to: 'b', count: 1, direction: 'bi' },
        { id: 'e2', from: 'b', to: 'c', count: 1, direction: 'bi' },
        { id: 'e3', from: 'c', to: 'd', count: 1, direction: 'bi' },
        { id: 'e4', from: 'b', to: 'd', count: 1, direction: 'bi' },
        { id: 'e5', from: 'b', to: 'e', count: 1, direction: 'bi' },
      ],
    };
    let s = initGame(g, 6);
    s = reduce(s, { type: 'latch', nodeId: 'a' });     // a=0
    s = reduce(s, { type: 'traverse', nodeId: 'b' });  // b=1, e1=0
    s = reduce(s, { type: 'traverse', nodeId: 'e' });  // e=0, e5=0
    s = reduce(s, { type: 'traverse', nodeId: 'b' });  // b=0, e5=0 (clamped)
    s = reduce(s, { type: 'traverse', nodeId: 'c' });  // c=0, e2=0
    s = reduce(s, { type: 'traverse', nodeId: 'd' });  // d=0, e3=0 — leaves e4 with count 1 and b,d both locked
    expect(s.phase).toBe('failed');
    // Either unreachable (if engine catches e4) or stuck (all c's neighbors locked). Either is a fail.
    expect(s.failReason?.type === 'unreachable_edge' || s.failReason?.type === 'stuck').toBe(true);
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
    // Same graph as above, but loose mode: e2.count=0 is allowed
    const g: Graph = {
      nodes: [
        { id: 'a', x: 0, y: 0, count: 1, startEligible: true },
        { id: 'b', x: 0.5, y: 0, count: 1, startEligible: false },
        { id: 'c', x: 1, y: 0, count: 2, startEligible: false },
      ],
      edges: [
        { id: 'e1', from: 'a', to: 'b', count: 1, direction: 'bi' },
        { id: 'e2', from: 'b', to: 'c', count: 0, direction: 'bi' },
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
