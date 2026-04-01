import React, { useState } from 'react';
import { Card, Badge, FilterBar, type FilterOption } from '@dxp/ui';
import { useProviderSearch } from '@dxp/sdk-react';
import { providers as mockProviders } from '../../data/mock';

const mockSpecialties = [...new Set(mockProviders.map((p) => p.specialty))];

const defaultFilters: FilterOption[] = [
  ...mockSpecialties.map((s) => ({ key: s, label: s, value: s })),
  { key: 'in-network', label: 'In-Network Only', value: 'in-network' },
];

export function FindProvider() {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const { data: searchResult } = useProviderSearch({ name: search || undefined, pageSize: 50 });
  // Normalize FHIR provider shape (specialty as object, networkStatus field)
  const rawProviders = searchResult?.data ?? mockProviders;
  const providers = (rawProviders as any[]).map((p) => ({
    ...p,
    id: p.id || p.npi,
    specialty: typeof p.specialty === 'object' ? (p.specialty?.display || '') : (p.specialty || ''),
    network: p.network || p.networkStatus || 'unknown',
    languages: p.languages || [],
    distance: p.distance || null,
    rating: p.rating || null,
    reviewCount: p.reviewCount || null,
    phone: p.phone || null,
    address: typeof p.address === 'string' ? p.address : (p.address?.line?.join(', ') ? `${p.address.line.join(', ')}, ${p.address.city || ''} ${p.address.state || ''}`.trim() : null),
  }));
  const specialties = [...new Set(providers.map((p) => p.specialty).filter(Boolean))];
  const filters: FilterOption[] = [
    ...specialties.map((s) => ({ key: s, label: s, value: s })),
    { key: 'in-network', label: 'In-Network Only', value: 'in-network' },
  ];

  const filtered = providers.filter((p) => {
    const specFilters = activeFilters.filter((f) => f !== 'in-network');
    const networkFilter = activeFilters.includes('in-network');
    if (specFilters.length > 0 && !specFilters.includes(p.specialty)) return false;
    if (networkFilter && p.network !== 'in-network') return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.specialty.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Find a Provider</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Search our directory of {providers.length} providers in the Meridian network</p>
      </div>

      <div className="mb-6">
        <FilterBar
          filters={filters}
          activeFilters={activeFilters}
          onToggle={(key) => setActiveFilters((prev) => prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key])}
          onClear={() => setActiveFilters([])}
          searchPlaceholder="Search by name or specialty..."
          searchValue={search}
          onSearchChange={setSearch}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((provider) => (
          <Card key={provider.id} interactive className="p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--dxp-text)]">{provider.name}</h3>
                <p className="text-xs text-[var(--dxp-text-secondary)] mt-0.5">{provider.specialty}</p>
              </div>
              <Badge variant={provider.network === 'in-network' ? 'success' : 'warning'}>
                {provider.network === 'in-network' ? 'In-Network' : 'Out-of-Network'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-[var(--dxp-text-secondary)]">
              {provider.distance && <span>{provider.distance} mi</span>}
              {provider.rating && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-[var(--dxp-warning)]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  {provider.rating} {provider.reviewCount && `(${provider.reviewCount})`}
                </span>
              )}
            </div>
            {provider.address && <p className="text-xs text-[var(--dxp-text-secondary)]">{provider.address}</p>}
            {provider.languages.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {provider.languages.map((lang: string) => (
                  <span key={lang} className="text-[10px] px-2 py-0.5 rounded bg-[var(--dxp-border-light)] text-[var(--dxp-text-secondary)] font-medium">{lang}</span>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-[var(--dxp-border-light)]">
              <span className="text-xs text-[var(--dxp-text-muted)]">{provider.acceptingNewPatients ? 'Accepting new patients' : 'Not accepting new patients'}</span>
              {provider.phone && <span className="text-xs font-bold text-[var(--dxp-brand)]">{provider.phone}</span>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
