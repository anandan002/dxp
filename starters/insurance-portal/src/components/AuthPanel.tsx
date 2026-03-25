import React, { useState, useEffect } from 'react';
import { Button, Input, Card, CardHeader, CardContent, Badge } from '@dxp/ui';

interface TokenInfo {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  obtainedAt: number;
  decoded: Record<string, unknown>;
}

interface AuthPanelProps {
  token: TokenInfo | null;
  onTokenChange: (token: TokenInfo | null) => void;
}

const KEYCLOAK_URL = 'http://localhost:8080';
const REALM = 'dxp';
const CLIENT_ID = 'dxp-shell'; // Public client — no secret needed
const TOKEN_URL = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`;

function decodeJwt(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return {};
  }
}

function isExpired(token: TokenInfo): boolean {
  return Date.now() > token.obtainedAt + token.expiresIn * 1000;
}

export function AuthPanel({ token, onTokenChange }: AuthPanelProps) {
  const [username, setUsername] = useState('admin@dxp.local');
  const [password, setPassword] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToken, setShowToken] = useState(false);

  const login = async () => {
    setLoading(true);
    setError('');
    try {
      const body = new URLSearchParams({
        grant_type: 'password',
        client_id: CLIENT_ID,
        username,
        password,
      });

      const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error_description: res.statusText }));
        throw new Error(err.error_description || err.error || 'Login failed');
      }

      const data = await res.json();
      const decoded = decodeJwt(data.access_token);

      onTokenChange({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        obtainedAt: Date.now(),
        decoded,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
    setLoading(false);
  };

  const logout = () => {
    onTokenChange(null);
    setShowToken(false);
  };

  const expired = token ? isExpired(token) : false;

  if (token && !expired) {
    const d = token.decoded;
    const roles = ((d.realm_access as { roles?: string[] })?.roles || []).filter(
      (r: string) => !r.startsWith('default-roles') && r !== 'offline_access' && r !== 'uma_authorization',
    );
    const remainingSec = Math.max(0, Math.round((token.obtainedAt + token.expiresIn * 1000 - Date.now()) / 1000));

    return (
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[var(--dxp-brand)] text-white flex items-center justify-center text-xs font-bold">
                {String(d.given_name || '?')[0]}{String(d.family_name || '?')[0]}
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--dxp-text)]">{String(d.name || d.preferred_username)}</p>
                <p className="text-xs text-[var(--dxp-text-muted)]">{String(d.email)} &middot; tenant: {String(d.tenant_id || 'n/a')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success">Authenticated</Badge>
              <span className="text-[10px] text-[var(--dxp-text-muted)]">{remainingSec}s</span>
              <Button variant="ghost" size="sm" onClick={logout}>Logout</Button>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {roles.map((r: string) => <Badge key={r} variant="brand">{r}</Badge>)}
          </div>
          <button
            onClick={() => setShowToken(!showToken)}
            className="text-xs text-[var(--dxp-brand)] hover:underline"
          >
            {showToken ? 'Hide' : 'Show'} JWT token
          </button>
          {showToken && (
            <pre className="text-[10px] bg-gray-900 text-green-400 p-3 rounded-[var(--dxp-radius)] overflow-auto max-h-40 font-mono">
              {token.accessToken}
            </pre>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">Keycloak Authentication</span>
          <Badge variant={expired ? 'danger' : 'default'}>{expired ? 'Expired' : 'Not Authenticated'}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-[var(--dxp-text-secondary)]">
          Login with Keycloak to get a JWT token. All API calls will include the Bearer token.
        </p>
        <div className="grid grid-cols-2 gap-3 text-xs text-[var(--dxp-text-muted)]">
          <div>Keycloak: <code className="text-[var(--dxp-brand)]">{KEYCLOAK_URL}</code></div>
          <div>Realm: <code className="text-[var(--dxp-brand)]">{REALM}</code></div>
          <div>Client: <code className="text-[var(--dxp-brand)]">{CLIENT_ID}</code></div>
          <div>Grant: <code className="text-[var(--dxp-brand)]">password</code></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--dxp-text-secondary)] mb-1">Username</label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin@dxp.local" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--dxp-text-secondary)] mb-1">Password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="admin" />
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-[var(--dxp-text-muted)]">
          <span>Test users: admin@dxp.local / admin &middot; user@acme.local / user</span>
        </div>
        {error && <p className="text-xs text-[var(--dxp-danger)] font-medium">{error}</p>}
        <Button onClick={login} disabled={loading} size="md">
          {loading ? 'Authenticating...' : 'Login with Keycloak'}
        </Button>
      </CardContent>
    </Card>
  );
}
