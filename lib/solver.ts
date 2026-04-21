import type { Graph } from './graph';

export type SolveResult =
  | { ok: true; walk: string[] }
  | { ok: false; reason: string };

/**
 * Finds an Eulerian walk through the graph — a sequence of node IDs where
 * each edge is traversed exactly its `count` times, starting from a
 * `startEligible` node. Returns `{ ok: false, reason }` if no such walk
 * exists.
 *
 * Runs in O(V + E·c) where c is the max edge count (Hierholzer's algorithm
 * over the multigraph). For all practical DodoDots puzzles this is instant.
 *
 * Supports:
 *   - All-bi (undirected) graphs — classic undirected Eulerian.
 *   - All-directed graphs — directed Eulerian.
 *   - Mixed graphs — best effort; may report impossible even when a
 *     solution exists (the fully-correct case is the mixed Chinese-postman
 *     problem, which needs an LP/flow solve).
 */
export function solveGraph(graph: Graph): SolveResult {
  type EdgeInst = { edgeId: string; a: string; b: string; dir: 'bi' | 'forward' | 'backward' };

  // Expand every edge into `count` instances.
  const instances: EdgeInst[] = [];
  for (const e of graph.edges) {
    if (e.count <= 0) continue;
    for (let i = 0; i < e.count; i++) {
      instances.push({ edgeId: e.id, a: e.from, b: e.to, dir: e.direction });
    }
  }

  // Empty puzzle — already solved; pick any startEligible node.
  if (instances.length === 0) {
    const start = graph.nodes.find(n => n.startEligible);
    if (!start) return { ok: false, reason: 'No edges to traverse and no startEligible node' };
    return { ok: true, walk: [start.id] };
  }

  const hasDirected = instances.some(e => e.dir !== 'bi');
  const hasUndirected = instances.some(e => e.dir === 'bi');

  if (hasDirected && hasUndirected) {
    return solveMixed(graph, instances);
  }
  if (hasDirected) {
    return solveDirected(graph, instances);
  }
  return solveUndirected(graph, instances);
}

// ————————————————————————————————————————————————————————————————
// Undirected
// ————————————————————————————————————————————————————————————————

function solveUndirected(
  graph: Graph,
  instances: Array<{ edgeId: string; a: string; b: string; dir: 'bi' | 'forward' | 'backward' }>,
): SolveResult {
  // Adjacency: node → list of edge-instance indices
  const adj = new Map<string, number[]>();
  for (const n of graph.nodes) adj.set(n.id, []);
  instances.forEach((e, i) => {
    adj.get(e.a)!.push(i);
    adj.get(e.b)!.push(i);
  });

  // Non-isolated (touched) nodes
  const touched = graph.nodes.filter(n => (adj.get(n.id) ?? []).length > 0);
  if (touched.length === 0) {
    const s = graph.nodes.find(n => n.startEligible);
    return s ? { ok: true, walk: [s.id] } : { ok: false, reason: 'No edges' };
  }

  // Connectivity (among touched nodes)
  const reachable = new Set<string>([touched[0].id]);
  const queue: string[] = [touched[0].id];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const ei of adj.get(cur)!) {
      const e = instances[ei];
      const other = e.a === cur ? e.b : e.a;
      if (!reachable.has(other)) {
        reachable.add(other);
        queue.push(other);
      }
    }
  }
  if (touched.some(n => !reachable.has(n.id))) {
    return { ok: false, reason: 'Edges form disconnected components' };
  }

  // Classify by odd-degree count
  const odd = touched.filter(n => (adj.get(n.id) ?? []).length % 2 !== 0);

  const startEligible = (id: string) => !!graph.nodes.find(n => n.id === id)?.startEligible;

  let start: string;
  if (odd.length === 0) {
    const cand = touched.find(n => startEligible(n.id));
    if (!cand) return { ok: false, reason: 'No startEligible node on the edge-bearing component' };
    start = cand.id;
  } else if (odd.length === 2) {
    // Must start at one of the odd nodes. Prefer a startEligible one.
    const cand = odd.find(n => startEligible(n.id));
    if (!cand) {
      return { ok: false, reason: 'Puzzle requires starting at an odd-degree node, but none are startEligible' };
    }
    start = cand.id;
  } else {
    return { ok: false, reason: `Unsolvable: ${odd.length} odd-degree nodes (need 0 or 2)` };
  }

  return { ok: true, walk: hierholzerUndirected(start, adj, instances) };
}

