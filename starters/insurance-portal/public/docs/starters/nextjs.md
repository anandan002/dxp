# Next.js Portal Starter

The generic starter template for new engagements. Clone this for each client.

## What's Included

- Next.js 15 with App Router
- `@dxp/ui` component library pre-wired
- `@dxp/sdk-react` hooks pre-wired
- Tailwind CSS with brand color tokens
- DXP config file (`src/lib/dxp.ts`)
- Example dashboard page with DashboardCards

## Quick Start

```bash
# Copy for a new client
cp -r starters/portal-nextjs client-portal
cd client-portal

# Configure
# Edit src/lib/dxp.ts — BFF URL, Keycloak settings
# Edit tailwind.config.js — client brand colors

# Develop
pnpm dev  # http://localhost:4200
```

## Configuration

### `src/lib/dxp.ts`
```typescript
export const dxpConfig = {
  bffUrl: process.env.NEXT_PUBLIC_BFF_URL || 'http://localhost:8000/api/v1',
  keycloak: {
    url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080',
    realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'dxp',
    clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'dxp-shell',
  },
};
```

### Adding Pages

Create files under `src/app/`:

```tsx
// src/app/policies/page.tsx
'use client';
import { DataTable } from '@dxp/ui';
import { useCms } from '@dxp/sdk-react';

export default function Policies() {
  const { data } = useCms('policies');
  return <DataTable columns={columns} data={data?.data || []} />;
}
```

### Adding Authentication

Install `keycloak-js` and wrap the app:

```bash
pnpm add keycloak-js
```

Then configure the DxpProvider's `getAccessToken` to return the Keycloak token.
