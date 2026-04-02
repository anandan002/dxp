export interface DxpConfig {
  bffUrl: string;
  getAccessToken: () => Promise<string | null>;
}

let config: DxpConfig = {
  bffUrl: 'http://localhost:5026/api/v1',
  getAccessToken: async () => null,
};

export function configureDxp(cfg: Partial<DxpConfig>) {
  config = { ...config, ...cfg };
}

export function getDxpConfig(): DxpConfig {
  return config;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await config.getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // Dev member switcher — pass override header when set
  const devMemberId = typeof localStorage !== 'undefined' ? localStorage.getItem('dxp_dev_member_id') : null;
  if (devMemberId) {
    headers['X-Dev-Member-Id'] = devMemberId;
  }

  const response = await fetch(`${config.bffUrl}${path}`, { ...options, headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `API error: ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

