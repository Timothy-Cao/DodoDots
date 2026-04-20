'use client';
import { useEffect, useState } from 'react';
import { storage } from '@/lib/storage';

function lastNDates(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  return out;
}

export function SolvedCalendar() {
  const [solved, setSolved] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const completions = storage.getDailyCompletions();
    const m: Record<string, boolean> = {};
    Object.entries(completions).forEach(([date, entry]) => {
      if ((entry as { solved: boolean }).solved) m[date] = true;
    });
    setSolved(m);
  }, []);
  const dates = lastNDates(30);
  const today = dates[dates.length - 1];
  return (
    <div className="solved-calendar" aria-label="Last 30 days">
      {dates.map(d => (
        <span
          key={d}
          className={`solved-cell${solved[d] ? ' solved' : ''}${d === today ? ' today' : ''}`}
          title={d}
        />
      ))}
    </div>
  );
}
