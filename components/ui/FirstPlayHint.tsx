'use client';
import { useEffect, useState } from 'react';
import { storage } from '@/lib/storage';

export function FirstPlayHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!storage.getHasPlayed()) {
      setShow(true);
      const t = setTimeout(() => {
        setShow(false);
        storage.markHasPlayed();
      }, 4500);
      const onTap = () => {
        setShow(false);
        storage.markHasPlayed();
      };
      window.addEventListener('pointerdown', onTap, { once: true });
      return () => {
        clearTimeout(t);
        window.removeEventListener('pointerdown', onTap);
      };
    }
  }, []);

  if (!show) return null;

  return (
    <div className="first-play-hint" aria-hidden>
      <span>Tap a glowing dot to begin</span>
    </div>
  );
}
