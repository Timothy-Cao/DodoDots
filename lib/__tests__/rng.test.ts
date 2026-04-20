import { describe, it, expect } from 'vitest';
import { createRng } from '../rng';

describe('createRng', () => {
  it('is deterministic given the same seed', () => {
    const a = createRng('2026-04-19');
    const b = createRng('2026-04-19');
    const as = Array.from({ length: 5 }, () => a());
    const bs = Array.from({ length: 5 }, () => b());
    expect(as).toEqual(bs);
  });
  it('produces numbers in [0,1)', () => {
    const r = createRng('seed');
    for (let i = 0; i < 100; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
