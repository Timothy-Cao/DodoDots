import type { GraphEdge, GraphNode, ViewBoxDims } from '@/lib/graph';
import { bezierControl, bezierPoint, bezierTangent } from '@/lib/layout';

export function EdgeView({
  edge, from, to, snap = false, recent, cascadeDelay, failFlash,
  isVisited, flash, isFailed, initialCount,
  viewBox = { w: 100, h: 100 },
  curvature = 0,
}: {
  edge: GraphEdge;
  from: GraphNode;
  to: GraphNode;
  snap?: boolean;
  recent?: boolean;
  cascadeDelay?: number;
  failFlash?: boolean;
  isVisited?: boolean;
  flash?: boolean;
  isFailed?: boolean;
  initialCount?: number;
  viewBox?: ViewBoxDims;
  curvature?: number;
}) {
  const done = edge.count <= 0;
  const x1 = from.x * viewBox.w, y1 = from.y * viewBox.h;
  const x2 = to.x * viewBox.w, y2 = to.y * viewBox.h;
  const directed = edge.direction !== 'bi';
  const bright = done || snap;

  // Determine stroke color — snap is cyan (distinct from done's neon-green)
  let strokeColor: string;
  if (isFailed) {
    strokeColor = 'var(--danger)';
  } else if (done) {
    strokeColor = 'var(--neon-green)';
  } else if (snap) {
    strokeColor = 'var(--cyan)';
  } else if (isVisited) {
    strokeColor = 'color-mix(in srgb, var(--cyan) 50%, var(--dim) 50%)';
  } else {
    strokeColor = 'var(--edge-pending)';
  }

  const winwave = cascadeDelay !== undefined && done;

  const classes = [
    'edge',
    done ? 'edge--done' : 'edge--pending',
    directed && 'edge--directed',
    snap && 'edge--snap',
    recent && !done && 'edge--recent',
    failFlash && 'edge--fail-flash',
    flash && 'edge--flash',
    isFailed && 'edge--failed',
    winwave && 'edge--winwave',
  ].filter(Boolean).join(' ');

  // Bezier curve support
  const useCurve = curvature !== 0;
  const p0 = { x: x1, y: y1 };
  const p2 = { x: x2, y: y2 };
  // bezierControl works in viewBox space already (coordinates are already scaled)
  const cp = useCurve
    ? bezierControl(p0, p2, curvature, viewBox.w, viewBox.h)
    : { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };

  const pathD = useCurve ? `M ${x1} ${y1} Q ${cp.x} ${cp.y} ${x2} ${y2}` : null;

  // Tick position helper — returns point and tangent at parameter t along the edge
  function tickAt(t: number): { pos: { x: number; y: number }; tangent: { x: number; y: number } } {
    if (useCurve) {
      return {
        pos: bezierPoint(t, p0, cp, p2),
        tangent: bezierTangent(t, p0, cp, p2),
      };
    }
    const tx = x2 - x1, ty = y2 - y1;
    const len = Math.hypot(tx, ty) || 1;
    return {
      pos: { x: x1 + tx * t, y: y1 + ty * t },
      tangent: { x: tx / len, y: ty / len },
    };
  }

  // Tick mark rendering (replaces circle pips on edges)
  const totalPips = initialCount ?? edge.count;
  const filledPips = done ? totalPips : (isVisited ? (totalPips - edge.count) : 0);
  const showPips = !done && totalPips <= 2;
  const halfTick = 1.0; // half of tick length 2.0

  // Compute tick lines as { x1, y1, x2, y2 } using bezier-aware positions
  function makeTick(t: number) {
    const { pos, tangent } = tickAt(t);
    // Perpendicular to tangent: (-tangent.y, tangent.x)
    const px = -tangent.y, py = tangent.x;
    return {
      x1: pos.x - px * halfTick,
      y1: pos.y - py * halfTick,
      x2: pos.x + px * halfTick,
      y2: pos.y + py * halfTick,
    };
  }

  const tick1 = showPips && totalPips >= 1 ? makeTick(totalPips === 1 ? 0.5 : 0.35) : null;
  const tick2 = showPips && totalPips === 2 ? makeTick(0.65) : null;

  const cascadeStyle = cascadeDelay !== undefined && done
    ? { animationDelay: `${cascadeDelay * 80}ms` }
    : undefined;

  // Arrow direction (directed edges only, straight-line geometry only for now)
  // TODO: compute bezier-aware arrow position when useCurve && directed
  const arrowX1 = edge.direction === 'backward' ? x2 : x1;
  const arrowY1 = edge.direction === 'backward' ? y2 : y1;
  const arrowX2 = edge.direction === 'backward' ? x1 : x2;
  const arrowY2 = edge.direction === 'backward' ? y1 : y2;

  return (
    <g className={classes} style={cascadeStyle}>
      {useCurve ? (
        <path
          d={pathD!}
          fill="none"
          stroke={strokeColor}
          strokeWidth={done ? 1.3 : (snap ? 1.2 : 1.0)}
          strokeDasharray={snap ? '2 1' : undefined}
          filter={bright ? 'url(#bloom-bright)' : undefined}
        />
      ) : (
        <line
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={strokeColor}
          strokeWidth={done ? 1.3 : (snap ? 1.2 : 1.0)}
          strokeDasharray={snap ? '2 1' : undefined}
          filter={bright ? 'url(#bloom-bright)' : undefined}
        />
      )}
      {directed && !useCurve && (
        <polygon
          points={arrowHead(arrowX1, arrowY1, arrowX2, arrowY2)}
          fill={done ? 'var(--neon-green)' : (isFailed ? 'var(--danger)' : 'var(--dim)')}
        />
      )}
      {/* Perpendicular tick marks for pending edges (count 1 or 2) */}
      {/* Done state: no ticks — bright green edge conveys done */}
      {tick1 && (
        <line
          data-testid="pip"
          x1={tick1.x1} y1={tick1.y1}
          x2={tick1.x2} y2={tick1.y2}
          stroke={filledPips >= 1 ? 'var(--neon-green)' : 'var(--edge-pending)'}
          strokeWidth={0.9}
          filter={filledPips >= 1 ? 'url(#bloom-bright)' : undefined}
        />
      )}
      {tick2 && (
        <line
          data-testid="pip"
          x1={tick2.x1} y1={tick2.y1}
          x2={tick2.x2} y2={tick2.y2}
          stroke={filledPips >= 2 ? 'var(--neon-green)' : 'var(--edge-pending)'}
          strokeWidth={0.9}
          filter={filledPips >= 2 ? 'url(#bloom-bright)' : undefined}
        />
      )}
    </g>
  );
}

function arrowHead(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  const tipDist = len * 0.7;
  const tx = x1 + ux * tipDist, ty = y1 + uy * tipDist;
  const size = 1.5;
  const p1x = tx - ux * size - uy * size * 0.6;
  const p1y = ty - uy * size + ux * size * 0.6;
  const p2x = tx - ux * size + uy * size * 0.6;
  const p2y = ty - uy * size - ux * size * 0.6;
  return `${tx},${ty} ${p1x},${p1y} ${p2x},${p2y}`;
}
