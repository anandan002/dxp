# Insurance Customer Service Portal

A complete sample portal demonstrating all DXP features. Built for an insurance company's policyholders.

## Pages

### Dashboard
- 4 metric cards (DashboardCard): Active Policies, Open Claims, Pending Documents, Next Payment
- Recent claims list with status badges
- Notification inbox with unread count

**DXP components used**: `DashboardCard`, `StatusBadge`

### My Policies
- Sortable DataTable with policy details
- Click a row to open DetailPanel with full policy information
- Actions: Download Declaration, Request Change

**DXP components used**: `DataTable`, `StatusBadge`, `DetailPanel`

### Claims
- DataTable listing all claims with status
- "File New Claim" button opens inline form
- Form includes: policy selector, claim type, description, date, amount, document upload area

**DXP components used**: `DataTable`, `StatusBadge`

### Documents
- DataTable with document name, category badge, upload date, size
- Download button per document
- Upload Document button

**DXP components used**: `DataTable`

## Running

```bash
cd starters/insurance-portal
pnpm dev
# Open http://localhost:4200
```

## Tech Stack

- Vite + React 19
- `@dxp/ui` for all components
- `@dxp/sdk-react` for BFF hooks (DxpProvider configured in main.tsx)
- Tailwind CSS with brand color customization
- Mock data in `src/data/mock.ts` (replace with SDK hooks for real BFF integration)

## Customizing for a Client

1. Replace mock data with SDK hooks (`useCms`, `useDocuments`, etc.)
2. Update brand colors in `tailwind.config.js`
3. Modify page content to match client's policy/claims terminology
4. Add Keycloak JS adapter for real authentication
