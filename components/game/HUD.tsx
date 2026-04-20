export function HUD({ title, movesRemaining, maxMoves }: { title: string; movesRemaining: number; maxMoves: number }) {
  const movesUsed = maxMoves - movesRemaining;
  return (
    <div style={{ position: 'absolute', top: 16, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 24px', pointerEvents: 'none' }}>
      <div className="font-display" style={{ color: 'var(--cyan)', fontSize: 14 }}>{title}</div>
      <div className="font-display" style={{ color: 'var(--cyan)', fontSize: 14, opacity: 0.6 }}>
        MOVES: {movesUsed}
      </div>
      <div style={{ width: 80 }} />
    </div>
  );
}
