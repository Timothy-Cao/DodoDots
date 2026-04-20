'use client';
import type { GraphNode } from '@/lib/graph';

export type NodeVisualState = 'idle' | 'startEligible' | 'current' | 'validTarget' | 'snap';

export function NodeView({
  node,
  state,
  isVisited,
  isStartableInIdle,
  dimInIdle,
  pulse,
  initialCount,
  onClick,
  recent,
  cascadeDelay,
}: {
  node: GraphNode;
  state: NodeVisualState;
  onClick: (id: string) => void;
  isVisited?: boolean;
  isStartableInIdle?: boolean;
  dimInIdle?: boolean;
  pulse?: boolean;
  initialCount?: number;
  recent?: boolean;
  cascadeDelay?: number;
}) {
  const done = node.count <= 0;
  const snapActive = state === 'snap';
  const cx = node.x * 100;
  const cy = node.y * 100;

  // Determine fill and filter based on state
  let fill: string;
  let bloomFilter: string;
  if (done || snapActive) {
    fill = 'var(--neon-green)';
    bloomFilter = 'url(#bloom-bright)';
  } else if (isVisited) {
    fill = 'color-mix(in srgb, var(--cyan) 30%, var(--dim) 70%)';
    bloomFilter = 'url(#bloom-dim)';
  } else {
    fill = 'var(--dim)';
    bloomFilter = 'url(#bloom-dim)';
  }

  const classes = [
    'node',
    done ? 'node--done' : 'node--pending',
    state === 'startEligible' && 'node--pulse',
    state === 'current' && 'node--current',
    state === 'validTarget' && 'node--target',
    snapActive && 'node--snap',
    recent && !done && 'node--recent',
    dimInIdle && 'node--dim',
    cascadeDelay !== undefined && done && 'cascade-pulse',
  ].filter(Boolean).join(' ');

  const cascadeStyle = cascadeDelay !== undefined && done
    ? { animationDelay: `${cascadeDelay * 80}ms` }
    : undefined;

  // Pip rendering: determine pip counts
  const totalPips = initialCount ?? node.count;
  const filledPips = done ? totalPips : (isVisited ? (totalPips - node.count) : 0);
  const outlinePips = done ? 0 : node.count;
  const showPips = totalPips <= 2;

  return (
    <g
      className={classes}
      onClick={() => onClick(node.id)}
      style={{ cursor: 'pointer', opacity: dimInIdle ? 0.3 : undefined, ...cascadeStyle }}
    >
      {/* Startable-in-idle halo ring */}
      {isStartableInIdle && (
        <circle
          className="node--start-halo"
          cx={cx} cy={cy} r={5}
          fill="none"
          stroke="var(--cyan)"
          strokeWidth={0.4}
          opacity={0.5}
        />
      )}
      {/* Legacy startEligible halo for backward compat */}
      {state === 'startEligible' && !isStartableInIdle && (
        <circle
          className="node-halo"
          cx={cx} cy={cy} r={5}
          fill="none"
          stroke="var(--cyan)"
          strokeWidth={0.2}
          opacity={0.6}
        />
      )}
      {/* Main node circle */}
      <circle
        cx={cx} cy={cy} r={3}
        fill={fill}
        filter={bloomFilter}
      />
      {/* Commit ring pulse */}
      {pulse && (
        <circle
          className="node--commit-ring"
          cx={cx} cy={cy} r={3}
          fill="none"
          stroke="var(--cyan)"
          strokeWidth={0.5}
          filter="url(#bloom-bright)"
        />
      )}
      {/* Pips for count 1 or 2 */}
      {!done && showPips && totalPips === 1 && (
        <circle
          data-testid="pip"
          cx={cx} cy={cy} r={0.6}
          fill={filledPips > 0 ? 'var(--neon-green)' : 'none'}
          stroke={outlinePips > 0 ? 'var(--cyan)' : 'var(--neon-green)'}
          strokeWidth={0.15}
          filter="url(#bloom-bright)"
        />
      )}
      {!done && showPips && totalPips === 2 && (
        <>
          {/* Left pip */}
          <circle
            data-testid="pip"
            cx={cx - 1} cy={cy} r={0.6}
            fill={filledPips >= 1 ? 'var(--neon-green)' : 'none'}
            stroke={filledPips >= 1 ? 'none' : 'var(--cyan)'}
            strokeWidth={0.15}
            filter="url(#bloom-bright)"
          />
          {/* Right pip */}
          <circle
            data-testid="pip"
            cx={cx + 1} cy={cy} r={0.6}
            fill={filledPips >= 2 ? 'var(--neon-green)' : 'none'}
            stroke={filledPips >= 2 ? 'none' : 'var(--cyan)'}
            strokeWidth={0.15}
            filter="url(#bloom-bright)"
          />
        </>
      )}
    </g>
  );
}
