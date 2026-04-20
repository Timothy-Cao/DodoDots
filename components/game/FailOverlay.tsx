export function FailOverlay({ onRetry, onMenu }: { onRetry: () => void; onMenu: () => void }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,7,13,0.7)' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 className="font-display" style={{ color: 'var(--danger)', fontSize: 40 }}>OUT OF MOVES</h2>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
          <button onClick={onRetry} className="font-display">Retry (R)</button>
          <button onClick={onMenu} className="font-display">Menu</button>
        </div>
      </div>
    </div>
  );
}
