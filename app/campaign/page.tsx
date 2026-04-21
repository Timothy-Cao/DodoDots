'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CAMPAIGN } from '@/lib/campaign';
import { MenuLayout } from '@/components/ui/MenuLayout';
import { storage } from '@/lib/storage';

export default function CampaignListPage() {
  const [progress, setProgress] = useState<Record<string, { solved: boolean; bestMoves: number }>>({});
  useEffect(() => {
    setProgress(storage.getCampaignProgress());
  }, []);

  return (
    <MenuLayout title="CAMPAIGN">
      <div className="campaign-list">
        {CAMPAIGN.map((level, idx) => {
          const num = String(idx + 1).padStart(2, '0');
          const p = progress[level.id];
          return (
            <Link key={level.id} href={`/campaign/${level.id}`} prefetch>
              <button className="campaign-row">
                <span className="campaign-num font-display">{num}</span>
                <span className="campaign-title">{level.title}</span>
                <span className="campaign-status">
                  {p?.solved ? `\u2713 ${p.bestMoves}` : ''}
                </span>
              </button>
            </Link>
          );
        })}
      </div>
      <Link href="/" prefetch><button>Back</button></Link>
    </MenuLayout>
  );
}
