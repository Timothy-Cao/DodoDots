'use client';
import { BloomDefs } from './BloomDefs';
import { NodeView, type NodeVisualState } from './Node';
import { EdgeView } from './Edge';
import { Comet } from './Comet';
import type { Graph } from '@/lib/graph';
import { getNode, getValidNeighbors } from '@/lib/graph';

type Anim = { from: string; to: string } | null;

export function GameBoard({
  graph, current, phase, anim, onNodeClick, onAnimDone,
}: {
  graph: Graph;
  current: string | null;
  phase: 'idle' | 'latched' | 'tracing' | 'won' | 'failed';
  anim: Anim;
  onNodeClick: (id: string) => void;
  onAnimDone: () => void;
}) {
  const validTargets = current ? new Set(getValidNeighbors(graph, current).map(n => n.nodeId)) : new Set<string>();
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <BloomDefs />
      {graph.edges.map(e => {
        const from = getNode(graph, e.from);
        const to = getNode(graph, e.to);
        return from && to ? <EdgeView key={e.id} edge={e} from={from} to={to} /> : null;
      })}
      {graph.nodes.map(n => {
        let state: NodeVisualState = 'idle';
        if (phase === 'idle' && n.startEligible && n.count > 0) state = 'startEligible';
        else if (n.id === current) state = 'current';
        else if (validTargets.has(n.id)) state = 'validTarget';
        return <NodeView key={n.id} node={n} state={state} onClick={onNodeClick} />;
      })}
      {anim && (() => {
        const f = getNode(graph, anim.from), t = getNode(graph, anim.to);
        return f && t ? <Comet from={f} to={t} durationMs={250} onDone={onAnimDone} /> : null;
      })()}
    </svg>
  );
}
