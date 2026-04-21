'use client';
import { useBuilderStore, type Tool } from '@/stores/builderStore';

const TOOLS: { key: Tool; label: string; kbd: string }[] = [
  { key: 'select', label: 'Select', kbd: 'V' },
  { key: 'node', label: 'Node', kbd: 'N' },
  { key: 'edge', label: 'Edge', kbd: 'E' },
];

export function Toolbar() {
  const { tool, setTool } = useBuilderStore();

  return (
    <div className="builder-toolbar" role="toolbar" aria-label="Builder tools">
      {TOOLS.map(t => (
        <button
          key={t.key}
          className={`builder-tool-btn${tool === t.key ? ' builder-tool-btn--active' : ''}`}
          onPointerDown={(e) => { e.preventDefault(); setTool(t.key); }}
          aria-pressed={tool === t.key}
          title={`${t.label} (${t.kbd})`}
        >
          <span className="font-display">{t.label}</span>
          <kbd>{t.kbd}</kbd>
        </button>
      ))}
    </div>
  );
}
