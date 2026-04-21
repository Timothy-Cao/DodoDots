'use client';
import { gridPoints } from '@/lib/grid';
import type { ViewBoxDims } from '@/lib/graph';

export function GridDots({ viewBox }: { viewBox: ViewBoxDims }) {
  const pts = gridPoints();
  return (
    <>
      {pts.map(p => (
        <circle
          key={`${p.x}-${p.y}`}
          cx={p.x * viewBox.w}
          cy={p.y * viewBox.h}
          r={0.3}
          fill="var(--dim)"
          opacity={0.3}
          pointerEvents="none"
        />
      ))}
    </>
  );
}
