export type Point = { x: number; y: number };

export function placeNodes(rng: () => number, count: number): Point[] {
  const MIN_DIST = 0.15;
  const placed: Point[] = [];
  let attempts = 0;
  while (placed.length < count && attempts < 2000) {
    const p = { x: 0.1 + rng() * 0.8, y: 0.1 + rng() * 0.8 };
    const ok = placed.every(q => Math.hypot(p.x - q.x, p.y - q.y) >= MIN_DIST);
    if (ok) placed.push(p);
    attempts++;
  }
  while (placed.length < count) {
    placed.push({ x: 0.1 + rng() * 0.8, y: 0.1 + rng() * 0.8 });
  }
  return placed;
}
