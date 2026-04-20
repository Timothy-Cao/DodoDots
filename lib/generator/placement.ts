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

  // Relaxation pass: force-directed repulsion for even spacing
  const ITERATIONS = 30;
  const REPULSION = 0.02;
  const DAMPING = 0.85;
  for (let iter = 0; iter < ITERATIONS; iter++) {
    for (let i = 0; i < placed.length; i++) {
      let fx = 0, fy = 0;
      for (let j = 0; j < placed.length; j++) {
        if (i === j) continue;
        const dx = placed[i].x - placed[j].x;
        const dy = placed[i].y - placed[j].y;
        const d = Math.max(Math.hypot(dx, dy), 0.05);
        fx += (dx / d) * (REPULSION / d);
        fy += (dy / d) * (REPULSION / d);
      }
      placed[i].x = Math.max(0.1, Math.min(0.9, placed[i].x + fx * DAMPING));
      placed[i].y = Math.max(0.1, Math.min(0.9, placed[i].y + fy * DAMPING));
    }
  }

  return placed;
}
