'use client';
import { create } from 'zustand';
import type { GraphNode, GraphEdge, Direction, Mode } from '@/lib/graph';
import type { Level } from '@/lib/level-format';
import { snapToGrid } from '@/lib/grid';

export type Tool = 'select' | 'node' | 'edge';
export type Selection = { type: 'node' | 'edge'; id: string } | null;

type BuilderState = Level & {
  tool: Tool;
  selection: Selection;
  // actions
  setTool: (t: Tool) => void;
  setTitle: (s: string) => void;
  setMaxMoves: (n: number) => void;
  setMode: (m: Mode) => void;
  loadFromLevel: (lvl: Level) => void;
  addNode: (x: number, y: number) => string | null;
  addEdge: (fromId: string, toId: string) => string | null;
  select: (sel: Selection) => void;
  updateSelectedNode: (patch: Partial<GraphNode>) => void;
  updateSelectedEdge: (patch: Partial<GraphEdge>) => void;
  deleteSelected: () => void;
  cycleEdgeDirection: () => void;
  setSelectedCount: (n: number) => void;
  toggleSelectedStart: () => void;
  asLevel: () => Level;
};

export const useBuilderStore = create<BuilderState>((set, get) => ({
  version: 1,
  id: '',
  title: 'Untitled',
  maxMoves: 5,
  mode: 'loose',
  graph: { nodes: [], edges: [] },
  tool: 'select',
  selection: null,

  setTool: (t) => set({ tool: t }),
  setTitle: (s) => set({ title: s }),
  setMaxMoves: (n) => set({ maxMoves: Math.max(1, Math.min(99, n | 0)) }),
  setMode: (m) => set({ mode: m }),

  loadFromLevel: (lvl) => set({
    ...lvl,
    tool: 'select',
    selection: null,
  }),

  addNode: (x, y) => {
    const { x: sx, y: sy } = snapToGrid(x, y);
    const { graph } = get();
    if (graph.nodes.some(n => Math.abs(n.x - sx) < 0.001 && Math.abs(n.y - sy) < 0.001)) {
      return null;
    }
    const id = `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    const node: GraphNode = { id, x: sx, y: sy, count: 1, startEligible: true };
    set(s => ({
      graph: { ...s.graph, nodes: [...s.graph.nodes, node] },
      selection: { type: 'node', id },
    }));
    return id;
  },

  addEdge: (fromId, toId) => {
    if (fromId === toId) return null;
    const { graph } = get();
    const exists = graph.edges.some(e =>
      (e.from === fromId && e.to === toId) || (e.from === toId && e.to === fromId)
    );
    if (exists) return null;
    const id = `e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    const edge: GraphEdge = { id, from: fromId, to: toId, count: 1, direction: 'bi' };
    set(s => ({
      graph: { ...s.graph, edges: [...s.graph.edges, edge] },
      selection: { type: 'edge', id },
    }));
    return id;
  },

  select: (sel) => set({ selection: sel }),

  updateSelectedNode: (patch) => set(s => {
    if (s.selection?.type !== 'node') return s;
    const id = s.selection.id;
    return { graph: { ...s.graph, nodes: s.graph.nodes.map(n => n.id === id ? { ...n, ...patch } : n) } };
  }),

  updateSelectedEdge: (patch) => set(s => {
    if (s.selection?.type !== 'edge') return s;
    const id = s.selection.id;
    return { graph: { ...s.graph, edges: s.graph.edges.map(e => e.id === id ? { ...e, ...patch } : e) } };
  }),

  deleteSelected: () => set(s => {
    if (!s.selection) return s;
    if (s.selection.type === 'node') {
      const nid = s.selection.id;
      return {
        graph: {
          nodes: s.graph.nodes.filter(n => n.id !== nid),
          edges: s.graph.edges.filter(e => e.from !== nid && e.to !== nid),
        },
        selection: null,
      };
    }
    return {
      graph: { ...s.graph, edges: s.graph.edges.filter(e => e.id !== s.selection!.id) },
      selection: null,
    };
  }),

  cycleEdgeDirection: () => {
    const { selection, graph, updateSelectedEdge } = get();
    if (selection?.type !== 'edge') return;
    const cur = graph.edges.find(e => e.id === selection.id);
    if (!cur) return;
    const order: Direction[] = ['bi', 'forward', 'backward'];
    const next = order[(order.indexOf(cur.direction) + 1) % 3];
    updateSelectedEdge({ direction: next });
  },

  setSelectedCount: (n) => {
    const { selection, updateSelectedNode, updateSelectedEdge } = get();
    if (selection?.type === 'node') updateSelectedNode({ count: Math.max(1, Math.min(9, n)) });
    else if (selection?.type === 'edge') updateSelectedEdge({ count: Math.max(1, Math.min(9, n)) });
  },

  toggleSelectedStart: () => {
    const { selection, graph, updateSelectedNode } = get();
    if (selection?.type !== 'node') return;
    const node = graph.nodes.find(n => n.id === selection.id);
    if (!node) return;
    updateSelectedNode({ startEligible: !node.startEligible });
  },

  asLevel: () => {
    const { id, title, maxMoves, mode, graph } = get();
    return { version: 1, id, title, maxMoves, mode, graph };
  },
}));
