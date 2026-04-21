import type { Graph, Mode } from './graph';

export type Level = {
  version: 1;
  id: string;
  title: string;
  maxMoves: number;
  mode: Mode;
  graph: Graph;
};

export function serializeLevel(level: Level): string {
  return JSON.stringify(level, null, 2);
}

export function parseLevel(text: string): { ok: true; level: Level } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object') return { ok: false, error: 'Not an object' };
    if (parsed.version !== 1) return { ok: false, error: 'Unsupported version' };
    if (typeof parsed.title !== 'string') return { ok: false, error: 'Missing title' };
    if (typeof parsed.maxMoves !== 'number') return { ok: false, error: 'Missing maxMoves' };
    if (parsed.mode !== 'strict' && parsed.mode !== 'loose') return { ok: false, error: 'Invalid mode' };
    if (!parsed.graph || !Array.isArray(parsed.graph.nodes) || !Array.isArray(parsed.graph.edges)) {
      return { ok: false, error: 'Invalid graph' };
    }
    // Validate that all node/edge counts are in {1, 2, 3}
    for (const n of parsed.graph.nodes) {
      if (typeof n.count !== 'number' || n.count < 1 || n.count > 3) {
        return { ok: false, error: `Node count out of range [1,3]: ${n.count}` };
      }
    }
    for (const e of parsed.graph.edges) {
      if (typeof e.count !== 'number' || e.count < 1 || e.count > 3) {
        return { ok: false, error: `Edge count out of range [1,3]: ${e.count}` };
      }
    }
    return { ok: true, level: parsed as Level };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Parse error' };
  }
}

export function newDraft(id: string): Level {
  return {
    version: 1,
    id,
    title: 'Untitled',
    maxMoves: 5,
    mode: 'strict',
    graph: { nodes: [], edges: [] },
  };
}
