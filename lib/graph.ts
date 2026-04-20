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
