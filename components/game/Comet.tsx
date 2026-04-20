'use client';
import { useEffect, useState } from 'react';

export function Comet({
  from, to, durationMs, onDone,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  durationMs: number;
  onDone: () => void;
}) {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / durationMs, 1);
      setT(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else onDone();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from.x, from.y, to.x, to.y, durationMs, onDone]);

  const x = from.x + (to.x - from.x) * t;
  const y = from.y + (to.y - from.y) * t;
  return (
    <circle cx={x * 100} cy={y * 100} r={2}
      fill="var(--neon-green)" filter="url(#bloom-bright)" />
  );
}
