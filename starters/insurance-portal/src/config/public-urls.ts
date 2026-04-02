type ViteEnvShape = {
  VITE_DXP_PUBLIC_BASE_URL?: string;
};

const viteEnv = (import.meta as ImportMeta & { env?: ViteEnvShape }).env;
const rawPublicBaseUrl = (viteEnv?.VITE_DXP_PUBLIC_BASE_URL ?? '').trim().replace(/\/+$/, '');

export function toPublicUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!rawPublicBaseUrl) {
    return normalizedPath;
  }
  return `${rawPublicBaseUrl}${normalizedPath}`;
}
