export type Direction = 'bi' | 'forward' | 'backward';

export type Mode = 'strict' | 'loose';

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
  return g.edges.every(e => e.count <= 0);
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

export function findUnreachableEdge(_g: Graph): string | null {
  // Nodes no longer lock based on visit count, so edges are not rendered
  // unreachable purely by their endpoints' counters hitting 0.
  return null;
}

export function hasUnreachableEdge(g: Graph): boolean {
  return findUnreachableEdge(g) !== null;
}

export function hasNoValidMoves(g: Graph, currentNodeId: string, mode: Mode = 'loose'): boolean {
  const neighbors = getValidNeighbors(g, currentNodeId);
  if (neighbors.length === 0) return true;
  // Nodes no longer lock based on count. In strict mode, an edge at count <= 0
  // is locked and cannot be retraversed; in loose mode any neighbor is reachable.
  if (mode !== 'strict') return false;
  return neighbors.every(n => {
    const edge = g.edges.find(e => e.id === n.edgeId);
    return edge ? edge.count <= 0 : true;
  });
}
