'use client';

type Props = {
  onPlay: () => void;
  onExport: () => void;
  onMenu: () => void;
};

export function BuilderActionBar({ onPlay, onExport, onMenu }: Props) {
  return (
    <div className="builder-action-bar" role="toolbar" aria-label="Builder actions">
      <button
        className="builder-action-btn font-display"
        onPointerDown={(e) => { e.preventDefault(); onPlay(); }}
        aria-label="Playtest"
        title="Playtest this level"
      >
        ▷ Play
      </button>
      <button
        className="builder-action-btn font-display"
        onPointerDown={(e) => { e.preventDefault(); onExport(); }}
        aria-label="Export"
        title="Export level as JSON"
      >
        ⎘ Export
      </button>
      <button
        className="builder-action-btn font-display"
        onPointerDown={(e) => { e.preventDefault(); onMenu(); }}
        aria-label="Back to level list"
        title="Back to builder menu"
      >
        ✕ Menu
      </button>
    </div>
  );
}
