import type { GraphEdge, GraphNode, ViewBoxDims } from '@/lib/graph';

export function EdgeView({
  edge, from, to, snap = false, recent, cascadeDelay, failFlash,
  isVisited, flash, isFailed, initialCount,
  viewBox = { w: 100, h: 100 },
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
}) {
  const done = edge.count <= 0;
  const x1 = from.x * viewBox.w, y1 = from.y * viewBox.h;
  const x2 = to.x * viewBox.w, y2 = to.y * viewBox.h;
  const directed = edge.direction !== 'bi';

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

  const cascadeStyle = cascadeDelay !== undefined && done
    ? { animationDelay: `${cascadeDelay * 80}ms` }
    : undefined;

  // Perpendicular unit vector
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len, py = dx / len; // perpendicular

  const SUBLINE_SPACING = 0.9; // viewBox units between adjacent sublines
  const totalSubLines = initialCount ?? edge.count;
  const SUBLINE_STROKE = totalSubLines >= 2 ? 0.8 : 1.0;

  // For N sub-lines, offsets are evenly spaced around 0.
  // N=1: [0], N=2: [+0.5, -0.5] * SPACING, N=3: [+1, 0, -1] * SPACING
  function subLineOffsets(n: number): number[] {
    if (n === 1) return [0];
    if (n === 2) return [0.5, -0.5];
    return [1, 0, -1]; // n === 3
  }

  // Count how many sub-lines are "consumed" (green)
  const consumed = totalSubLines - edge.count;

  // Arrow direction (directed edges only)
  const arrowX1 = edge.direction === 'backward' ? x2 : x1;
  const arrowY1 = edge.direction === 'backward' ? y2 : y1;
  const arrowX2 = edge.direction === 'backward' ? x1 : x2;
  const arrowY2 = edge.direction === 'backward' ? y1 : y2;

  const offsets = subLineOffsets(totalSubLines);

  return (
    <g className={classes} style={cascadeStyle}>
      {offsets.map((offsetMult, k) => {
        const offset = offsetMult * SUBLINE_SPACING;
        const lx1 = x1 + px * offset;
        const ly1 = y1 + py * offset;
        const lx2 = x2 + px * offset;
        const ly2 = y2 + py * offset;

        const isGreen = k < consumed;

        let strokeColor: string;
        if (isFailed) {
          strokeColor = 'var(--danger)';
        } else if (snap) {
          strokeColor = 'var(--cyan)';
        } else if (isGreen) {
          strokeColor = 'var(--neon-green)';
        } else if (isVisited) {
          strokeColor = 'color-mix(in srgb, var(--cyan) 50%, var(--dim) 50%)';
        } else {
          strokeColor = 'var(--edge-pending)';
        }

        const bright = isGreen || snap;

        return (
          <line
            key={k}
            data-testid="subline"
            x1={lx1} y1={ly1} x2={lx2} y2={ly2}
            stroke={strokeColor}
            strokeWidth={snap ? 1.2 : SUBLINE_STROKE}
            strokeDasharray={snap ? '2 1' : undefined}
            filter={bright ? 'url(#bloom-bright)' : undefined}
          />
        );
      })}
      {directed && (
        <polygon
          points={arrowHead(arrowX1, arrowY1, arrowX2, arrowY2)}
          fill={done ? 'var(--neon-green)' : (isFailed ? 'var(--danger)' : 'var(--dim)')}
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
