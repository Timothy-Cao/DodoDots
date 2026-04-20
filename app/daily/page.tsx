'use client';
import { useMemo, useCallback } from 'react';
import { generateDaily } from '@/lib/generator';
import { GameScreen } from '@/components/game/GameScreen';
import { storage } from '@/lib/storage';

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function DailyPage() {
  const date = todayIso();
  const puzzle = useMemo(() => generateDaily(date), [date]);
  const onWin = useCallback(() => {
    storage.markDaily(date, { solved: true, movesUsed: puzzle.maxMoves });
  }, [date, puzzle.maxMoves]);
  return <GameScreen graph={puzzle.graph} maxMoves={puzzle.maxMoves} title={`DAILY ${date}`} onWin={onWin} />;
}
