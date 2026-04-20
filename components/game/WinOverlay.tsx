'use client';
import { useState } from 'react';

export function WinOverlay({
  onNext, onMenu, onShare, movesUsed, optimalMoves,
}: {
  onNext?: () => void;
  onMenu: () => void;
  onShare?: () => Promise<'shared' | 'copied' | 'failed'>;
  movesUsed?: number;
  optimalMoves?: number;
}) {
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const isPerfect = movesUsed !== undefined && optimalMoves !== undefined && movesUsed === optimalMoves;

  const handleShare = async () => {
    if (!onShare) return;
    const result = await onShare();
    if (result === 'copied') {
      setCopyMsg('Copied!');
      setTimeout(() => setCopyMsg(null), 2000);
    }
  };

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(5,7,13,0.7)',
      padding: 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
      boxSizing: 'border-box',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2 className="font-display" style={{ color: 'var(--neon-green)', fontSize: 'clamp(36px, 10vw, 48px)', margin: 0 }}>SOLVED</h2>
        {isPerfect && (
          <p className="font-display" style={{ color: 'var(--neon-green)', fontSize: 'clamp(14px, 4vw, 18px)', marginTop: 4, marginBottom: 0, opacity: 0.9 }}>
            Perfect!
          </p>
        )}
        {movesUsed !== undefined && optimalMoves !== undefined && (
          <p className="font-display" style={{ color: 'var(--dim)', fontSize: 13, marginTop: 8, marginBottom: 0 }}>
            Solved in {movesUsed} moves (par {optimalMoves})
          </p>
        )}
        {copyMsg && (
          <p className="font-display" style={{ color: 'var(--cyan)', fontSize: 12, marginTop: 6, marginBottom: 0, opacity: 0.8 }}>
            {copyMsg}
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
          {onNext && (
            <button
              className="font-display"
              style={{ minHeight: 48, padding: '12px 24px' }}
              onPointerDown={(e) => { e.preventDefault(); onNext(); }}
            >
              Next
            </button>
          )}
          {onShare && (
            <button
              className="font-display"
              style={{ minHeight: 48, padding: '12px 24px' }}
              onPointerDown={(e) => { e.preventDefault(); handleShare(); }}
            >
              Share
            </button>
          )}
          <button
            className="font-display"
            style={{ minHeight: 48, padding: '12px 24px' }}
            onPointerDown={(e) => { e.preventDefault(); onMenu(); }}
          >
            Menu
          </button>
        </div>
      </div>
    </div>
  );
}
