import { describe, it, expect } from 'vitest';
import { generateDaily } from '../generator';
import { isSolved } from '../graph';
import { initGame, reduce } from '../game/state';

describe('generateDaily', () => {
  it('produces a solvable graph', () => {
    const { graph, maxMoves, solution } = generateDaily('2026-04-19');
    let s = initGame(graph, maxMoves);
    s = reduce(s, { type: 'latch', nodeId: solution[0] });
    for (let i = 1; i < solution.length; i++) {
      s = reduce(s, { type: 'traverse', nodeId: solution[i] });
    }
    expect(s.phase).toBe('won');
    expect(isSolved(s.graph)).toBe(true);
  });
  it('is deterministic for the same seed', () => {
    const a = generateDaily('2026-04-19');
    const b = generateDaily('2026-04-19');
    expect(a.graph).toEqual(b.graph);
  });
  it('clamps counts to [1,3]', () => {
    const { graph } = generateDaily('stress');
    for (const n of graph.nodes) {
      expect(n.count).toBeGreaterThanOrEqual(1);
      expect(n.count).toBeLessThanOrEqual(3);
    }
    for (const e of graph.edges) {
      expect(e.count).toBeGreaterThanOrEqual(1);
      expect(e.count).toBeLessThanOrEqual(3);
    }
  });
});
