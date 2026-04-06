export interface DxpConfig {
  bffUrl: string;
  getAccessToken: () => Promise<string | null>;
}

const DEV_MEMBER_STORAGE_KEY = 'dxp_dev_member_id';
const UUID_PATTERN =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;

let config: DxpConfig = {
  bffUrl: 'http://localhost:5026/api/v1',
  getAccessToken: async () => null,
};

function normalizeMemberId(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const match = value.match(UUID_PATTERN);
  return match ? match[0].toLowerCase() : null;
}

function getStoredDevMemberId(): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  const raw = localStorage.getItem(DEV_MEMBER_STORAGE_KEY);
  const normalized = normalizeMemberId(raw);
  if (!normalized && raw) {
    localStorage.removeItem(DEV_MEMBER_STORAGE_KEY);
    return null;
  }
  if (normalized && raw !== normalized) {
    localStorage.setItem(DEV_MEMBER_STORAGE_KEY, normalized);
  }
  return normalized;
}

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
  // Dev member switcher: pass override header only when member id is valid.
  const devMemberId = getStoredDevMemberId();
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