function hierholzerUndirected(
  start: string,
  adj: Map<string, number[]>,
  instances: Array<{ edgeId: string; a: string; b: string; dir: string }>,
): string[] {
  const used = new Array(instances.length).fill(false);
  const ptr = new Map<string, number>();
  for (const k of adj.keys()) ptr.set(k, 0);

  const stack: string[] = [start];
  const path: string[] = [];
  while (stack.length) {
    const v = stack[stack.length - 1];
    const list = adj.get(v)!;
    let advanced = false;
    while ((ptr.get(v) ?? 0) < list.length) {
      const idx = ptr.get(v)!;
      ptr.set(v, idx + 1);
      const ei = list[idx];
      if (used[ei]) continue;
      used[ei] = true;
      const e = instances[ei];
      const w = e.a === v ? e.b : e.a;
      stack.push(w);
      advanced = true;
      break;
    }
    if (!advanced) path.push(stack.pop()!);
  }
  path.reverse();
  return path;
}

// ————————————————————————————————————————————————————————————————
// Directed
// ————————————————————————————————————————————————————————————————

function solveDirected(
  graph: Graph,
  instances: Array<{ edgeId: string; a: string; b: string; dir: 'bi' | 'forward' | 'backward' }>,
): SolveResult {
  // Normalize each directed edge to a (src, dst) pair.
  type DEdge = { edgeId: string; src: string; dst: string };
  const dedges: DEdge[] = instances.map(e => {
    const src = e.dir === 'backward' ? e.b : e.a;
    const dst = e.dir === 'backward' ? e.a : e.b;
    return { edgeId: e.edgeId, src, dst };
  });

  const outAdj = new Map<string, number[]>();
  const inDeg = new Map<string, number>();
  const outDeg = new Map<string, number>();
  for (const n of graph.nodes) {
    outAdj.set(n.id, []);
    inDeg.set(n.id, 0);
    outDeg.set(n.id, 0);
  }
  dedges.forEach((e, i) => {
    outAdj.get(e.src)!.push(i);
    outDeg.set(e.src, (outDeg.get(e.src) ?? 0) + 1);
    inDeg.set(e.dst, (inDeg.get(e.dst) ?? 0) + 1);
  });

  const touched = graph.nodes.filter(n => (outDeg.get(n.id) ?? 0) + (inDeg.get(n.id) ?? 0) > 0);

  // Underlying connectivity
  const undAdj = new Map<string, Set<string>>();
  for (const n of touched) undAdj.set(n.id, new Set());
  for (const e of dedges) {
    undAdj.get(e.src)?.add(e.dst);
    undAdj.get(e.dst)?.add(e.src);
  }
  const reachable = new Set<string>([touched[0].id]);
  const q: string[] = [touched[0].id];
  while (q.length) {
    const cur = q.shift()!;
    for (const nb of undAdj.get(cur) ?? []) {
      if (!reachable.has(nb)) {
        reachable.add(nb);
        q.push(nb);
      }
    }
  }
  if (touched.some(n => !reachable.has(n.id))) {
    return { ok: false, reason: 'Directed graph disconnected' };
  }

  // Classify
  let startCandidates: string[] = [];
  let circuit = true;
  let diffOne: { plus?: string; minus?: string } = {};
  for (const n of touched) {
    const d = (outDeg.get(n.id) ?? 0) - (inDeg.get(n.id) ?? 0);
    if (d === 0) continue;
    circuit = false;
    if (d === 1 && !diffOne.plus) diffOne.plus = n.id;
    else if (d === -1 && !diffOne.minus) diffOne.minus = n.id;
    else return { ok: false, reason: 'Directed graph not Eulerian (degree imbalance)' };
  }

  const startEligible = (id: string) => !!graph.nodes.find(n => n.id === id)?.startEligible;

  let start: string;
  if (circuit) {
    const cand = touched.find(n => startEligible(n.id));
    if (!cand) return { ok: false, reason: 'No startEligible node on the edge-bearing component' };
    start = cand.id;
  } else {
    if (!diffOne.plus || !diffOne.minus) {
      return { ok: false, reason: 'Directed graph not Eulerian' };
    }
    if (!startEligible(diffOne.plus)) {
      return { ok: false, reason: 'Puzzle requires starting at a specific node, but it is not startEligible' };
    }
    start = diffOne.plus;
  }

  // Hierholzer (directed)
  const used = new Array(dedges.length).fill(false);
  const ptr = new Map<string, number>();
  for (const k of outAdj.keys()) ptr.set(k, 0);
  const stack: string[] = [start];
  const path: string[] = [];
  while (stack.length) {
    const v = stack[stack.length - 1];
    const list = outAdj.get(v)!;
    let advanced = false;
    while ((ptr.get(v) ?? 0) < list.length) {
      const idx = ptr.get(v)!;
      ptr.set(v, idx + 1);
      const ei = list[idx];
      if (used[ei]) continue;
      used[ei] = true;
      stack.push(dedges[ei].dst);
      advanced = true;
      break;
    }
    if (!advanced) path.push(stack.pop()!);
  }
  path.reverse();
  return { ok: true, walk: path };
}

