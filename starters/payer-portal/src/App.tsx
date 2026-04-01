import React, { useState, useEffect } from 'react';
import { PageLayout, type NavItem } from '@dxp/ui';
import { useMemberList } from '@dxp/sdk-react';
import { useQueryClient } from '@tanstack/react-query';

// Member pages
import { Dashboard } from './pages/member/Dashboard';
import { Benefits } from './pages/member/Benefits';
import { DigitalIdCard } from './pages/member/DigitalIdCard';
import { Claims } from './pages/member/Claims';
import { ClaimDetail } from './pages/member/ClaimDetail';
import { FindProvider } from './pages/member/FindProvider';
import { CostEstimate } from './pages/member/CostEstimate';
import { PriorAuth } from './pages/member/PriorAuth';
import { CareTimeline } from './pages/member/CareTimeline';
import { CareTeam } from './pages/member/CareTeam';
import { Programs } from './pages/member/Programs';
import { Messages } from './pages/member/Messages';
import { Settings } from './pages/member/Settings';

// Provider pages
import { ProviderDashboard } from './pages/provider/ProviderDashboard';
import { ProviderPriorAuth } from './pages/provider/ProviderPriorAuth';
import { ProviderEligibility } from './pages/provider/ProviderEligibility';
import { ProviderClaims } from './pages/provider/ProviderClaims';

// Playground
import { Playground } from './pages/Playground';

// Internal pages
import { PopulationDashboard } from './pages/internal/PopulationDashboard';
import { RiskWorklist } from './pages/internal/RiskWorklist';
import { MemberRiskProfile } from './pages/internal/MemberRiskProfile';
import { PAQueue } from './pages/internal/PAQueue';
import { PADashboard } from './pages/internal/PADashboard';
import { ClaimsDashboard } from './pages/internal/ClaimsDashboard';
import { ProviderDataQuality } from './pages/internal/ProviderDataQuality';
import { HCCDashboard } from './pages/internal/HCCDashboard';
import { UtilizationDashboard } from './pages/internal/UtilizationDashboard';
import { ContractAnalytics } from './pages/internal/ContractAnalytics';
import { QualityDashboard } from './pages/internal/QualityDashboard';

// ---------------------------------------------------------------------------
// Portal modes — Member (default), Provider, Internal (payer ops)
// ---------------------------------------------------------------------------

type PortalMode = 'member' | 'provider' | 'internal';

const memberNav: NavItem[] = [
  { label: 'Dashboard', href: '/' },
  { label: 'Benefits', href: '/benefits' },
  { label: 'Digital ID', href: '/id-card' },
  { label: 'Claims', href: '/claims' },
  { label: 'Cost Estimate', href: '/cost-estimate' },
  { label: 'Find Provider', href: '/find-provider' },
  { label: 'Prior Auth', href: '/prior-auth' },
  { label: 'Care Timeline', href: '/care-timeline' },
  { label: 'Care Team', href: '/care-team' },
  { label: 'Programs', href: '/programs' },
  { label: 'Messages', href: '/messages' },
  { label: 'Settings', href: '/settings' },
];

const providerNav: NavItem[] = [
  { label: 'Dashboard', href: '/provider' },
  { label: 'Prior Auth', href: '/provider/prior-auth' },
  { label: 'Eligibility Check', href: '/provider/eligibility' },
  { label: 'Claims Status', href: '/provider/claims' },
];

const internalNav: NavItem[] = [
  { label: 'FHIR Playground', href: '/playground' },
  { label: 'Population Health', href: '/internal/population' },
  { label: 'Risk Worklist', href: '/internal/worklist' },
  { label: 'Member Profile', href: '/internal/member' },
  { label: 'PA Queue', href: '/internal/pa-queue' },
  { label: 'PA Dashboard', href: '/internal/pa-dashboard' },
  { label: 'Claims Dashboard', href: '/internal/claims-dashboard' },
  { label: 'Provider Data', href: '/internal/providers' },
  { label: 'HCC Recapture', href: '/internal/hcc' },
  { label: 'Utilization', href: '/internal/utilization' },
  { label: 'Contracts', href: '/internal/contracts' },
  { label: 'Quality', href: '/internal/quality' },
];

const navByMode: Record<PortalMode, NavItem[]> = {
  member: memberNav,
  provider: providerNav,
  internal: internalNav,
};

const defaultPathByMode: Record<PortalMode, string> = {
  member: '/',
  provider: '/provider',
  internal: '/internal/population',
};

const appNameByMode: Record<PortalMode, string> = {
  member: 'Member Portal',
  provider: 'Provider Portal',
  internal: 'Payer Operations',
};

// ---------------------------------------------------------------------------
// Page router
// ---------------------------------------------------------------------------

