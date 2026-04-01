import React from 'react';
import { Card, CardContent, Badge } from '@dxp/ui';

interface PortalCard {
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  badgeVariant: 'brand' | 'success' | 'info' | 'warning';
  href: string;
  external: boolean;
  features: string[];
  accentClass: string;
  iconPath: string;
}

const portals: PortalCard[] = [
  {
    title: 'Insurance Portal',
    subtitle: 'P&C / Life / Health',
    description:
      'Customer-facing insurance portal. Policy management, claims filing, document storage, and cost estimation. Wired to CMS, Storage, Notifications, Search, and Identity adapters.',
    badge: 'Demo ready',
    badgeVariant: 'success',
    href: '/insurance',
    external: false,
    features: ['My Policies', 'Claims', 'Documents', 'Get a Quote', 'Form Builder'],
    accentClass: 'from-blue-500 to-indigo-600',
    iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
  {
    title: 'Payer Portal',
    subtitle: 'Health Plan / Managed Care',
    description:
      'Health plan operations portal. 31 pages across member, provider, and internal views. Live Da Vinci PAS, FHIR R4 claims, HCC risk stratification, and population health dashboards.',
    badge: 'FHIR R4 live',
    badgeVariant: 'brand',
    href: 'http://localhost:4300',
    external: true,
    features: ['Prior Auth (Da Vinci PAS)', 'Population Health', 'Risk Stratification', 'Provider Directory', 'FHIR Playground'],
    accentClass: 'from-teal-500 to-cyan-600',
    iconPath: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  },
];

const devTools = [
  {
    label: 'API Playground',
    description: 'Interactive explorer for all BFF adapter modules — try endpoints live with auth',
    href: '/playground',
    external: false,
    iconPath: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    label: 'Integration Guide',
    description: 'Step-by-step playbook for connecting customer systems — effort estimates and adapter matrix',
    href: '/integration-guide',
    external: false,
    iconPath: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
  },
  {
    label: 'Storybook',
    description: 'Component library — 30+ UI components with variants and usage examples',
    href: '/storybook/index.html',
    external: true,
    iconPath: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  },
  {
    label: 'Swagger',
    description: 'BFF REST API documentation — all endpoints, request/response schemas',
    href: '/api/docs',
    external: true,
    iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    label: 'Docs',
    description: 'Architecture guides, adapter patterns, SDK reference, and setup instructions',
    href: '/docs/index.html',
    external: true,
    iconPath: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z',
  },
];

interface SplashProps {
  onNavigate: (path: string) => void;
}

export function Splash({ onNavigate }: SplashProps) {
  const handlePortalClick = (portal: PortalCard) => {
    if (portal.external) {
      window.open(portal.href, '_blank', 'noreferrer');
    } else {
      onNavigate(portal.href);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-14 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--dxp-brand-light)] text-[var(--dxp-brand)] text-xs font-bold mb-5 tracking-wide uppercase">
          Enterprise Portal Accelerator
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-[var(--dxp-text)] mb-4">
          DXP — Delivery Accelerator
        </h1>
        <p className="text-lg text-[var(--dxp-text-secondary)] max-w-2xl mx-auto leading-relaxed">
          Pre-built BFF adapters, battle-tested UI components, and SDK hooks for enterprise portals.
          Pick a vertical and ship in days, not months.
        </p>
        <div className="flex items-center justify-center gap-6 mt-6 text-sm text-[var(--dxp-text-muted)]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--dxp-success)] inline-block"></span>
            NestJS BFF + Port/Adapter
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--dxp-brand)] inline-block"></span>
            React + Tailwind UI
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-500 inline-block"></span>
            FHIR R4 + Da Vinci IGs
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
            Keycloak + Kong
          </span>
        </div>
      </div>

      {/* Portal cards */}
      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--dxp-text-muted)] mb-4">Portal Starters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {portals.map((portal) => (
            <Card
              key={portal.title}
              interactive
              className="overflow-hidden cursor-pointer group"
              onClick={() => handlePortalClick(portal)}
            >
              {/* Accent bar */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${portal.accentClass}`} />
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${portal.accentClass} flex items-center justify-center shadow-sm`}>
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={portal.iconPath} />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[var(--dxp-text)] group-hover:text-[var(--dxp-brand)] transition-colors">
                        {portal.title}
                      </h3>
                      <p className="text-xs text-[var(--dxp-text-muted)]">{portal.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={portal.badgeVariant}>{portal.badge}</Badge>
                    {portal.external && (
                      <svg className="w-4 h-4 text-[var(--dxp-text-muted)] opacity-50 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    )}
                  </div>
                </div>

                <p className="text-sm text-[var(--dxp-text-secondary)] leading-relaxed mb-4">
                  {portal.description}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {portal.features.map((f) => (
                    <span
                      key={f}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--dxp-border-light)] text-[var(--dxp-text-muted)]"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Dev tools */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--dxp-text-muted)] mb-4">Developer Tools</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {devTools.map((tool) => {
            const cardContent = (
              <Card interactive className="h-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-[var(--dxp-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={tool.iconPath} />
                    </svg>
                    <span className="text-sm font-bold text-[var(--dxp-text)] group-hover:text-[var(--dxp-brand)] transition-colors">
                      {tool.label}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--dxp-text-muted)] leading-relaxed">
                    {tool.description}
                  </p>
                </CardContent>
              </Card>
            );

            return tool.external ? (
              <a key={tool.label} href={tool.href} target="_blank" rel="noreferrer" className="group block">
                {cardContent}
              </a>
            ) : (
              <button key={tool.label} onClick={() => onNavigate(tool.href)} className="group block text-left w-full">
                {cardContent}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
