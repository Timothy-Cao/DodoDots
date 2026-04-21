'use client';
import { useEffect, useRef, useState } from 'react';
import { BloomDefs } from '@/components/game/BloomDefs';
import { NodeView } from '@/components/game/Node';
import { EdgeView } from '@/components/game/Edge';
import { GridDots } from './GridDots';
import { useBuilderStore } from '@/stores/builderStore';
import { snapToGrid } from '@/lib/grid';
import { getNode } from '@/lib/graph';
import type { ViewBoxDims } from '@/lib/graph';

export function BuilderCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [vbDims, setVbDims] = useState<ViewBoxDims>({ w: 100, h: 100 });

  // Rubber-band edge drag state
  const [edgeDrag, setEdgeDrag] = useState<{
    fromId: string;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
  } | null>(null);

  const { graph, tool, selection, addNode, addEdge, select, updateSelectedNode } = useBuilderStore();

  // Resize observer — match GameBoard pattern
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

  // Convert SVG pointer event to normalized [0,1] coordinates
  function svgToNorm(e: React.PointerEvent<SVGSVGElement>): { x: number; y: number } {
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0.5, y: 0.5 };
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x / vbW, y: p.y / vbH };
  }

  // Find which node (if any) is near a normalized coordinate
  function nodeAt(nx: number, ny: number): string | null {
    const HIT_RADIUS = 0.06; // ~6% of the unit space
    let best: { id: string; d: number } | null = null;
    for (const n of graph.nodes) {
      const d = Math.hypot(nx - n.x, ny - n.y);
      if (d < HIT_RADIUS && (!best || d < best.d)) best = { id: n.id, d };
    }
    return best?.id ?? null;
  }

  // Find which edge (if any) is near a normalized coordinate (line-point distance)
  function edgeAt(nx: number, ny: number): string | null {
    const HIT_DIST = 0.04;
    let best: { id: string; d: number } | null = null;
    for (const e of graph.edges) {
      const from = getNode(graph, e.from);
      const to = getNode(graph, e.to);
      if (!from || !to) continue;
      // Point-to-line-segment distance
      const dx = to.x - from.x, dy = to.y - from.y;
      const lenSq = dx * dx + dy * dy;
      let t = lenSq === 0 ? 0 : ((nx - from.x) * dx + (ny - from.y) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
      const projX = from.x + t * dx, projY = from.y + t * dy;
      const d = Math.hypot(nx - projX, ny - projY);
      if (d < HIT_DIST && (!best || d < best.d)) best = { id: e.id, d };
    }
    return best?.id ?? null;
  }

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    const { x: nx, y: ny } = svgToNorm(e);

    if (tool === 'node') {
      const hitNode = nodeAt(nx, ny);
      if (hitNode) {
        select({ type: 'node', id: hitNode });
        return;
      }
      addNode(nx, ny);
      return;
    }

    if (tool === 'edge') {
      const hitNode = nodeAt(nx, ny);
      if (hitNode) {
        const n = getNode(graph, hitNode)!;
        e.currentTarget.setPointerCapture(e.pointerId);
        setEdgeDrag({ fromId: hitNode, fromX: n.x, fromY: n.y, toX: n.x, toY: n.y });
      }
      return;
    }

    if (tool === 'select') {
      const hitNode = nodeAt(nx, ny);
      if (hitNode) {
        select({ type: 'node', id: hitNode });
        return;
      }
      const hitEdge = edgeAt(nx, ny);
      if (hitEdge) {
        select({ type: 'edge', id: hitEdge });
        return;
      }
      select(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!edgeDrag) return;
    const { x: nx, y: ny } = svgToNorm(e);
    setEdgeDrag(prev => prev ? { ...prev, toX: nx, toY: ny } : null);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!edgeDrag) return;
    const { x: nx, y: ny } = svgToNorm(e);
    const hitNode = nodeAt(nx, ny);
    if (hitNode && hitNode !== edgeDrag.fromId) {
      addEdge(edgeDrag.fromId, hitNode);
    }
    setEdgeDrag(null);
  };

  const selectedNodeIds = new Set<string>();
  const selectedEdgeIds = new Set<string>();
  if (selection?.type === 'node') selectedNodeIds.add(selection.id);
  if (selection?.type === 'edge') selectedEdgeIds.add(selection.id);

  return (
    <div ref={containerRef} className="builder-canvas-container">
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        className="builder-svg"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setEdgeDrag(null)}
        style={{ cursor: tool === 'node' ? 'crosshair' : tool === 'edge' ? 'cell' : 'default' }}
      >
        <BloomDefs />
        <GridDots viewBox={vbDims} />

        {/* Edges */}
        {graph.edges.map(e => {
          const from = getNode(graph, e.from);
          const to = getNode(graph, e.to);
          if (!from || !to) return null;
          const isSelected = selectedEdgeIds.has(e.id);
          return (
            <g key={e.id} style={{ filter: isSelected ? 'brightness(2)' : undefined }}>
              {/* Wider invisible hit target for edge selection */}
              <line
                x1={from.x * vbW} y1={from.y * vbH}
                x2={to.x * vbW} y2={to.y * vbH}
                stroke="transparent"
                strokeWidth={5}
                style={{ cursor: tool === 'select' ? 'pointer' : 'default' }}
              />
              <EdgeView
                edge={e}
                from={from}
                to={to}
                viewBox={vbDims}
                initialCount={e.count}
              />
            </g>
          );
        })}

        {/* Nodes */}
        {graph.nodes.map(n => {
          const isSelected = selectedNodeIds.has(n.id);
          return (
            <g key={n.id} style={{ filter: isSelected ? 'brightness(2)' : undefined }}>
              <NodeView
                node={n}
                state={n.startEligible ? 'startEligible' : 'idle'}
                onClick={() => {
                  if (tool === 'select' || tool === 'node') select({ type: 'node', id: n.id });
                }}
                viewBox={vbDims}
                initialCount={n.count}
                isStartableInIdle={n.startEligible}
              />
            </g>
          );
        })}

        {/* Rubber-band line during edge drag */}
        {edgeDrag && (
          <line
            x1={edgeDrag.fromX * vbW}
            y1={edgeDrag.fromY * vbH}
            x2={edgeDrag.toX * vbW}
            y2={edgeDrag.toY * vbH}
            stroke="var(--cyan)"
            strokeWidth={0.8}
            strokeDasharray="2 1"
            opacity={0.7}
            pointerEvents="none"
          />
        )}
      </svg>
    </div>
  );
}
