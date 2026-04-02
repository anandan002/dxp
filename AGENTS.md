# Repository Guidelines

## Project Structure & Module Organization
This is an Nx monorepo.
- `apps/bff/`: NestJS backend-for-frontend (API modules and adapters under `src/modules`).
- `apps/playground/`: standalone playground app.
- `packages/ui/`: shared UI component library and Storybook stories.
- `packages/sdk-react/`: React hooks/client SDK.
- `packages/contracts/`: shared TypeScript contracts.
- `starters/insurance-portal/` and `starters/portal-nextjs/`: starter frontends.
- `infra/`: Keycloak realm and Kong declarative config.
- `docs/`: architecture, quickstart, and playbooks.

## Build, Test, and Development Commands
- `pnpm install`: install workspace dependencies (Node `>=22`, pnpm `>=10`).
- `make up`: start infra (Keycloak, Kong, HAPI FHIR) via Docker.
- `make dev`: run BFF (`:5021`) and portal (`:5020`) together.
- `make dev-bff` / `make dev-portal`: run backend or portal only.
- `pnpm build`: Nx build for all projects.
- `pnpm test`: Nx test target for all projects.
- `pnpm lint`: Nx lint target for all projects.
- `make status`: health check across local services.

## Coding Style & Naming Conventions
Use Prettier config at repo root: 2-space indent, single quotes, semicolons, trailing commas, `printWidth: 100`.
- TypeScript preferred across apps/packages.
- File naming follows existing patterns: kebab-case for feature files (for example `prior-auth.module.ts`), PascalCase for React component files (for example `AuthPanel.tsx`).
- Keep adapter-specific logic inside each module’s `adapters/` folder; keep contracts in `packages/contracts`.

## Testing Guidelines
Run all tests with `pnpm test` (Nx orchestration) or project-local commands (for BFF: `cd apps/bff && pnpm test`).
- Follow Nx production input convention: test files use `*.spec.ts` or `*.test.ts`.
- Add unit tests for new module logic and adapter behavior where feasible before merging.

## Commit & Pull Request Guidelines
Commits are enforced by Commitlint (Conventional Commits + scoped types).
- Format: `type(scope): summary` (example: `feat(bff): add payer exchange adapter toggle`).
- Allowed scopes include: `bff`, `shell`, `sdk-react`, `contracts`, `infra`, `claims`, `deps`, etc.

PRs should include:
- clear problem/solution summary,
- linked issue/ticket,
- local verification steps (`pnpm lint`, `pnpm test`, relevant `make` command),
- screenshots for UI changes (portal or Storybook).

## Security & Configuration Tips
- Copy `.env.example` to `.env` and keep secrets local; never commit `.env`.
- Validate integration credentials (Keycloak, S3/MinIO, SendGrid, Stripe, DocuSign) through environment variables, not hardcoded values.
