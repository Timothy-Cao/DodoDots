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

  // Concentric ring model
  // totalLayers = initialCount (1, 2, or 3)
  // consumed = number of layers already filled green (inner-first)
  const totalLayers = initialCount ?? node.count;
  const consumed = done ? totalLayers : (isVisited ? (totalLayers - node.count) : 0);

  // Layer geometry
  const CORE_R = 1.6;
  const RING_STEP = 1.2;
  const outerR = CORE_R + (totalLayers - 1) * RING_STEP;

  // Cursor logic: pointer for clickable nodes, default for locked/unreachable
  const isClickable = state === 'startEligible' || state === 'current' || state === 'validTarget' || state === 'snap';
  const hitCursor = (!done && isClickable) || (state === 'idle' && !done) ? 'pointer' : 'default';

  return (
    <g
      className={classes}
      style={{ opacity: dimInIdle ? 0.3 : undefined, ...cascadeStyle }}
    >
      {/* Startable-in-idle halo ring — outside the outermost ring */}
      {isStartableInIdle && (
        <circle
          className="node--start-halo"
          cx={cx} cy={cy} r={outerR + 1.4}
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
          cx={cx} cy={cy} r={outerR + 1.4}
          fill="none"
          stroke="var(--cyan)"
          strokeWidth={0.2}
          opacity={0.6}
          pointerEvents="none"
        />
      )}
      {/* Invisible hit target */}
      <circle
        cx={cx} cy={cy} r={7}
        fill="transparent"
        style={{ cursor: hitCursor }}
        onPointerDown={(e) => { e.preventDefault(); onClick(node.id); }}
      />
      {/* Concentric rings — layer 0 = innermost core (filled circle) */}
      {Array.from({ length: totalLayers }).map((_, k) => {
        const r = CORE_R + k * RING_STEP;
        const isLayerGreen = k < consumed;

        let layerColor: string;
        if (snapActive) {
          layerColor = 'var(--cyan)';
        } else if (isLayerGreen) {
          layerColor = 'var(--neon-green)';
        } else {
          layerColor = 'var(--dim)';
        }

        const layerFilter = (isLayerGreen || snapActive) ? 'url(#bloom-bright)' : 'url(#bloom-dim)';

        if (k === 0) {
          // Innermost core: filled circle
          return (
            <circle
              key={k}
              data-testid="ring"
              cx={cx} cy={cy} r={r}
              fill={layerColor}
              filter={layerFilter}
              pointerEvents="none"
            />
          );
        } else {
          // Outer rings: stroke-only
          return (
            <circle
              key={k}
              data-testid="ring"
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={layerColor}
              strokeWidth={0.45}
              filter={layerFilter}
              pointerEvents="none"
            />
          );
        }
      })}
      {/* Snap halo: pulsing dashed ring */}
      {snapActive && (
        <circle
          className="node--snap-halo"
          cx={cx} cy={cy} r={outerR + 2}
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
          cx={cx} cy={cy} r={CORE_R}
          fill="none"
          stroke="var(--cyan)"
          strokeWidth={0.5}
          filter="url(#bloom-bright)"
          pointerEvents="none"
        />
      )}
    </g>
  );
}
