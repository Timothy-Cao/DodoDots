'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MenuLayout } from '@/components/ui/MenuLayout';
import { storage } from '@/lib/storage';
import { newDraft, type Level } from '@/lib/level-format';

export default function BuilderListPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Level[]>([]);

  useEffect(() => {
    const raw = storage.getDrafts() as Record<string, Level>;
    setDrafts(Object.values(raw).filter(Boolean));
  }, []);

  const handleNew = () => {
    const id = `lvl${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    const draft = newDraft(id);
    storage.setDraft(id, draft);
    router.push(`/builder/${id}`);
  };

  const handleDelete = (id: string) => {
    storage.deleteDraft(id);
    setDrafts(prev => prev.filter(d => d.id !== id));
  };

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
      {drafts.map(d => (
        <div key={d.id} className="builder-draft-row">
          <button
            className="builder-draft-link"
            onPointerDown={(e) => { e.preventDefault(); router.push(`/builder/${d.id}`); }}
          >
            <span className="builder-draft-title font-display">{d.title || 'Untitled'}</span>
            <span className="builder-draft-meta">
              {d.graph.nodes.length} node{d.graph.nodes.length !== 1 ? 's' : ''} · {d.mode}
            </span>
          </button>
          <button
            className="builder-draft-delete"
            onPointerDown={(e) => { e.preventDefault(); handleDelete(d.id); }}
            aria-label={`Delete ${d.title}`}
          >
            ✕
          </button>
        </div>
      ))}
    </MenuLayout>
  );
}
