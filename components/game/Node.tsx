'use client';
import type { GraphNode, ViewBoxDims } from '@/lib/graph';

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
  viewBox = { w: 100, h: 100 },
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
  viewBox?: ViewBoxDims;
}) {
  const done = node.count <= 0;
  const snapActive = state === 'snap';
  const cx = node.x * viewBox.w;
  const cy = node.y * viewBox.h;

  // Determine fill and filter based on state
  let fill: string;
  let bloomFilter: string;
  if (done) {
    fill = 'var(--neon-green)';
    bloomFilter = 'url(#bloom-bright)';
  } else if (snapActive) {
    // Snap state: cyan, not green — visually distinct from "done"
    fill = 'var(--cyan)';
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

  // Cursor logic: pointer for clickable nodes, default for locked/unreachable
  const isClickable = state === 'startEligible' || state === 'current' || state === 'validTarget' || state === 'snap';
  const hitCursor = (!done && isClickable) || (state === 'idle' && !done) ? 'pointer' : 'default';

  return (
    <g
      className={classes}
      style={{ opacity: dimInIdle ? 0.3 : undefined, ...cascadeStyle }}
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
          pointerEvents="none"
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
          pointerEvents="none"
        />
      )}
      {/* Invisible hit target — ~44pt effective on mobile (~28pt on desktop) */}
      <circle
        cx={cx} cy={cy} r={7}
        fill="transparent"
        style={{ cursor: hitCursor }}
        onPointerDown={(e) => { e.preventDefault(); onClick(node.id); }}
      />
      {/* Main node circle — decorative only */}
      <circle
        cx={cx} cy={cy} r={3}
        fill={fill}
        filter={bloomFilter}
        pointerEvents="none"
      />
      {/* Snap halo: pulsing dashed ring — distinct from done */}
      {snapActive && (
        <circle
          className="node--snap-halo"
          cx={cx} cy={cy} r={5}
          fill="none"
          stroke="var(--cyan)"
          strokeWidth={0.3}
          strokeDasharray="1.5 1"
          pointerEvents="none"
        />
      )}
      {/* Commit ring pulse */}
      {pulse && (
        <circle
          className="node--commit-ring"
          cx={cx} cy={cy} r={3}
          fill="none"
          stroke="var(--cyan)"
          strokeWidth={0.5}
          filter="url(#bloom-bright)"
          pointerEvents="none"
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
          pointerEvents="none"
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
            pointerEvents="none"
          />
          {/* Right pip */}
          <circle
            data-testid="pip"
            cx={cx + 1} cy={cy} r={0.6}
            fill={filledPips >= 2 ? 'var(--neon-green)' : 'none'}
            stroke={filledPips >= 2 ? 'none' : 'var(--cyan)'}
            strokeWidth={0.15}
            filter="url(#bloom-bright)"
            pointerEvents="none"
          />
        </>
      )}
    </g>
  );
}
