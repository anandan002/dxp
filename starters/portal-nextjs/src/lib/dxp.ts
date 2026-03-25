// DXP Platform configuration for this portal.
// Adjust per engagement.

export const dxpConfig = {
  bffUrl: process.env.NEXT_PUBLIC_BFF_URL || 'http://localhost:8000/api/v1',
  keycloak: {
    url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080',
    realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'dxp',
    clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'dxp-shell',
  },
};
