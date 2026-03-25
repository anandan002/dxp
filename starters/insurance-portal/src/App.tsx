import React, { useState } from 'react';
import { PageLayout, type NavItem } from '@dxp/ui';
import { Dashboard } from './pages/Dashboard';
import { Policies } from './pages/Policies';
import { Claims } from './pages/Claims';
import { Documents } from './pages/Documents';
import { Playground } from './pages/Playground';

const portalNav: NavItem[] = [
  { label: 'Dashboard', href: '/' },
  { label: 'My Policies', href: '/policies' },
  { label: 'Claims', href: '/claims' },
  { label: 'Documents', href: '/documents' },
];

const devNav = [
  { label: 'API Playground', href: '/playground', external: false },
  { label: 'Docs', href: '/docs/index.html', external: true },
  { label: 'Storybook', href: '/storybook/index.html', external: true },
  { label: 'Swagger', href: '/api/docs', external: true },
];

function renderPage(path: string) {
  switch (path) {
    case '/policies': return <Policies />;
    case '/claims': return <Claims />;
    case '/documents': return <Documents />;
    case '/playground': return <Playground />;
    default: return <Dashboard />;
  }
}

export function App() {
  const [currentPath, setCurrentPath] = useState('/');

  const allNav = [
    ...portalNav.map((item) => ({ ...item, active: item.href === currentPath })),
  ];

  const devItems = devNav.map((item) => ({ ...item, active: item.href === currentPath }));

  return (
    <PageLayout
      appName="Acme Insurance"
      navItems={allNav}
      onNavigate={setCurrentPath}
      userMenu={
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)] mb-2">Dev Tools</p>
          <div className="space-y-1">
            {devItems.map((item) => (
              item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-between text-xs px-2 py-1.5 rounded text-[var(--dxp-text-secondary)] hover:text-[var(--dxp-text)] transition-colors"
                >
                  {item.label}
                  <svg className="w-3 h-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              ) : (
                <button
                  key={item.href}
                  onClick={() => setCurrentPath(item.href)}
                  className={`w-full text-left text-xs px-2 py-1.5 rounded transition-colors ${
                    currentPath === item.href ? 'bg-[var(--dxp-brand-light)] text-[var(--dxp-brand)]' : 'text-[var(--dxp-text-secondary)] hover:text-[var(--dxp-text)]'
                  }`}
                >
                  {item.label}
                </button>
              )
            ))}
          </div>
        </div>
      }
    >
      {renderPage(currentPath)}
    </PageLayout>
  );
}
