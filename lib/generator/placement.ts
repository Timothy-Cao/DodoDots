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

  // Lloyd-ish centroidal relaxation: spring equilibrium at MIN_DIST * 1.5,
  // preventing pure-repulsion from pinning nodes to corners.
  const ITERATIONS = 20;
  const INFLUENCE = 0.35;       // only neighbors within this radius influence
  const STEP = 0.5;             // how far to move each iteration (damped)

  for (let iter = 0; iter < ITERATIONS; iter++) {
    for (let i = 0; i < placed.length; i++) {
      let tx = 0, ty = 0, totalW = 0;
      for (let j = 0; j < placed.length; j++) {
        if (i === j) continue;
        const dx = placed[j].x - placed[i].x;
        const dy = placed[j].y - placed[i].y;
        const d = Math.hypot(dx, dy);
        if (d > INFLUENCE) continue;
        // Repulsion when too close, attraction when just far enough — spring around MIN_DIST * 1.5
        const target = MIN_DIST * 1.5;
        const force = (d - target);   // negative = push apart, positive = pull together
        const w = 1 / Math.max(d, 0.05);
        tx += (dx / d) * force * w;
        ty += (dy / d) * force * w;
        totalW += w;
      }
      if (totalW > 0) {
        const moveX = (tx / totalW) * STEP;
        const moveY = (ty / totalW) * STEP;
        // Soft boundary: reduce motion near walls instead of hard-clamping to extreme edge
        const newX = placed[i].x + moveX;
        const newY = placed[i].y + moveY;
        placed[i].x = Math.max(0.12, Math.min(0.88, newX));
        placed[i].y = Math.max(0.12, Math.min(0.88, newY));
      }
    }
  }

  return placed;
}
