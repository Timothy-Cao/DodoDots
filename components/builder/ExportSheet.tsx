'use client';
import { useState } from 'react';
import { serializeLevel } from '@/lib/level-format';
import { useBuilderStore } from '@/stores/builderStore';

export function ExportSheet({ onClose }: { onClose: () => void }) {
  const asLevel = useBuilderStore(s => s.asLevel);
  const [copied, setCopied] = useState(false);

  const json = serializeLevel(asLevel());

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
      const pre = document.querySelector('.export-sheet-pre') as HTMLElement;
      if (pre) {
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(pre);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  };

  return (
    <div className="export-sheet-backdrop" onPointerDown={onClose}>
      <div
        className="export-sheet"
        onPointerDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Export level"
      >
        <div className="export-sheet-header">
          <h2 className="font-display export-sheet-title">Export Level</h2>
          <button className="export-sheet-close" onPointerDown={(e) => { e.preventDefault(); onClose(); }} aria-label="Close">✕</button>
        </div>
        <p className="export-sheet-hint">Paste this JSON to share or save the level.</p>
        <pre className="export-sheet-pre">{json}</pre>
        <button
          className={`export-copy-btn font-display${copied ? ' export-copy-btn--done' : ''}`}
          onPointerDown={(e) => { e.preventDefault(); handleCopy(); }}
        >
          {copied ? 'Copied!' : 'Copy to clipboard'}
        </button>
      </div>
    </div>
  );
}
