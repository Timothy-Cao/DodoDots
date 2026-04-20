'use client';
import type { GraphNode } from '@/lib/graph';

export type NodeVisualState = 'idle' | 'startEligible' | 'current' | 'validTarget';

export function NodeView({
  node,
  state,
  onClick,
}: {
  node: GraphNode;
  state: NodeVisualState;
  onClick: (id: string) => void;
}) {
  const done = node.count <= 0;
  const cx = node.x * 100;
  const cy = node.y * 100;
  const classes = [
    'node',
    done ? 'node--done' : 'node--pending',
    state === 'startEligible' && 'node--pulse',
    state === 'current' && 'node--current',
    state === 'validTarget' && 'node--target',
  ].filter(Boolean).join(' ');

  return (
    <g className={classes} onClick={() => onClick(node.id)} style={{ cursor: 'pointer' }}>
      <circle
        cx={cx} cy={cy} r={3}
        fill={done ? 'var(--neon-green)' : 'var(--dim)'}
        filter={done ? 'url(#bloom-bright)' : 'url(#bloom-dim)'}
      />
      {node.count >= 2 && (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
          className="font-display" fontSize={2.5} fill="#05070d">
          {node.count}
        </text>
      )}
    </g>
  );
}
