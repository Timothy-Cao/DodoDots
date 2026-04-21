'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TUTORIAL } from '@/lib/tutorial';
import { GameScreen } from '@/components/game/GameScreen';
import { storage } from '@/lib/storage';

export default function TutorialPage() {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [showNext, setShowNext] = useState(false);
  const level = TUTORIAL[idx];

  const onWin = useCallback(() => {
    storage.markTutorialComplete(level.id);
    setShowNext(true);
  }, [level.id]);

  const next = () => {
    if (idx < TUTORIAL.length - 1) {
      setIdx((i) => i + 1);
      setShowNext(false);
    } else {
      router.push('/');
    }
  };

  const isLast = idx === TUTORIAL.length - 1;

  return (
    <div className="tutorial-root">
      <GameScreen
        key={level.id}
        graph={level.graph}
        maxMoves={level.maxMoves}
        title={`${idx + 1}/${TUTORIAL.length}  ·  ${level.title.toUpperCase()}`}
        onWin={onWin}
        menuHref="/"
        hideWinOverlay
      />
      <div className="tutorial-caption" aria-live="polite">
        <p>{level.caption}</p>
        {showNext && (
          <>
            <p className="tutorial-complete">✓ COMPLETE</p>
            <button
              onPointerDown={(e) => { e.preventDefault(); next(); }}
            >
              {isLast ? 'Finish' : 'Next →'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
