'use client';
import { useState } from 'react';
import { BloomDefs } from './BloomDefs';
import { NodeView, type NodeVisualState } from './Node';
import { EdgeView } from './Edge';
import type { Graph } from '@/lib/graph';
import { getNode, getValidNeighbors } from '@/lib/graph';

export function GameBoard({
  graph, current, phase, onNodeClick,
}: {
  graph: Graph;
  current: string | null;
  phase: 'idle' | 'latched' | 'tracing' | 'won' | 'failed';
  onNodeClick: (id: string) => void;
}) {
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);

  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const p = pt.matrixTransform(ctm.inverse());
    setMouse({ x: p.x / 100, y: p.y / 100 });
  };
  const onMouseLeave = () => setMouse(null);

  // Eligible starts while idle; valid targets while latched (filtered to unlocked)
  const eligibleStarts = new Set(
    phase === 'idle'
      ? graph.nodes.filter(n => n.startEligible && n.count > 0).map(n => n.id)
      : []
  );
  const validTargets = current && phase === 'latched'
    ? new Set(
        getValidNeighbors(graph, current)
          .map(n => n.nodeId)
          .filter(id => (getNode(graph, id)?.count ?? 0) > 0)
      )
    : new Set<string>();

  // Snap selection: nearest valid target to mouse (no threshold — always snap if options exist)
  let snapTargetId: string | null = null;
  let snapEdgeId: string | null = null;
  if (mouse) {
    if (phase === 'idle' && eligibleStarts.size > 0) {
      let best: { id: string; d: number } | null = null;
      for (const id of eligibleStarts) {
        const n = getNode(graph, id)!;
        const d = Math.hypot(mouse.x - n.x, mouse.y - n.y);
        if (!best || d < best.d) best = { id, d };
      }
      snapTargetId = best?.id ?? null;
    } else if (current && phase === 'latched' && validTargets.size > 0) {
      const curNode = getNode(graph, current);
      if (curNode) {
        let best: { nodeId: string; edgeId: string; d: number } | null = null;
        for (const { nodeId, edgeId } of getValidNeighbors(graph, current)) {
          const n = getNode(graph, nodeId);
          if (!n || n.count <= 0) continue;
          const d = Math.hypot(mouse.x - n.x, mouse.y - n.y);
          if (!best || d < best.d) best = { nodeId, edgeId, d };
        }
        snapTargetId = best?.nodeId ?? null;
        snapEdgeId = best?.edgeId ?? null;
      }
    }
  }

  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
      onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
      <BloomDefs />
      {graph.edges.map(e => {
        const from = getNode(graph, e.from);
        const to = getNode(graph, e.to);
        if (!from || !to) return null;
        const snap = e.id === snapEdgeId;
        return <EdgeView key={e.id} edge={e} from={from} to={to} snap={snap} />;
      })}
      {graph.nodes.map(n => {
        let state: NodeVisualState = 'idle';
        if (n.id === current) state = 'current';
        else if (n.id === snapTargetId) state = 'snap';
        else if (eligibleStarts.has(n.id)) state = 'startEligible';
        else if (validTargets.has(n.id)) state = 'validTarget';
        return <NodeView key={n.id} node={n} state={state} onClick={onNodeClick} />;
      })}
    </svg>
  );
}
