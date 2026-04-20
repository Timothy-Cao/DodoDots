export function WinOverlay({
  onNext, onMenu, movesUsed, optimalMoves,
}: {
  onNext?: () => void;
  onMenu: () => void;
  movesUsed?: number;
  optimalMoves?: number;
}) {
  const isPerfect = movesUsed !== undefined && optimalMoves !== undefined && movesUsed === optimalMoves;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,7,13,0.7)' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 className="font-display" style={{ color: 'var(--neon-green)', fontSize: 48 }}>SOLVED</h2>
        {isPerfect && (
          <p className="font-display" style={{ color: 'var(--neon-green)', fontSize: 18, marginTop: 4, marginBottom: 0, opacity: 0.9 }}>
            Perfect!
          </p>
        )}
        {movesUsed !== undefined && optimalMoves !== undefined && (
          <p className="font-display" style={{ color: 'var(--dim)', fontSize: 13, marginTop: 8, marginBottom: 0 }}>
            Solved in {movesUsed} moves (par {optimalMoves})
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
          {onNext && <button onClick={onNext} className="font-display">Next</button>}
          <button onClick={onMenu} className="font-display">Menu</button>
        </div>
      </div>
    </div>
  );
}
