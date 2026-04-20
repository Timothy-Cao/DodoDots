'use client';
import { useEffect, useState } from 'react';
import { storage } from '@/lib/storage';

export function StreakBadge() {
  const [streak, setStreak] = useState(0);
  useEffect(() => { setStreak(storage.getStreak().count); }, []);
  if (streak === 0) return null;
  return (
    <div className="streak-badge" aria-label={`${streak}-day streak`}>
      <span className="streak-flame" aria-hidden>🔥</span>
      <span className="streak-count">{streak}</span>
      <span className="streak-label">day streak</span>
    </div>
  );
}
