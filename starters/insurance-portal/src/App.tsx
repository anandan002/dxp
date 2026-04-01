import React, { useState } from 'react';
import { PageLayout, type NavItem } from '@dxp/ui';
import { Splash } from './pages/Splash';
import { Dashboard } from './pages/Dashboard';
import { Policies } from './pages/Policies';
import { Claims } from './pages/Claims';
import { Documents } from './pages/Documents';
import { Playground } from './pages/Playground';
import { GetQuote } from './pages/GetQuote';
import { Settings } from './pages/Settings';
import { FormBuilder } from './pages/FormBuilder';
import { IntegrationGuide } from './pages/IntegrationGuide';

// ── Nav sets ────────────────────────────────────────────────────────────────

const homeNav: NavItem[] = [
  { label: 'Home', href: '/' },
];

const insuranceNav: NavItem[] = [
  { label: '← Home', href: '/' },
  { label: 'Dashboard', href: '/insurance' },
  { label: 'My Policies', href: '/insurance/policies' },
  { label: 'Claims', href: '/insurance/claims' },
  { label: 'Documents', href: '/insurance/documents' },
  { label: 'Get a Quote', href: '/insurance/quote' },
  { label: 'Form Builder', href: '/insurance/form-builder' },
  { label: 'Settings', href: '/insurance/settings' },
];

const playgroundNav: NavItem[] = [
  { label: '← Home', href: '/' },
  { label: 'API Playground', href: '/playground' },
];

function navForPath(path: string): NavItem[] {
  if (path.startsWith('/insurance')) return insuranceNav;
  if (path === '/playground') return playgroundNav;
  return homeNav;
}

// ── Dev tools sidebar ────────────────────────────────────────────────────────

const devTools = [
  { label: 'API Playground',    href: '/playground',          external: false },
  { label: 'Integration Guide', href: '/integration-guide',   external: false },
  { label: 'Storybook',         href: '/storybook/index.html', external: true },
  { label: 'Swagger',           href: '/api/docs',             external: true },
  { label: 'Docs',              href: '/docs/index.html',      external: true },
  { label: 'Payer Portal',      href: 'http://localhost:4300', external: true },
];

// ── Page router ──────────────────────────────────────────────────────────────

function renderPage(path: string, onNavigate: (p: string) => void) {
  switch (path) {
    case '/insurance':              return <Dashboard />;
    case '/insurance/policies':     return <Policies />;
    case '/insurance/claims':       return <Claims />;
    case '/insurance/documents':    return <Documents />;
    case '/insurance/quote':        return <GetQuote />;
    case '/insurance/settings':     return <Settings />;
    case '/insurance/form-builder': return <FormBuilder />;
    case '/playground':             return <Playground />;
    case '/integration-guide':      return <IntegrationGuide onNavigate={onNavigate} />;
    default:                        return <Splash onNavigate={onNavigate} />;
  }
}

// ── App ──────────────────────────────────────────────────────────────────────

export function App() {
  const [currentPath, setCurrentPath] = useState('/');

  const navItems = navForPath(currentPath).map((item) => ({
    ...item,
    active: item.href === currentPath,
  }));

  return (
    <PageLayout
      appName="DXP"
      navItems={navItems}
      onNavigate={setCurrentPath}
      userMenu={
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)] mb-2">
            Dev Tools
          </p>
          <div className="space-y-1">
            {devTools.map((item) =>
              item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-between text-xs px-2 py-1.5 rounded text-[var(--dxp-text-secondary)] hover:text-[var(--dxp-text)] transition-colors"
                >
                  {item.label}
                  <svg className="w-3 h-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ) : (
                <button
                  key={item.href}
                  onClick={() => setCurrentPath(item.href)}
                  className={`w-full text-left text-xs px-2 py-1.5 rounded transition-colors ${
                    currentPath === item.href
                      ? 'bg-[var(--dxp-brand-light)] text-[var(--dxp-brand)]'
                      : 'text-[var(--dxp-text-secondary)] hover:text-[var(--dxp-text)]'
                  }`}
                >
                  {item.label}
                </button>
              )
            )}
          </div>
        </div>
      }
    >
      {renderPage(currentPath, setCurrentPath)}
    </PageLayout>
  );
}
