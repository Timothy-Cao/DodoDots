export type Direction = 'bi' | 'forward' | 'backward';

/** Dimensions of the SVG viewBox (in viewBox units). Nodes have x,y in [0,1]. */
export type ViewBoxDims = { w: number; h: number };

export type GraphNode = {
  id: string;
  x: number;
  y: number;
  count: number;
  startEligible: boolean;
};

export type GraphEdge = {
  id: string;
  from: string;
  to: string;
  count: number;
  direction: Direction;
};

export type Graph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export function isSolved(g: Graph): boolean {
  return g.nodes.every(n => n.count <= 0) && g.edges.every(e => e.count <= 0);
}

export type Neighbor = { nodeId: string; edgeId: string };

export function getValidNeighbors(g: Graph, fromId: string): Neighbor[] {
  const out: Neighbor[] = [];
  for (const e of g.edges) {
    if (e.from === fromId && (e.direction === 'bi' || e.direction === 'forward')) {
      out.push({ nodeId: e.to, edgeId: e.id });
    } else if (e.to === fromId && (e.direction === 'bi' || e.direction === 'backward')) {
      out.push({ nodeId: e.from, edgeId: e.id });
    }
  }
  return out;
}

export function findEdge(g: Graph, fromId: string, toId: string): GraphEdge | undefined {
  return getValidNeighbors(g, fromId)
    .filter(n => n.nodeId === toId)
    .map(n => g.edges.find(e => e.id === n.edgeId))
    .find(Boolean);
}

export function getNode(g: Graph, id: string): GraphNode | undefined {
  return g.nodes.find(n => n.id === id);
}

export function findUnreachableEdge(g: Graph): string | null {
  for (const e of g.edges) {
    if (e.count <= 0) continue;
    const from = getNode(g, e.from);
    const to = getNode(g, e.to);
    if ((from?.count ?? 1) <= 0 && (to?.count ?? 1) <= 0) return e.id;
  }
  return null;
}

export function hasUnreachableEdge(g: Graph): boolean {
  return findUnreachableEdge(g) !== null;
}
