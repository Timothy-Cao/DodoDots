'use client';
import { useEffect, useRef, useState } from 'react';
import { BloomDefs } from './BloomDefs';
import { NodeView, type NodeVisualState } from './Node';
import { EdgeView } from './Edge';
import { CommitPulse } from './CommitPulse';
import type { Graph, ViewBoxDims } from '@/lib/graph';
import { getNode, getValidNeighbors } from '@/lib/graph';

export type PulseEntry = { id: string; x: number; y: number; color: string };

type LastCommit = { nodeId: string; edgeId: string; at: number } | null;

export function GameBoard({
  graph, current, phase, onNodeClick, pulses = [], onPulseDone,
  recentNodes, recentEdges, failEdgeId,
  initialGraph, lastCommit, failedEdge, onCommitAnimationDone,
}: {
  graph: Graph;
  current: string | null;
  phase: 'idle' | 'latched' | 'tracing' | 'won' | 'failed';
  onNodeClick: (id: string) => void;
  pulses?: PulseEntry[];
  onPulseDone?: (id: string) => void;
  recentNodes?: Set<string>;
  recentEdges?: Set<string>;
  failEdgeId?: string | null;
  initialGraph?: Graph;
  lastCommit?: LastCommit;
  failedEdge?: string | null;
  onCommitAnimationDone?: () => void;
}) {
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [vbDims, setVbDims] = useState<ViewBoxDims>({ w: 100, h: 100 });

  // Track container size so viewBox matches aspect ratio (fills play area on any screen shape)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      const aspect = width / height;
      if (aspect >= 1) {
        setVbDims({ w: 100 * aspect, h: 100 });
      } else {
        setVbDims({ w: 100, h: 100 / aspect });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w: vbW, h: vbH } = vbDims;

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.pointerType === 'touch') return; // no hover preview on touch — fingers occlude
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const p = pt.matrixTransform(ctm.inverse());
    setMouse({ x: p.x / vbW, y: p.y / vbH });
  };
  const onPointerLeave = () => setMouse(null);

  // Clear lastCommit after animation window
  useEffect(() => {
    if (lastCommit && onCommitAnimationDone) {
      const t = setTimeout(onCommitAnimationDone, 200);
      return () => clearTimeout(t);
    }
  }, [lastCommit, onCommitAnimationDone]);

  // Eligible starts while idle; valid targets while latched.
  // Node counts no longer gate traversal, so any neighbor is a valid target.
  const eligibleStarts = new Set(
    phase === 'idle'
      ? graph.nodes.filter(n => n.startEligible).map(n => n.id)
      : []
  );
  const validTargets = current && phase === 'latched'
    ? new Set(
        getValidNeighbors(graph, current).map(n => n.nodeId)
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
      let best: { nodeId: string; edgeId: string; d: number } | null = null;
      for (const { nodeId, edgeId } of getValidNeighbors(graph, current)) {
        const n = getNode(graph, nodeId);
        if (!n) continue;
        const d = Math.hypot(mouse.x - n.x, mouse.y - n.y);
        if (!best || d < best.d) best = { nodeId, edgeId, d };
      }
      snapTargetId = best?.nodeId ?? null;
      snapEdgeId = best?.edgeId ?? null;
    }
  }

  // BFS distances from current for win cascade
  const cascadeDistances = new Map<string, number>();
  if (phase === 'won' && current) {
    const queue: Array<{ id: string; dist: number }> = [{ id: current, dist: 0 }];
    cascadeDistances.set(current, 0);
    while (queue.length > 0) {
      const { id, dist } = queue.shift()!;
      for (const { nodeId } of getValidNeighbors(graph, id)) {
        if (!cascadeDistances.has(nodeId)) {
          cascadeDistances.set(nodeId, dist + 1);
          queue.push({ id: nodeId, dist: dist + 1 });
        }
      }
    }
    // Also try reverse direction for BFS completeness
    for (const n of graph.nodes) {
      if (!cascadeDistances.has(n.id)) cascadeDistances.set(n.id, 5);
    }
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg viewBox={`0 0 ${vbW} ${vbH}`} width="100%" height="100%" preserveAspectRatio="none"
        className="game-svg"
        onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
        <BloomDefs />
        {graph.edges.map(e => {
          const from = getNode(graph, e.from);
          const to = getNode(graph, e.to);
          if (!from || !to) return null;
          const snap = e.id === snapEdgeId;
          const recent = recentEdges?.has(e.id);
          const failFlash = failEdgeId === e.id;
          // cascade delay: max of endpoint distances
          const dFrom = cascadeDistances.get(e.from) ?? 0;
          const dTo = cascadeDistances.get(e.to) ?? 0;
          const cascadeDelay = phase === 'won' ? Math.max(dFrom, dTo) : undefined;

          // Breadcrumb: isVisited = initialCount > currentCount && currentCount > 0
          const initialEdge = initialGraph?.edges.find(ie => ie.id === e.id);
          const isEdgeVisited = initialEdge !== undefined && initialEdge.count > e.count && e.count > 0;
          const flash = !!(lastCommit && e.id === lastCommit.edgeId);
          const isFailed = e.id === (failedEdge ?? failEdgeId ?? null);

          return (
            <EdgeView key={e.id} edge={e} from={from} to={to} snap={snap}
              recent={recent} cascadeDelay={cascadeDelay} failFlash={failFlash}
              isVisited={isEdgeVisited}
              flash={flash}
              isFailed={isFailed}
              initialCount={initialEdge?.count ?? e.count}
              viewBox={vbDims}
            />
          );
        })}
        {graph.nodes.map(n => {
          let state: NodeVisualState = 'idle';
          if (n.id === current) state = 'current';
          else if (n.id === snapTargetId) state = 'snap';
          else if (eligibleStarts.has(n.id)) state = 'startEligible';
          else if (validTargets.has(n.id)) state = 'validTarget';
          const recent = recentNodes?.has(n.id);
          const cascadeDelay = phase === 'won' ? (cascadeDistances.get(n.id) ?? 0) : undefined;

          // Idle state hierarchy — node counts no longer gate anything, so
          // start-eligibility is purely driven by the `startEligible` flag.
          const isStartableInIdle = phase === 'idle' && n.startEligible;
          const dimInIdle = phase === 'idle' && !isStartableInIdle;

          // Commit pulse
          const pulse = !!(lastCommit && n.id === lastCommit.nodeId);

          return (
            <NodeView key={n.id} node={n} state={state} onClick={onNodeClick}
              recent={recent}
              cascadeDelay={cascadeDelay}
              isStartableInIdle={isStartableInIdle}
              dimInIdle={dimInIdle}
              pulse={pulse}
              forceDone={phase === 'won'}
              viewBox={vbDims}
            />
          );
        })}
        {pulses.map(p => (
          <CommitPulse key={p.id} x={p.x} y={p.y} color={p.color}
            onDone={() => onPulseDone?.(p.id)}
            viewBox={vbDims}
          />
        ))}
      </svg>
    </div>
  );
}
