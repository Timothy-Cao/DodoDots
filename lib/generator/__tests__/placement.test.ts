import { describe, it, expect } from 'vitest';
import { placeNodes } from '../placement';
import { createRng } from '../../rng';

describe('placeNodes', () => {
  it('returns requested count in [0.12,0.88] range', () => {
    const pts = placeNodes(createRng('x'), 7);
    expect(pts.length).toBe(7);
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(0.12);
      expect(p.x).toBeLessThanOrEqual(0.88);
      expect(p.y).toBeGreaterThanOrEqual(0.12);
      expect(p.y).toBeLessThanOrEqual(0.88);
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
  it('distributes nodes across the interior, not just at corners', () => {
    const pts = placeNodes(createRng('variety'), 7);
    const interior = pts.filter(p => p.x > 0.2 && p.x < 0.8 && p.y > 0.2 && p.y < 0.8);
    expect(interior.length).toBeGreaterThanOrEqual(2);
  });
});
