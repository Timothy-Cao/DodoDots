import { describe, it, expect } from 'vitest';
import { solveGraph, verifyWalk } from '../solver';
import { CAMPAIGN } from '../campaign';
import { initGame, reduce } from '../game/state';
import type { Graph } from '../graph';

function playWalk(graph: Graph, walk: string[], mode: 'strict' | 'loose' = 'strict') {
  let s = initGame(graph, walk.length, mode);
  s = reduce(s, { type: 'latch', nodeId: walk[0] });
  for (let i = 1; i < walk.length; i++) {
    s = reduce(s, { type: 'traverse', nodeId: walk[i] });
  }
  return s;
}

describe('solveGraph', () => {
  for (const level of CAMPAIGN) {
    it(`solves campaign level "${level.title}"`, () => {
      const res = solveGraph(level.graph);
      expect(res.ok, res.ok ? '' : res.reason).toBe(true);
      if (!res.ok) return;
      expect(verifyWalk(level.graph, res.walk)).toBe(true);
      // Also play it through the real reducer to be extra-sure
      const final = playWalk(level.graph, res.walk, level.mode);
      expect(final.phase).toBe('won');
    });
  }

  it('returns ok with single-node walk on an empty-edge graph', () => {
    const graph: Graph = {
      nodes: [{ id: 'a', x: 0, y: 0, count: 1, startEligible: true }],
      edges: [],
    };
    const res = solveGraph(graph);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.walk).toEqual(['a']);
  });

  it('detects an unsolvable graph (4 odd-degree nodes)', () => {
    // K4 (complete graph on 4 vertices) — every vertex has degree 3, all odd.
    const graph: Graph = {
      nodes: [
        { id: 'a', x: 0, y: 0, count: 1, startEligible: true },
        { id: 'b', x: 1, y: 0, count: 1, startEligible: true },
        { id: 'c', x: 1, y: 1, count: 1, startEligible: true },
        { id: 'd', x: 0, y: 1, count: 1, startEligible: true },
      ],
      edges: [
        { id: 'ab', from: 'a', to: 'b', count: 1, direction: 'bi' },
        { id: 'ac', from: 'a', to: 'c', count: 1, direction: 'bi' },
        { id: 'ad', from: 'a', to: 'd', count: 1, direction: 'bi' },
        { id: 'bc', from: 'b', to: 'c', count: 1, direction: 'bi' },
        { id: 'bd', from: 'b', to: 'd', count: 1, direction: 'bi' },
        { id: 'cd', from: 'c', to: 'd', count: 1, direction: 'bi' },
      ],
    };
    const res = solveGraph(graph);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toMatch(/odd-degree|Unsolvable/);
  });

  it('detects unsolvable when graph is disconnected', () => {
    const graph: Graph = {
      nodes: [
        { id: 'a', x: 0, y: 0, count: 1, startEligible: true },
        { id: 'b', x: 1, y: 0, count: 1, startEligible: true },
        { id: 'c', x: 2, y: 0, count: 1, startEligible: true },
        { id: 'd', x: 3, y: 0, count: 1, startEligible: true },
      ],
      edges: [
        { id: 'ab', from: 'a', to: 'b', count: 1, direction: 'bi' },
        { id: 'cd', from: 'c', to: 'd', count: 1, direction: 'bi' },
      ],
    };
    const res = solveGraph(graph);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toMatch(/disconnected/);
  });

  it('handles doubled/tripled edges on a 2-node graph', () => {
    const graph: Graph = {
      nodes: [
        { id: 'a', x: 0, y: 0, count: 1, startEligible: true },
        { id: 'b', x: 1, y: 0, count: 1, startEligible: true },
      ],
      edges: [
        { id: 'ab', from: 'a', to: 'b', count: 3, direction: 'bi' },
      ],
    };
    const res = solveGraph(graph);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(verifyWalk(graph, res.walk)).toBe(true);
    // Degree = 3 each → odd → start at one endpoint, end at the other
    expect(res.walk.length).toBe(4);
  });

  it('solves a directed cycle', () => {
    const graph: Graph = {
      nodes: [
        { id: 'a', x: 0, y: 0, count: 1, startEligible: true },
        { id: 'b', x: 1, y: 0, count: 1, startEligible: false },
        { id: 'c', x: 1, y: 1, count: 1, startEligible: false },
      ],
      edges: [
        { id: 'ab', from: 'a', to: 'b', count: 1, direction: 'forward' },
        { id: 'bc', from: 'b', to: 'c', count: 1, direction: 'forward' },
        { id: 'ca', from: 'c', to: 'a', count: 1, direction: 'forward' },
      ],
    };
    const res = solveGraph(graph);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(verifyWalk(graph, res.walk)).toBe(true);
    expect(res.walk[0]).toBe('a');
    expect(res.walk[res.walk.length - 1]).toBe('a');
  });
});
