'use client';
import { useState } from 'react';
import { BloomDefs } from './BloomDefs';
import { NodeView, type NodeVisualState } from './Node';
import { EdgeView } from './Edge';
import { Comet } from './Comet';
import type { Graph } from '@/lib/graph';
import { getNode, getValidNeighbors } from '@/lib/graph';

type Anim = { from: string; to: string } | null;

const SNAP_THRESHOLD = 0.08;

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
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const p = pt.matrixTransform(ctm.inverse());
    setMouse({ x: p.x / 100, y: p.y / 100 });
  };

  const handleMouseLeave = () => setMouse(null);

  // Only show valid targets that are unlocked (count > 0)
  const validTargets = current
    ? new Set(
        getValidNeighbors(graph, current)
          .map(n => n.nodeId)
          .filter(id => (getNode(graph, id)?.count ?? 0) > 0)
      )
    : new Set<string>();

  // Compute snap target: nearest valid neighbor within threshold
  let snapTarget: string | null = null;
  if (current && mouse && !anim && (phase === 'latched' || phase === 'tracing')) {
    const curNode = getNode(graph, current);
    if (curNode) {
      const neighbors = getValidNeighbors(graph, current);
      let best: { id: string; d: number } | null = null;
      for (const { nodeId } of neighbors) {
        const n = getNode(graph, nodeId);
        if (!n || n.count <= 0) continue; // locked
        const d = Math.hypot(mouse.x - n.x, mouse.y - n.y);
        if (d < SNAP_THRESHOLD && (!best || d < best.d)) best = { id: nodeId, d };
      }
      snapTarget = best?.id ?? null;
    }
  }

  return (
    <svg
      viewBox="0 0 100 100"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <BloomDefs />
      {graph.edges.map(e => {
        const from = getNode(graph, e.from);
        const to = getNode(graph, e.to);
        return from && to ? <EdgeView key={e.id} edge={e} from={from} to={to} /> : null;
      })}
      {/* Ghost line: rendered after edges, before nodes */}
      {current && mouse && !anim && (phase === 'latched' || phase === 'tracing') && (() => {
        const curNode = getNode(graph, current);
        if (!curNode) return null;
        const tgt = snapTarget ? getNode(graph, snapTarget) : null;
        const x2 = (tgt ?? mouse).x * 100;
        const y2 = (tgt ?? mouse).y * 100;
        return (
          <line
            x1={curNode.x * 100}
            y1={curNode.y * 100}
            x2={x2}
            y2={y2}
            stroke={tgt ? 'var(--neon-green)' : 'var(--cyan)'}
            strokeWidth={tgt ? 0.6 : 0.3}
            strokeDasharray="1.5,1.5"
            opacity={0.7}
            filter={tgt ? 'url(#bloom-bright)' : undefined}
            style={{ pointerEvents: 'none' }}
          />
        );
      })()}
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
