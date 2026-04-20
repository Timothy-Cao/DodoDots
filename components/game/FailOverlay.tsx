export function FailOverlay({ onRetry, onMenu, reason }: { onRetry: () => void; onMenu: () => void; reason?: string }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,7,13,0.7)' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 className="font-display" style={{ color: 'var(--danger)', fontSize: 40 }}>STUCK</h2>
        {reason === 'unreachable_edge' && (
          <p className="font-display" style={{ color: 'var(--dim)', fontSize: 13, marginTop: 8, marginBottom: 0 }}>
            This edge can no longer be cleared.
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
          <button onClick={onRetry} className="font-display">Retry (R)</button>
          <button onClick={onMenu} className="font-display">Menu</button>
        </div>
      </div>
    </div>
  );
}
