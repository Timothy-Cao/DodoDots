'use client';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { CAMPAIGN, getCampaignLevel } from '@/lib/campaign';
import { GameScreen } from '@/components/game/GameScreen';
import { storage } from '@/lib/storage';

export default function CampaignPlayPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const level = getCampaignLevel(id);
  const idx = useMemo(() => CAMPAIGN.findIndex(l => l.id === id), [id]);
  const next = idx >= 0 && idx < CAMPAIGN.length - 1 ? CAMPAIGN[idx + 1] : null;

  const onWin = useCallback((movesUsed: number) => {
    if (!level) return;
    storage.markCampaignSolved(level.id, movesUsed);
  }, [level]);

  if (!level) {
    return <div style={{ color: 'var(--cyan)', padding: 32 }}>Level not found.</div>;
  }

  return (
    <GameScreen
      key={level.id}
      graph={level.graph}
      maxMoves={level.maxMoves}
      mode={level.mode}
      title={`${String(idx + 1).padStart(2, '0')} \u00b7 ${level.title.toUpperCase()}`}
      onWin={onWin}
      menuHref="/campaign"
      onNext={next ? () => router.push(`/campaign/${next.id}`) : undefined}
    />
  );
}
