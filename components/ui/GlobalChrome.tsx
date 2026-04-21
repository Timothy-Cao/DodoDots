'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/daily', label: 'Daily' },
  { href: '/tutorial', label: 'Tutorial' },
  { href: '/campaign', label: 'Campaign' },
  { href: '/builder', label: 'Builder' },
];

export function GlobalChrome() {
  const pathname = usePathname() ?? '/';
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      <header className="global-header" role="navigation" aria-label="Primary">
        {NAV.map(item => (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            className={`global-nav-link${isActive(item.href) ? ' global-nav-link--active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </header>
      <footer className="global-footer">
        <a
          className="global-footer-link"
          href="https://timcao.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          a timcao game
        </a>
      </footer>
    </>
  );
}
