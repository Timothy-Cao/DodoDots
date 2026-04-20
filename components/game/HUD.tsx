export function HUD({ title, movesUsed, optimalMoves }: { title: string; movesUsed: number; optimalMoves: number }) {
  const over = movesUsed > optimalMoves;
  return (
    <div style={{ position: 'absolute', top: 16, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 24px', pointerEvents: 'none' }}>
      <div className="font-display" style={{ color: 'var(--cyan)', fontSize: 14 }}>{title}</div>
      <div className="font-display" style={{ color: over ? 'var(--danger)' : 'var(--cyan)', fontSize: 18 }}>
        {movesUsed}{over ? `  (par ${optimalMoves})` : ''}
      </div>
      <div style={{ width: 80 }} />
    </div>
  );
}