function renderPage(path: string) {
  switch (path) {
    // Member
    case '/':               return <Dashboard />;
    case '/benefits':       return <Benefits />;
    case '/id-card':        return <DigitalIdCard />;
    case '/claims':         return <Claims />;
    case '/claim-detail':   return <ClaimDetail />;
    case '/cost-estimate':  return <CostEstimate />;
    case '/find-provider':  return <FindProvider />;
    case '/prior-auth':     return <PriorAuth />;
    case '/care-timeline':  return <CareTimeline />;
    case '/care-team':      return <CareTeam />;
    case '/programs':       return <Programs />;
    case '/messages':       return <Messages />;
    case '/settings':       return <Settings />;

    // Provider
    case '/provider':               return <ProviderDashboard />;
    case '/provider/prior-auth':    return <ProviderPriorAuth />;
    case '/provider/eligibility':   return <ProviderEligibility />;
    case '/provider/claims':        return <ProviderClaims />;

    case '/playground':           return <Playground />;

    // Internal
    case '/internal/population':        return <PopulationDashboard />;
    case '/internal/worklist':          return <RiskWorklist />;
    case '/internal/member':            return <MemberRiskProfile />;
    case '/internal/pa-queue':          return <PAQueue />;
    case '/internal/pa-dashboard':      return <PADashboard />;
    case '/internal/claims-dashboard':  return <ClaimsDashboard />;
    case '/internal/providers':         return <ProviderDataQuality />;
    case '/internal/hcc':               return <HCCDashboard />;
    case '/internal/utilization':       return <UtilizationDashboard />;
    case '/internal/contracts':         return <ContractAnalytics />;
    case '/internal/quality':           return <QualityDashboard />;

    default: return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[var(--dxp-text)]">Page Not Found</h1>
        <p className="mt-2 text-[var(--dxp-text-secondary)]">The page at "{path}" does not exist.</p>
      </div>
    );
  }
}

// ---------------------------------------------------------------------------
// Portal mode switcher
// ---------------------------------------------------------------------------

function PortalSwitcher({
  mode,
  onChange,
}: {
  mode: PortalMode;
  onChange: (m: PortalMode) => void;
}) {
  const modes: { key: PortalMode; label: string }[] = [
    { key: 'member', label: 'Member' },
    { key: 'provider', label: 'Provider' },
    { key: 'internal', label: 'Internal' },
  ];

  return (
    <div className="flex gap-1 p-1 rounded-lg bg-[var(--dxp-surface-secondary)]">
      {modes.map((m) => (
        <button
          key={m.key}
          onClick={() => onChange(m.key)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            mode === m.key
              ? 'bg-[var(--dxp-brand)] text-white shadow-sm'
              : 'text-[var(--dxp-text-secondary)] hover:text-[var(--dxp-text)]'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Member switcher (dev mode)
// ---------------------------------------------------------------------------

function MemberSwitcher() {
  const { data: members } = useMemberList();
  const qc = useQueryClient();
  const [selected, setSelected] = useState(() => localStorage.getItem('dxp_dev_member_id') || '');

  useEffect(() => {
    if (!selected && members && members.length > 0) {
      const id = localStorage.getItem('dxp_dev_member_id') || members[0].id;
      setSelected(id);
      if (!localStorage.getItem('dxp_dev_member_id')) {
        localStorage.setItem('dxp_dev_member_id', id);
      }
    }
  }, [members, selected]);

  const handleChange = (id: string) => {
    setSelected(id);
    localStorage.setItem('dxp_dev_member_id', id);
    // Invalidate all member/care/claim queries so pages re-fetch for new member
    qc.invalidateQueries();
  };

  if (!members || members.length === 0) return null;

  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)] mb-2">
        Active Member
      </p>
      <select
        value={selected}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full text-xs px-2.5 py-1.5 rounded-md border border-[var(--dxp-border)] bg-[var(--dxp-surface)] text-[var(--dxp-text)] focus:outline-none focus:ring-1 focus:ring-[var(--dxp-brand)]"
      >
        {members.map((m) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export function App() {
  const [portalMode, setPortalMode] = useState<PortalMode>('member');
  const [currentPath, setCurrentPath] = useState('/');

  const handleModeChange = (newMode: PortalMode) => {
    setPortalMode(newMode);
    setCurrentPath(defaultPathByMode[newMode]);
  };

  const nav = navByMode[portalMode].map((item) => ({
    ...item,
    active: item.href === currentPath,
  }));

  return (
    <PageLayout
      appName={appNameByMode[portalMode]}
      navItems={nav}
      onNavigate={setCurrentPath}
      userMenu={
        <div className="space-y-4">
          <MemberSwitcher />
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)] mb-2">
              Portal Mode
            </p>
            <PortalSwitcher mode={portalMode} onChange={handleModeChange} />
          </div>
        </div>
      }
    >
      {renderPage(currentPath)}
    </PageLayout>
  );
}
