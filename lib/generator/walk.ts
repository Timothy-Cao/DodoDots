import type { Point } from './placement';

export type WalkEdge = { a: number; b: number };
export type Walk = {
  start: number;
  steps: Array<{ from: number; to: number; edgeKey: string }>;
  edges: WalkEdge[];
};

function edgeKey(a: number, b: number) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

export function simulateWalk(
  rng: () => number,
  points: Point[],
  length: number
): Walk {
  const n = points.length;
  const edges = new Map<string, WalkEdge>();
  const degree = new Array(n).fill(0);
  const adj: Record<number, number[]> = {};
  for (let i = 0; i < n; i++) adj[i] = [];

  const start = Math.floor(rng() * n);
  let cur = start;
  const steps: Walk['steps'] = [];
  let prev = -1;

  for (let i = 0; i < length; i++) {
    const useExisting = rng() < 0.7 && adj[cur].length > 0;
    let next: number;
    if (useExisting) {
      next = adj[cur][Math.floor(rng() * adj[cur].length)];
      if (prev !== -1 && rng() < 0.15) next = prev;
    } else {
      const candidates: Array<{ id: number; w: number }> = [];
      for (let j = 0; j < n; j++) {
        if (j === cur) continue;
        if (degree[j] >= 4 || degree[cur] >= 4) continue;
        if (adj[cur].includes(j)) continue;
        const d = Math.hypot(points[cur].x - points[j].x, points[cur].y - points[j].y);
        candidates.push({ id: j, w: 1 / Math.max(d, 0.05) });
      }
      if (candidates.length === 0) {
        if (adj[cur].length === 0) break;
        next = adj[cur][Math.floor(rng() * adj[cur].length)];
      } else {
        const total = candidates.reduce((s, c) => s + c.w, 0);
        let r = rng() * total;
        next = candidates[0].id;
        for (const c of candidates) {
          r -= c.w;
          if (r <= 0) { next = c.id; break; }
        }
        const k = edgeKey(cur, next);
        if (!edges.has(k)) {
          edges.set(k, { a: cur, b: next });
          adj[cur].push(next);
          adj[next].push(cur);
          degree[cur]++;
          degree[next]++;
        }
      }
    }
    steps.push({ from: cur, to: next, edgeKey: edgeKey(cur, next) });
    prev = cur;
    cur = next;
  }

  return { start, steps, edges: Array.from(edges.values()) };
}
