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
    mode: 'loose',
    graph: { nodes: [], edges: [] },
  };
}
