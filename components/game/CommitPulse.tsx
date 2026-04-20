'use client';
import { useEffect } from 'react';

export function CommitPulse({ x, y, color, onDone }: { x: number; y: number; color: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <circle cx={x * 100} cy={y * 100} r={3}
      fill="none" stroke={color} strokeWidth={0.5}
      style={{ animation: 'commit-pulse 500ms ease-out forwards', transformBox: 'fill-box', transformOrigin: 'center' }}
      filter="url(#bloom-bright)" />
  );
}
