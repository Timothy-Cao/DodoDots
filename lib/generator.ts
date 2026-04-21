import { createRng, pickInt } from './rng';
import { placeNodes } from './generator/placement';
import { simulateWalk } from './generator/walk';
import type { Graph } from './graph';

export type GeneratedPuzzle = {
  graph: Graph;
  maxMoves: number;
  solution: string[];
};

export type GeneratorOptions = {
  minNodes?: number;
  maxNodes?: number;
  walkMultiplierMin?: number;
  walkMultiplierMax?: number;
};

export function generateDaily(seed: string, options?: GeneratorOptions): GeneratedPuzzle {
  const {
    minNodes = 6,
    maxNodes = 8,
    walkMultiplierMin = 1.4,
    walkMultiplierMax = 1.8,
  } = options ?? {};

  const rng = createRng(seed);
  const nodeCount = pickInt(rng, minNodes, maxNodes);
  const points = placeNodes(rng, nodeCount);
  const walkLen = Math.round(nodeCount * (walkMultiplierMin + rng() * (walkMultiplierMax - walkMultiplierMin)));
  const walk = simulateWalk(rng, points, walkLen);

  const nodeVisits = new Array(nodeCount).fill(0);
  const edgeVisits = new Map<string, number>();
  nodeVisits[walk.start] = 1;
  for (const s of walk.steps) {
    nodeVisits[s.to]++;
    edgeVisits.set(s.edgeKey, (edgeVisits.get(s.edgeKey) ?? 0) + 1);
  }

  // Collect the set of node indices that appear in the walk (start + all traversed nodes)
  const visitedIndices = new Set<number>([walk.start, ...walk.steps.map(s => s.to)]);

  // Only include nodes that are part of the walk to avoid unvisited isolated nodes
  const nodeIndexMap = new Map<number, string>();
  let nodeIdx = 0;
  const nodes = points
    .map((p, i) => ({ p, i }))
    .filter(({ i }) => visitedIndices.has(i))
    .map(({ p, i }) => {
      const id = `n${nodeIdx++}`;
      nodeIndexMap.set(i, id);
      return {
        id,
        x: p.x,
        y: p.y,
        count: Math.min(Math.max(nodeVisits[i], 1), 3),
        startEligible: true,
      };
    });

  const edges = walk.edges.map((e, i) => ({
    id: `e${i}`,
    from: nodeIndexMap.get(e.a)!,
    to: nodeIndexMap.get(e.b)!,
    count: Math.min(Math.max(edgeVisits.get(`${Math.min(e.a, e.b)}-${Math.max(e.a, e.b)}`) ?? 1, 1), 3),
    direction: 'bi' as const,
  }));

  const startId = nodeIndexMap.get(walk.start)!;
  const solution = [startId, ...walk.steps.map(s => nodeIndexMap.get(s.to)!)];

  return {
    graph: { nodes, edges },
    maxMoves: walk.steps.length,
    solution,
  };
}
