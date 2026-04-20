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

  // Track visit counts to enforce max-2 cap
  const nodeVisits = new Array(n).fill(0);
  const edgeVisitCounts = new Map<string, number>();
  nodeVisits[start] = 1;

  for (let i = 0; i < length; i++) {
    // Build candidate set of all reachable neighbors filtered by cap
    const existingCandidates = adj[cur].filter(j => {
      const k = edgeKey(cur, j);
      return nodeVisits[j] < 2 && (edgeVisitCounts.get(k) ?? 0) < 2;
    });

    const newCandidates: Array<{ id: number; w: number }> = [];
    for (let j = 0; j < n; j++) {
      if (j === cur) continue;
      if (degree[j] >= 4 || degree[cur] >= 4) continue;
      if (adj[cur].includes(j)) continue;
      if (nodeVisits[j] >= 2) continue;
      const d = Math.hypot(points[cur].x - points[j].x, points[cur].y - points[j].y);
      newCandidates.push({ id: j, w: 1 / Math.max(d, 0.05) });
    }

    const allCandidatesEmpty = existingCandidates.length === 0 && newCandidates.length === 0;
    if (allCandidatesEmpty) break; // no valid moves within cap — stop early

    let next: number;
    const preferExisting = rng() < 0.7;
    if (preferExisting && existingCandidates.length > 0) {
      // Use an existing capped-compliant edge
      next = existingCandidates[Math.floor(rng() * existingCandidates.length)];
      if (prev !== -1 && existingCandidates.includes(prev) && rng() < 0.15) next = prev;
    } else if (newCandidates.length > 0) {
      // Create a new edge weighted by proximity
      const total = newCandidates.reduce((s, c) => s + c.w, 0);
      let r = rng() * total;
      next = newCandidates[0].id;
      for (const c of newCandidates) {
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
    } else {
      // Either: preferExisting=true but existingCandidates empty → fall back to new
      // Or: preferExisting=false but newCandidates empty → fall back to existing
      if (newCandidates.length > 0) {
        const total = newCandidates.reduce((s, c) => s + c.w, 0);
        let r = rng() * total;
        next = newCandidates[0].id;
        for (const c of newCandidates) {
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
      } else {
        // Only existingCandidates remain
        next = existingCandidates[Math.floor(rng() * existingCandidates.length)];
      }
    }

    const k = edgeKey(cur, next);
    edgeVisitCounts.set(k, (edgeVisitCounts.get(k) ?? 0) + 1);
    nodeVisits[next]++;
    steps.push({ from: cur, to: next, edgeKey: k });
    prev = cur;
    cur = next;
  }

  return { start, steps, edges: Array.from(edges.values()) };
}
