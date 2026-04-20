export function HUD({ title, movesUsed, optimalMoves }: { title: string; movesUsed: number; optimalMoves: number }) {
  const over = movesUsed > optimalMoves;
  return (
    <div style={{
      position: 'absolute',
      top: 'calc(12px + env(safe-area-inset-top))',
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'space-between',
      padding: '0 clamp(12px, 4vw, 24px)',
      pointerEvents: 'none',
      gap: 12,
    }}>
      <div
        className="font-display"
        style={{
          color: 'var(--cyan)',
          fontSize: 'clamp(11px, 2.8vw, 14px)',
          flex: '1 1 0',
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </div>
      <div
        className="font-display"
        style={{
          color: over ? 'var(--danger)' : 'var(--cyan)',
          fontSize: 'clamp(12px, 3vw, 16px)',
          letterSpacing: '0.1em',
          flex: '0 0 auto',
        }}
      >
        MOVES · {movesUsed}{over ? `  OVER PAR ${optimalMoves}` : ''}
      </div>
    </div>
  );
}