// ————————————————————————————————————————————————————————————————
// Mixed (best-effort): try directed first (treat bi as bi-oriented pair),
// then fall back to undirected (treat directed as bi). Acknowledged as
// incomplete — a fully correct mixed Eulerian solver needs LP/flow.
// ————————————————————————————————————————————————————————————————

function solveMixed(
  graph: Graph,
  instances: Array<{ edgeId: string; a: string; b: string; dir: 'bi' | 'forward' | 'backward' }>,
): SolveResult {
  const asUndirected = solveUndirected(graph, instances);
  if (asUndirected.ok) {
    if (verifyWalk(graph, asUndirected.walk)) return asUndirected;
  }
  return { ok: false, reason: 'Mixed bi/directed graphs are not fully supported by the solver' };
}

// ————————————————————————————————————————————————————————————————
// Verifier — re-plays a walk against the graph to confirm it solves.
// ————————————————————————————————————————————————————————————————

export function verifyWalk(graph: Graph, walk: string[]): boolean {
  if (walk.length === 0) return false;
  const startNode = graph.nodes.find(n => n.id === walk[0]);
  if (!startNode || !startNode.startEligible) return false;
  const remaining = new Map<string, number>();
  for (const e of graph.edges) remaining.set(e.id, e.count);
  for (let i = 1; i < walk.length; i++) {
    const from = walk[i - 1];
    const to = walk[i];
    // Find an edge that connects from→to and still has count
    const edge = graph.edges.find(e => {
      if ((remaining.get(e.id) ?? 0) <= 0) return false;
      if (e.direction === 'bi') return (e.from === from && e.to === to) || (e.from === to && e.to === from);
      if (e.direction === 'forward') return e.from === from && e.to === to;
      if (e.direction === 'backward') return e.to === from && e.from === to;
      return false;
    });
    if (!edge) return false;
    remaining.set(edge.id, (remaining.get(edge.id) ?? 0) - 1);
  }
  for (const v of remaining.values()) {
    if (v > 0) return false;
  }
  return true;
}
