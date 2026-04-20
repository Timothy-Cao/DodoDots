import { describe, it, expect } from 'vitest';
import { placeNodes } from '../placement';
import { createRng } from '../../rng';

describe('placeNodes', () => {
  it('returns requested count in [0.1,0.9] range', () => {
    const pts = placeNodes(createRng('x'), 7);
    expect(pts.length).toBe(7);
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(0.1);
      expect(p.x).toBeLessThanOrEqual(0.9);
      expect(p.y).toBeGreaterThanOrEqual(0.1);
      expect(p.y).toBeLessThanOrEqual(0.9);
    }
  });
  it('no two points closer than min separation', () => {
    const pts = placeNodes(createRng('y'), 8);
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        expect(Math.hypot(dx, dy)).toBeGreaterThan(0.12);
      }
    }
  });
});
