'use client';
import type { GraphNode } from '@/lib/graph';

export type NodeVisualState = 'idle' | 'startEligible' | 'current' | 'validTarget' | 'snap';

export function NodeView({
  node,
  state,
  onClick,
  recent,
  dim,
  cascadeDelay,
}: {
  node: GraphNode;
  state: NodeVisualState;
  onClick: (id: string) => void;
  recent?: boolean;
  dim?: boolean;
  cascadeDelay?: number;
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
    dim && 'node--dim',
    cascadeDelay !== undefined && done && 'cascade-pulse',
  ].filter(Boolean).join(' ');

  const cascadeStyle = cascadeDelay !== undefined && done
    ? { animationDelay: `${cascadeDelay * 80}ms` }
    : undefined;

  const pipColor = done ? 'var(--neon-green)' : 'var(--cyan)';

  return (
    <g className={classes} onClick={() => onClick(node.id)} style={{ cursor: 'pointer', ...cascadeStyle }}>
      {state === 'startEligible' && (
        <circle
          className="node-halo"
          cx={cx} cy={cy} r={5}
          fill="none"
          stroke="var(--cyan)"
          strokeWidth={0.2}
          opacity={0.6}
        />
      )}
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
