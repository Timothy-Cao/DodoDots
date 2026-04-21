import { describe, it, expect } from 'vitest';
import { computeCurvatures, segmentsCross } from '../layout';
import type { Graph } from '../graph';

describe('segmentsCross', () => {
  it('detects crossing X', () => {
    const ok = segmentsCross(
      { x: 0, y: 0 } as never, { x: 1, y: 1 } as never,
      { x: 0, y: 1 } as never, { x: 1, y: 0 } as never,
    );
    expect(ok).toBe(true);
  });
  it('does not detect parallel non-crossing', () => {
    const ok = segmentsCross(
      { x: 0, y: 0 } as never, { x: 1, y: 0 } as never,
      { x: 0, y: 0.5 } as never, { x: 1, y: 0.5 } as never,
    );
    expect(ok).toBe(false);
  });
});

describe('computeCurvatures', () => {
  it('curves the second edge of a crossing pair', () => {
    const g: Graph = {
      nodes: [
        { id: 'a', x: 0.1, y: 0.1, count: 1, startEligible: true },
        { id: 'b', x: 0.9, y: 0.9, count: 1, startEligible: false },
        { id: 'c', x: 0.1, y: 0.9, count: 1, startEligible: false },
        { id: 'd', x: 0.9, y: 0.1, count: 1, startEligible: false },
      ],
      edges: [
        { id: 'e1', from: 'a', to: 'b', count: 1, direction: 'bi' },
        { id: 'e2', from: 'c', to: 'd', count: 1, direction: 'bi' },
      ],
    };
    const c = computeCurvatures(g);
    // e1 is processed first against e2 — e2 gets curved (it's the j>i one)
    expect(Math.abs(c['e2'] ?? 0)).toBeGreaterThan(0);
  });

  it('curves a small-angle fan-out from shared node', () => {
    // a at center, b and c almost in the same direction from a
    const g: Graph = {
      nodes: [
        { id: 'a', x: 0.5, y: 0.5, count: 1, startEligible: true },
        { id: 'b', x: 0.9, y: 0.5, count: 1, startEligible: false },
        { id: 'c', x: 0.9, y: 0.55, count: 1, startEligible: false }, // ~7° from b direction
      ],
      edges: [
        { id: 'e1', from: 'a', to: 'b', count: 1, direction: 'bi' },
        { id: 'e2', from: 'a', to: 'c', count: 1, direction: 'bi' },
      ],
    };
    const c = computeCurvatures(g);
    expect(Math.abs(c['e2'] ?? 0)).toBeGreaterThan(0);
  });

  it('does not curve well-separated edges', () => {
    const g: Graph = {
      nodes: [
        { id: 'a', x: 0.1, y: 0.5, count: 1, startEligible: true },
        { id: 'b', x: 0.9, y: 0.5, count: 1, startEligible: false },
      ],
      edges: [{ id: 'e1', from: 'a', to: 'b', count: 1, direction: 'bi' }],
    };
    const c = computeCurvatures(g);
    expect(c['e1'] ?? 0).toBe(0);
  });
});
