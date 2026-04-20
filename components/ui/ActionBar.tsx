'use client';

type Props = {
  onUndo: () => void;
  onReset: () => void;
  onMenu: () => void;
  canUndo: boolean;
};

export function ActionBar({ onUndo, onReset, onMenu, canUndo }: Props) {
  return (
    <div className="action-bar" role="toolbar" aria-label="Game controls">
      <button
        className="action-btn font-display"
        aria-label="Undo"
        disabled={!canUndo}
        onPointerDown={(e) => { e.preventDefault(); onUndo(); }}
      >
        <span aria-hidden>↶</span>
      </button>
      <button
        className="action-btn font-display"
        aria-label="Reset"
        onPointerDown={(e) => { e.preventDefault(); onReset(); }}
      >
        <span aria-hidden>⟲</span>
      </button>
      <button
        className="action-btn font-display"
        aria-label="Menu"
        onPointerDown={(e) => { e.preventDefault(); onMenu(); }}
      >
        <span aria-hidden>✕</span>
      </button>
    </div>
  );
}
