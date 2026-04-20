'use client';
import { useEffect, useState, useRef } from 'react';
import { storage } from '@/lib/storage';
import { useGameStore } from '@/stores/gameStore';

export function FirstPlayHint() {
  const phase = useGameStore(s => s.state?.phase);
  const [show, setShow] = useState(false);
  const dismissedRef = useRef(false);

  useEffect(() => {
    if (storage.getHasPlayed()) return;
    setShow(true);
    const t = setTimeout(() => dismiss(), 4500);
    return () => clearTimeout(t);
  }, []);

  // Dismiss on first real latch (idle -> latched/tracing/won)
  useEffect(() => {
    if (phase && phase !== 'idle' && !dismissedRef.current) {
      dismiss();
    }
  }, [phase]);

  function dismiss() {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setShow(false);
    storage.markHasPlayed();
  }

  if (!show) return null;

  return (
    <div className="first-play-hint" aria-hidden>
      <span>Tap a glowing dot to begin</span>
    </div>
  );
}
