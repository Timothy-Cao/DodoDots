'use client';
import { useEffect } from 'react';
import type { ViewBoxDims } from '@/lib/graph';

export function CommitPulse({ x, y, color, onDone, viewBox = { w: 100, h: 100 } }: {
  x: number; y: number; color: string; onDone: () => void; viewBox?: ViewBoxDims;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <circle cx={x * viewBox.w} cy={y * viewBox.h} r={3}
      fill="none" stroke={color} strokeWidth={0.5}
      style={{ animation: 'commit-pulse 500ms ease-out forwards', transformBox: 'fill-box', transformOrigin: 'center' }}
      filter="url(#bloom-bright)" />
  );
}
