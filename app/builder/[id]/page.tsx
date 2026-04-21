'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useBuilderStore } from '@/stores/builderStore';
import { BuilderCanvas } from '@/components/builder/BuilderCanvas';
import { Toolbar } from '@/components/builder/Toolbar';
import { Inspector } from '@/components/builder/Inspector';
import { LevelSettings } from '@/components/builder/LevelSettings';
import { ExportSheet } from '@/components/builder/ExportSheet';
import { BuilderActionBar } from '@/components/ui/BuilderActionBar';
import { storage } from '@/lib/storage';
import { newDraft } from '@/lib/level-format';

export default function BuilderEditorPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const store = useBuilderStore();
  const [showExport, setShowExport] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load draft on mount
  useEffect(() => {
    if (!id) return;
    const raw = storage.getDrafts() as Record<string, unknown>;
    const existing = raw[id];
    if (existing) {
      store.loadFromLevel(existing as Parameters<typeof store.loadFromLevel>[0]);
    } else {
      const draft = newDraft(id);
      storage.setDraft(id, draft);
      store.loadFromLevel(draft);
    }
    setMounted(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Auto-save whenever graph/title/maxMoves/mode change
  const asLevel = store.asLevel;
  useEffect(() => {
    if (!mounted || !id) return;
    storage.setDraft(id, store.asLevel());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.graph, store.title, store.maxMoves, store.mode, mounted, id]);

  // Handle playtest: validate at least one start-eligible node
  const handlePlay = useCallback(() => {
    const hasStart = store.graph.nodes.some(n => n.startEligible && n.count > 0);
    if (!hasStart) {
      alert('Add at least one start-eligible node before playtesting.');
      return;
    }
    // Save before navigating
    if (id) storage.setDraft(id, store.asLevel());
    router.push(`/builder/${id}/playtest`);
  }, [store, id, router]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      switch (e.key.toLowerCase()) {
        case 'v': store.setTool('select'); break;
        case 'n': store.setTool('node'); break;
        case 'e': store.setTool('edge'); break;
        case 's': store.toggleSelectedStart(); break;
        case 'd': store.cycleEdgeDirection(); break;
        case 'delete':
        case 'backspace': store.deleteSelected(); break;
        case 'escape': router.push('/builder'); break;
        default:
          if (e.key >= '1' && e.key <= '9') {
            store.setSelectedCount(parseInt(e.key, 10));
          }
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mounted, store, router]);

  if (!mounted) {
    return <div className="builder-loading">Loading…</div>;
  }

  return (
    <div className="builder-editor">
      <LevelSettings />
      <div className="builder-main">
        <Toolbar />
        <BuilderCanvas />
        <Inspector />
      </div>
      <BuilderActionBar
        onPlay={handlePlay}
        onExport={() => setShowExport(true)}
        onMenu={() => router.push('/builder')}
      />
      {showExport && <ExportSheet onClose={() => setShowExport(false)} />}
    </div>
  );
}
