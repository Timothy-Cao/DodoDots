'use client';
import { useBuilderStore } from '@/stores/builderStore';
import type { Tool } from '@/stores/builderStore';

const TOOL_TIPS: Record<Tool, string> = {
  select: 'Tap a node or edge to select and edit it.',
  node: 'Tap empty space to place a node.',
  edge: 'Drag from one node to another to draw an edge.',
};

const COUNT_OPTIONS = [
  { value: 1, label: 'Single' },
  { value: 2, label: 'Double' },
  { value: 3, label: 'Triple' },
];

export function Inspector() {
  const {
    selection, graph, tool,
    updateSelectedNode, updateSelectedEdge,
    deleteSelected, cycleEdgeDirection, setSelectedCount, toggleSelectedStart,
  } = useBuilderStore();

  if (!selection) {
    return (
      <div className="builder-inspector builder-inspector--empty">
        <p className="builder-inspector-tip">{TOOL_TIPS[tool]}</p>
      </div>
    );
  }

  if (selection.type === 'node') {
    const node = graph.nodes.find(n => n.id === selection.id);
    if (!node) return null;
    return (
      <div className="builder-inspector">
        <div className="builder-inspector-row">
          <label className="builder-inspector-label">Count</label>
          <div className="builder-mode-toggle" style={{ width: '100%' }}>
            {COUNT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`builder-mode-btn${node.count === opt.value ? ' builder-mode-btn--active' : ''}`}
                style={{ flex: 1 }}
                onPointerDown={(e) => { e.preventDefault(); setSelectedCount(opt.value); }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="builder-inspector-row">
          <label className="builder-inspector-label">Start eligible</label>
          <button
            className={`builder-toggle-btn${node.startEligible ? ' builder-toggle-btn--on' : ''}`}
            onPointerDown={(e) => { e.preventDefault(); toggleSelectedStart(); }}
            aria-pressed={node.startEligible}
          >
            {node.startEligible ? 'Yes' : 'No'}
          </button>
        </div>
        <div className="builder-inspector-row builder-inspector-row--right">
          <button
            className="builder-delete-btn"
            onPointerDown={(e) => { e.preventDefault(); deleteSelected(); }}
          >
            Delete node
          </button>
        </div>
      </div>
    );
  }

  if (selection.type === 'edge') {
    const edge = graph.edges.find(e => e.id === selection.id);
    if (!edge) return null;
    const dirLabel = edge.direction === 'bi' ? '↔' : edge.direction === 'forward' ? '→' : '←';
    return (
      <div className="builder-inspector">
        <div className="builder-inspector-row">
          <label className="builder-inspector-label">Count</label>
          <div className="builder-mode-toggle" style={{ width: '100%' }}>
            {COUNT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`builder-mode-btn${edge.count === opt.value ? ' builder-mode-btn--active' : ''}`}
                style={{ flex: 1 }}
                onPointerDown={(e) => { e.preventDefault(); setSelectedCount(opt.value); }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="builder-inspector-row">
          <label className="builder-inspector-label">Direction</label>
          <button
            className="builder-dir-btn"
            onPointerDown={(e) => { e.preventDefault(); cycleEdgeDirection(); }}
            title="Cycle direction: ↔ → ←"
          >
            <span className="font-display">{dirLabel}</span>
          </button>
        </div>
        <div className="builder-inspector-row builder-inspector-row--right">
          <button
            className="builder-delete-btn"
            onPointerDown={(e) => { e.preventDefault(); deleteSelected(); }}
          >
            Delete edge
          </button>
        </div>
      </div>
    );
  }

  return null;
}
