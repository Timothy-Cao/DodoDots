export type Direction = 'bi' | 'forward' | 'backward';

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
