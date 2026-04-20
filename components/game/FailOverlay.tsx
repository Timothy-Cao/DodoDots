export function FailOverlay({ onRetry, onMenu, reason }: { onRetry: () => void; onMenu: () => void; reason?: string }) {
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
        <h2 className="font-display" style={{ color: 'var(--danger)', fontSize: 'clamp(30px, 8vw, 40px)', margin: 0 }}>STUCK</h2>
        {reason === 'unreachable_edge' && (
          <p className="font-display" style={{ color: 'var(--dim)', fontSize: 13, marginTop: 8, marginBottom: 0 }}>
            This edge can no longer be cleared.
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
          <button
            className="font-display"
            style={{ minHeight: 48, padding: '12px 24px' }}
            onPointerDown={(e) => { e.preventDefault(); onRetry(); }}
          >
            Retry (R)
          </button>
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
