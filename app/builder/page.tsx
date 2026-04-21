'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MenuLayout } from '@/components/ui/MenuLayout';
import { storage } from '@/lib/storage';
import { newDraft, uniqueTitle, type Level } from '@/lib/level-format';

const PAGE_SIZE = 10;

type Ctx = { x: number; y: number; draftId: string } | null;

export default function BuilderListPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Level[]>([]);
  const [page, setPage] = useState(0);
  const [ctx, setCtx] = useState<Ctx>(null);

  useEffect(() => {
    const raw = storage.getDrafts() as Record<string, Level>;
    setDrafts(Object.values(raw).filter(Boolean));
  }, []);

  // Clamp page when drafts change
  const totalPages = Math.max(1, Math.ceil(drafts.length / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  // Close context menu on outside click / escape / scroll
  useEffect(() => {
    if (!ctx) return;
    const close = () => setCtx(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
    };
  }, [ctx]);

  const handleNew = () => {
    const id = `lvl${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    const existingTitles = drafts.map(d => d.title ?? 'Untitled');
    const title = uniqueTitle('Untitled', existingTitles);
    const draft = newDraft(id, title);
    storage.setDraft(id, draft);
    router.push(`/builder/${id}`);
  };

  const handleDelete = useCallback((id: string) => {
    storage.deleteDraft(id);
    setDrafts(prev => prev.filter(d => d.id !== id));
    setCtx(null);
  }, []);

  const visible = useMemo(
    () => drafts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [drafts, page],
  );

  return (
    <MenuLayout title="BUILDER">
      <button onPointerDown={(e) => { e.preventDefault(); handleNew(); }}>
        + New Level
      </button>
      {drafts.length === 0 && (
        <p style={{ color: 'var(--dim)', fontSize: '0.85rem', margin: '0.5rem 0' }}>
          No drafts yet. Create your first level!
        </p>
      )}
      {drafts.length > 0 && (
        <ul className="builder-draft-list" role="list">
          {visible.map(d => (
            <li key={d.id}>
              <button
                className="builder-draft-link"
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  e.preventDefault();
                  router.push(`/builder/${d.id}`);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setCtx({ x: e.clientX, y: e.clientY, draftId: d.id });
                }}
              >
                <span className="builder-draft-title font-display">{d.title || 'Untitled'}</span>
                <span className="builder-draft-meta">
                  {d.graph.nodes.length}n · {d.graph.edges.length}e · {d.mode}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {totalPages > 1 && (
        <div className="builder-pager">
          <button
            className="builder-pager-btn"
            disabled={page === 0}
            onPointerDown={(e) => { e.preventDefault(); setPage(p => Math.max(0, p - 1)); }}
            aria-label="Previous page"
          >
            ‹
          </button>
          <span className="builder-pager-info font-display">
            {page + 1} / {totalPages}
          </span>
          <button
            className="builder-pager-btn"
            disabled={page >= totalPages - 1}
            onPointerDown={(e) => { e.preventDefault(); setPage(p => Math.min(totalPages - 1, p + 1)); }}
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      )}
      {ctx && (
        <div
          className="builder-ctx-menu"
          style={{ left: ctx.x, top: ctx.y }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            className="builder-ctx-item builder-ctx-item--danger"
            onPointerDown={(e) => { e.preventDefault(); handleDelete(ctx.draftId); }}
          >
            Delete
          </button>
        </div>
      )}
    </MenuLayout>
  );
}
