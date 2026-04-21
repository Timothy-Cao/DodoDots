'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CAMPAIGN } from '@/lib/campaign';
import { MenuLayout } from '@/components/ui/MenuLayout';
import { storage } from '@/lib/storage';

const TOTAL_SLOTS = 30;

export default function CampaignListPage() {
  const [progress, setProgress] = useState<Record<string, { solved: boolean; bestMoves: number }>>({});
  useEffect(() => {
    setProgress(storage.getCampaignProgress());
  }, []);

  const slots = Array.from({ length: TOTAL_SLOTS }, (_, i) => CAMPAIGN[i] ?? null);

  return (
    <MenuLayout title="CAMPAIGN">
      <div className="campaign-grid">
        {slots.map((level, idx) => {
          const num = String(idx + 1).padStart(2, '0');
          if (!level) {
            return (
              <div key={`locked-${idx}`} className="campaign-tile campaign-tile--locked" aria-disabled>
                <span className="campaign-num font-display">{num}</span>
              </div>
            );
          }
          const p = progress[level.id];
          return (
            <Link key={level.id} href={`/campaign/${level.id}`} prefetch className="campaign-tile-link">
              <button className={`campaign-tile${p?.solved ? ' campaign-tile--solved' : ''}`}>
                <span className="campaign-num font-display">{num}</span>
                {p?.solved && <span className="campaign-tile-check font-display">✓</span>}
              </button>
            </Link>
          );
        })}
      </div>
      <Link href="/" prefetch><button>Back</button></Link>
    </MenuLayout>
  );
}
