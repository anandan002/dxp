import React, { useState, useEffect } from 'react';
import { Button, Card, CardHeader, CardContent, Badge, Tabs } from '@dxp/ui';
import type { AdapterModule } from '../data/fhir-modules';

const methodColors: Record<string, string> = {
  GET: 'success', POST: 'brand', PUT: 'warning', DELETE: 'danger',
};

const docTabs = [
  { key: 'try',      label: 'Try It' },
  { key: 'port',     label: 'Port Interface' },
  { key: 'adapters', label: 'Adapters' },
  { key: 'sdk',      label: 'SDK Usage' },
  { key: 'setup',    label: 'Setup Guide' },
];

export function ApiTester({ module: mod, accessToken }: { module: AdapterModule; accessToken?: string }) {
  const [selectedEndpoint, setSelectedEndpoint] = useState(mod.endpoints[0]);
  const [requestBody, setRequestBody] = useState(selectedEndpoint?.sampleBody || '');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('try');
  const [bffUrl] = useState(() => import.meta.env.VITE_BFF_URL || '/dxp/api/v1');

  useEffect(() => {
    setSelectedEndpoint(mod.endpoints[0]);
    setRequestBody(mod.endpoints[0]?.sampleBody || '');
    setResponse('');
    setActiveTab('try');
  }, [mod]);

  const execute = async () => {
    setLoading(true);
    setResponse('');
    try {
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      };
      if (['POST', 'PUT'].includes(selectedEndpoint.method) && requestBody) {
        options.body = requestBody;
      }
      const res = await fetch(`${bffUrl}${selectedEndpoint.path}`, options);
      const data = await res.json().catch(() => res.text());
      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setResponse(`Error: ${err instanceof Error ? err.message : 'Request failed'}`);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Module header */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--dxp-text)]">{mod.name}</h2>
        <p className="text-[var(--dxp-text-secondary)] mt-1">{mod.description}</p>
        <div className="flex gap-4 mt-3 text-sm">
          <span className="text-[var(--dxp-text-muted)]">Port: <code className="bg-[var(--dxp-border-light)] px-1.5 py-0.5 rounded text-[var(--dxp-brand)] font-mono text-xs">{mod.port}</code></span>
          <span className="text-[var(--dxp-text-muted)]">Env: <code className="bg-[var(--dxp-border-light)] px-1.5 py-0.5 rounded text-[var(--dxp-brand)] font-mono text-xs">{mod.envVar}</code></span>
        </div>
        <div className="flex gap-2 mt-2">
          {mod.adapters.map((a) => <Badge key={a.name} variant="info">{a.name}</Badge>)}
        </div>
      </div>

      {/* Doc tabs */}
      <Tabs tabs={docTabs} active={activeTab} onChange={setActiveTab} variant="underline" />

      {/* === Try It === */}
      {activeTab === 'try' && (
        <>
          <Card>
            <CardHeader><span className="text-sm font-bold">Endpoints</span></CardHeader>
            <CardContent className="p-0">
              {mod.endpoints.map((ep, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedEndpoint(ep); setRequestBody(ep.sampleBody || ''); setResponse(''); }}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-[var(--dxp-border-light)] last:border-0 hover:bg-[var(--dxp-border-light)] transition-colors ${selectedEndpoint === ep ? 'bg-[var(--dxp-brand-light)]' : ''}`}
                >
                  <Badge variant={methodColors[ep.method] as 'success'}>{ep.method}</Badge>
                  <code className="text-sm font-mono text-[var(--dxp-text)] truncate max-w-sm">{ep.path}</code>
                  <span className="text-xs text-[var(--dxp-text-muted)] ml-auto shrink-0">{ep.description}</span>
                </button>
              ))}
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <span className="text-sm font-bold">Request</span>
                <Button size="sm" onClick={execute} disabled={loading}>
                  {loading ? 'Sending...' : 'Send Request'}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="mb-3">
                  <Badge variant={methodColors[selectedEndpoint.method] as 'success'}>{selectedEndpoint.method}</Badge>
                  <code className="ml-2 text-sm font-mono">{bffUrl}{selectedEndpoint.path}</code>
                </div>
                {accessToken && <p className="text-[10px] text-[var(--dxp-success)] mb-3 font-medium">Bearer token attached</p>}
                {!accessToken && <p className="text-[10px] text-[var(--dxp-danger)] mb-3 font-medium">No auth token — login above first</p>}
                {['POST', 'PUT'].includes(selectedEndpoint.method) && (
                  <textarea
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    rows={8}
                    className="w-full rounded-[var(--dxp-radius)] border border-[var(--dxp-border)] bg-[var(--dxp-border-light)] px-3 py-2 font-mono text-xs"
                    placeholder="Request body (JSON)"
                  />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><span className="text-sm font-bold">Response</span></CardHeader>
              <CardContent>
                <pre className="w-full min-h-[200px] rounded-[var(--dxp-radius)] bg-gray-900 text-green-400 px-4 py-3 font-mono text-xs overflow-auto whitespace-pre-wrap">
                  {response || '// Click "Send Request" to see the response\n// Results come live from HAPI FHIR via the BFF adapter'}
                </pre>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* === Port Interface === */}
      {activeTab === 'port' && (
        <Card>
          <CardHeader><span className="text-sm font-bold">Port Interface — {mod.port}</span></CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--dxp-text-secondary)] mb-4">
              This abstract contract is what portal pages and SDK hooks depend on. The adapter is injected by the module factory — swap the adapter by changing one env var, zero code changes.
            </p>
            <pre className="rounded-[var(--dxp-radius)] bg-gray-900 text-blue-300 px-4 py-3 font-mono text-xs overflow-auto whitespace-pre">
{mod.portInterface}
            </pre>
            <p className="text-xs text-[var(--dxp-text-muted)] mt-4">
              File: <code>apps/bff/src/modules/{mod.name.toLowerCase().split(' ')[0]}/ports/{mod.port.toLowerCase().replace('port', '.port.ts')}</code>
            </p>
          </CardContent>
        </Card>
      )}

      {/* === Adapters === */}
      {activeTab === 'adapters' && (
        <div className="space-y-4">
          {mod.adapters.map((adapter) => (
            <Card key={adapter.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">{adapter.name}</span>
                  <Badge variant="brand">{mod.envVar}={adapter.envValue}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-[var(--dxp-text-secondary)]">{adapter.description}</p>
                <div>
                  <p className="text-xs font-bold text-[var(--dxp-text-muted)] uppercase tracking-wider mb-2">Configuration (.env)</p>
                  <pre className="rounded-[var(--dxp-radius)] bg-gray-900 text-yellow-300 px-4 py-3 font-mono text-xs overflow-auto whitespace-pre">
{adapter.config}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ))}
          <Card className="border-dashed">
            <CardContent className="text-center py-8">
              <p className="text-sm font-bold text-[var(--dxp-text-secondary)]">Need a different adapter?</p>
              <p className="text-xs text-[var(--dxp-text-muted)] mt-1">
                Create a new file in <code>adapters/</code> extending <code>{mod.port}</code>, add a <code>case</code> to the module factory. Change one env var to switch.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* === SDK Usage === */}
      {activeTab === 'sdk' && (
        <Card>
          <CardHeader><span className="text-sm font-bold">React SDK Usage (@dxp/sdk-react)</span></CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--dxp-text-secondary)] mb-4">
              Use these hooks in portal pages. They handle auth tokens, TanStack Query caching, and graceful fallback to mock data when the BFF is unavailable.
            </p>
            <pre className="rounded-[var(--dxp-radius)] bg-gray-900 text-green-300 px-4 py-3 font-mono text-xs overflow-auto whitespace-pre">
{mod.sdkUsage}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* === Setup Guide === */}
      {activeTab === 'setup' && (
        <Card>
          <CardHeader><span className="text-sm font-bold">Setup Guide</span></CardHeader>
          <CardContent>
            <pre className="rounded-[var(--dxp-radius)] bg-[var(--dxp-border-light)] text-[var(--dxp-text)] px-4 py-3 text-sm overflow-auto whitespace-pre-wrap leading-relaxed">
{mod.setupGuide}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
