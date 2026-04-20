import type { GraphEdge, GraphNode } from '@/lib/graph';

export function EdgeView({
  edge, from, to, snap = false, recent, cascadeDelay, failFlash,
}: {
  edge: GraphEdge;
  from: GraphNode;
  to: GraphNode;
  snap?: boolean;
  recent?: boolean;
  cascadeDelay?: number;
  failFlash?: boolean;
}) {
  const done = edge.count <= 0;
  const x1 = from.x * 100, y1 = from.y * 100;
  const x2 = to.x * 100, y2 = to.y * 100;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const directed = edge.direction !== 'bi';
  const bright = done || snap;
  const classes = [
    'edge',
    done ? 'edge--done' : 'edge--pending',
    directed && 'edge--directed',
    snap && 'edge--snap',
    recent && !done && 'edge--recent',
    failFlash && 'edge--fail-flash',
  ].filter(Boolean).join(' ');
  const arrowX1 = edge.direction === 'backward' ? x2 : x1;
  const arrowY1 = edge.direction === 'backward' ? y2 : y1;
  const arrowX2 = edge.direction === 'backward' ? x1 : x2;
  const arrowY2 = edge.direction === 'backward' ? y1 : y2;

  const pipColor = done ? 'var(--neon-green)' : 'var(--dim)';

  // Positions along edge for pips
  const p35x = x1 + (x2 - x1) * 0.35, p35y = y1 + (y2 - y1) * 0.35;
  const p65x = x1 + (x2 - x1) * 0.65, p65y = y1 + (y2 - y1) * 0.65;

  const cascadeStyle = cascadeDelay !== undefined && done
    ? { animationDelay: `${cascadeDelay * 80}ms` }
    : undefined;

  return (
    <g className={classes} style={cascadeStyle}>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={bright ? 'var(--neon-green)' : 'var(--dim)'}
        strokeWidth={0.5}
        filter={bright ? 'url(#bloom-bright)' : 'url(#bloom-dim)'}
      />
      {directed && (
        <polygon
          points={arrowHead(arrowX1, arrowY1, arrowX2, arrowY2)}
          fill={done ? 'var(--neon-green)' : 'var(--dim)'}
        />
      )}
      {edge.count === 1 && (
        <circle
          data-testid="pip"
          cx={mx} cy={my} r={0.6}
          fill={pipColor}
          filter={done ? 'url(#bloom-bright)' : 'url(#bloom-dim)'}
        />
      )}
      {edge.count >= 2 && (
        <>
          <circle
            data-testid="pip"
            cx={p35x} cy={p35y} r={0.6}
            fill={pipColor}
            filter={done ? 'url(#bloom-bright)' : 'url(#bloom-dim)'}
          />
          <circle
            data-testid="pip"
            cx={p65x} cy={p65y} r={0.6}
            fill={pipColor}
            filter={done ? 'url(#bloom-bright)' : 'url(#bloom-dim)'}
          />
        </>
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
