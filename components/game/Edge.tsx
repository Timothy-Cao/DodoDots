import type { GraphEdge, GraphNode } from '@/lib/graph';

export function EdgeView({ edge, from, to }: { edge: GraphEdge; from: GraphNode; to: GraphNode }) {
  const done = edge.count <= 0;
  const x1 = from.x * 100, y1 = from.y * 100;
  const x2 = to.x * 100, y2 = to.y * 100;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const directed = edge.direction !== 'bi';
  const classes = [
    'edge',
    done ? 'edge--done' : 'edge--pending',
    directed && 'edge--directed',
  ].filter(Boolean).join(' ');
  const arrowX1 = edge.direction === 'backward' ? x2 : x1;
  const arrowY1 = edge.direction === 'backward' ? y2 : y1;
  const arrowX2 = edge.direction === 'backward' ? x1 : x2;
  const arrowY2 = edge.direction === 'backward' ? y1 : y2;
  return (
    <g className={classes}>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={done ? 'var(--neon-green)' : 'var(--dim)'}
        strokeWidth={0.5}
        filter={done ? 'url(#bloom-bright)' : 'url(#bloom-dim)'}
      />
      {directed && (
        <polygon
          points={arrowHead(arrowX1, arrowY1, arrowX2, arrowY2)}
          fill={done ? 'var(--neon-green)' : 'var(--dim)'}
        />
      )}
      {edge.count >= 2 && (
        <text x={mx} y={my - 1.5} textAnchor="middle" className="font-display"
          fontSize={2} fill={done ? 'var(--neon-green)' : 'var(--dim)'}>
          {edge.count}
        </text>
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
