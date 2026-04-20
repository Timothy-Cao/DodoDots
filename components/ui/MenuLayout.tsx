'use client';
import type { ReactNode } from 'react';

export function MenuLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="menu-layout">
      <h1 className="menu-title font-display">{title}</h1>
      <nav className="menu-nav">{children}</nav>
    </main>
  );
}
