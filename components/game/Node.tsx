'use client';
import type { GraphNode } from '@/lib/graph';

export type NodeVisualState = 'idle' | 'startEligible' | 'current' | 'validTarget' | 'snap';

export function NodeView({
  node,
  state,
  onClick,
  recent,
}: {
  node: GraphNode;
  state: NodeVisualState;
  onClick: (id: string) => void;
  recent?: boolean;
}) {
  const done = node.count <= 0;
  const snapActive = state === 'snap';
  const cx = node.x * 100;
  const cy = node.y * 100;
  const classes = [
    'node',
    done ? 'node--done' : 'node--pending',
    state === 'startEligible' && 'node--pulse',
    state === 'current' && 'node--current',
    state === 'validTarget' && 'node--target',
    snapActive && 'node--snap',
    recent && !done && 'node--recent',
  ].filter(Boolean).join(' ');

  const pipColor = done ? 'var(--neon-green)' : 'var(--cyan)';

  return (
    <g className={classes} onClick={() => onClick(node.id)} style={{ cursor: 'pointer' }}>
      <circle
        cx={cx} cy={cy} r={3}
        fill={done ? 'var(--neon-green)' : (snapActive ? 'var(--neon-green)' : 'var(--dim)')}
        filter={done || snapActive ? 'url(#bloom-bright)' : 'url(#bloom-dim)'}
      />
      {node.count === 1 && (
        <circle
          data-testid="pip"
          cx={cx} cy={cy} r={0.6}
          fill={pipColor}
          filter="url(#bloom-bright)"
        />
      )}
      {node.count >= 2 && (
        <>
          <circle
            data-testid="pip"
            cx={cx - 1} cy={cy} r={0.6}
            fill={pipColor}
            filter="url(#bloom-bright)"
          />
          <circle
            data-testid="pip"
            cx={cx + 1} cy={cy} r={0.6}
            fill={pipColor}
            filter="url(#bloom-bright)"
          />
        </>
      )}
    </g>
  );
}
