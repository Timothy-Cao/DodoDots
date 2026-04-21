'use client';
import { useBuilderStore } from '@/stores/builderStore';
import type { Mode } from '@/lib/graph';

export function LevelSettings() {
  const { title, maxMoves, mode, setTitle, setMaxMoves, setMode } = useBuilderStore();

  return (
    <div className="builder-settings">
      <input
        className="builder-title-input font-display"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Level title"
        aria-label="Level title"
        maxLength={50}
      />
      <label className="builder-settings-label">
        <span>Moves</span>
        <input
          className="builder-moves-input"
          type="number"
          value={maxMoves}
          min={1}
          max={99}
          onChange={(e) => setMaxMoves(Number(e.target.value))}
          aria-label="Max moves"
        />
      </label>
      <div className="builder-mode-toggle" role="group" aria-label="Win condition">
        <button
          className={`builder-mode-btn${mode === 'loose' ? ' builder-mode-btn--active' : ''}`}
          onPointerDown={(e) => { e.preventDefault(); setMode('loose' as Mode); }}
          aria-pressed={mode === 'loose'}
          title="Win when all counters reach 0 or below (loose)"
        >
          0 or below
        </button>
        <button
          className={`builder-mode-btn${mode === 'strict' ? ' builder-mode-btn--active' : ''}`}
          onPointerDown={(e) => { e.preventDefault(); setMode('strict' as Mode); }}
          aria-pressed={mode === 'strict'}
          title="Win when all counters reach exactly 0 (strict)"
        >
          exact 0
        </button>
      </div>
    </div>
  );
}
