'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { GameScreen } from '@/components/game/GameScreen';
import { storage } from '@/lib/storage';
import type { Level } from '@/lib/level-format';

export default function PlaytestPage() {
  const { id } = useParams<{ id: string }>();
  const [level, setLevel] = useState<Level | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const raw = storage.getDrafts() as Record<string, unknown>;
    const draft = raw[id] as Level | undefined;
    if (!draft) {
      setError('Draft not found. Return to the editor.');
      return;
    }
    const hasStart = draft.graph.nodes.some(n => n.startEligible && n.count > 0);
    if (!hasStart) {
      setError('Add a starting node first.');
      return;
    }
    setLevel(draft);
  }, [id]);

  if (error) {
    return (
      <div className="builder-playtest-error">
        <p>{error}</p>
        <a href={`/builder/${id}`}>← Back to editor</a>
      </div>
    );
  }

  if (!level) return null;

  return (
    <GameScreen
      graph={level.graph}
      maxMoves={level.maxMoves}
      mode={level.mode}
      title={level.title.toUpperCase() || 'PLAYTEST'}
      menuHref={`/builder/${id}`}
    />
  );
}
