# saas-dashboard

Frontend for a multi-tenant SaaS platform. Talks to [`saas-api`](https://github.com/DemetrioQ/dotnet-multitenant-api) (ASP.NET Core 9, Clean Architecture, MediatR, EF Core).

## Stack

- **React 19** + **TypeScript** + **Vite**
- **Tailwind v4** (`@tailwindcss/vite`)
- **TanStack Query** with `localStorage` persistence — stale-while-revalidate caching
- **React Router v7**
- **UploadThing** for avatar uploads (dev handler is wired into the Vite middleware)

## Quick start

```bash
npm install
npm run dev          # starts Vite on http://localhost:5173
npm run build        # tsc -b && vite build
npm run lint
npm run typecheck    # tsc --noEmit
npm test             # vitest run (smoke tests)
npm run test:watch   # vitest in watch mode
npm run format       # prettier --write .
```

CI (`.github/workflows/ci.yml`) runs typecheck → lint → format-check → test → build on every PR. A pre-commit hook runs `eslint --fix` + `prettier --write` on staged files via `husky` + `lint-staged`.

## Environment variables

Create a `.env` at the project root:

```env
# Backend the Vite dev proxy forwards /api/v1/* to (server-side only)
VITE_API_URL=https://localhost:7079

# Set only when frontend and API are deployed on different domains in production
# VITE_API_URL_BROWSER=https://api.example.com

# UploadThing (avatar uploads)
UPLOADTHING_TOKEN=...
UPLOADTHING_SECRET=...
```

## Architecture

### Auth

- **Access token**: `sessionStorage` (cleared on tab close)
- **Refresh token**: HttpOnly cookie (`refreshToken`), `SameSite=Strict`, `Secure` in prod
- **Tenant slug** (display only): `localStorage`
- No `X-Tenant-Id` header — the tenant is resolved on the backend from JWT claims
- 401 responses trigger a silent refresh via `src/api/client.ts` interceptor

### Roles

| Role          | Description                                                     |
| ------------- | --------------------------------------------------------------- |
| `member`      | Regular tenant user; read-only on Team page                     |
| `admin`       | Tenant admin; can edit tenant + manage users                    |
| `super-admin` | Platform-level account; not scoped to a tenant; sees everything |

### Caching

All list/detail data is fetched through TanStack Query with a `localStorage` persister (see `src/lib/queryClient.ts`):

- On mount: cached data renders **immediately** — no loading flash
- Queries have a 30s `staleTime`; within that window, navigating back to a page shows cached data without a refetch
- After the window expires, re-mounting triggers a silent background refetch (`FetchingBar` shows a thin strip at the top while anything is in flight)
- Cache is cleared on `signIn` / `signOut` so a different user on the same browser never sees stale data

### Vite dev proxy

`/api/v1/*` → `VITE_API_URL` (with self-signed certs allowed). `/api/uploadthing` is handled in-process by the Vite plugin in `vite.config.ts`.

## Project layout

```
src/
  api/              # fetch-based API client + per-resource modules
  components/
    ui/             # design-system primitives (Button, Card, Badge, Input, …)
    Layout.tsx      # app shell (sidebar + Outlet + ErrorBoundary + FetchingBar)
    Modal.tsx       # focus-trapping dialog
    PageStates.tsx  # PageLoading, PageError, FetchingBar
    ErrorBoundary.tsx
    …
  contexts/         # AuthContext (token + role + tenant/profile via useQuery)
  hooks/            # useAuth, useRateLimit
  lib/              # queryClient, queryKeys, cn() helper
  pages/            # one file per route
  router/           # ProtectedLayout + public routes
  uploadthing/      # UploadThing router (used by dev middleware)
  utils/            # formatMoney, formatDate, parseUtc
```

## Design system

See [`DESIGN.md`](./DESIGN.md) for the visual language overview, and [`src/components/ui/README.md`](./src/components/ui/README.md) for per-component docs. TL;DR: import from `src/components/ui/` instead of copy-pasting Tailwind class strings.

```tsx
import { Button, Card, Input, Badge, useConfirm, useToast } from './components/ui'
```

## Documentation

- [`DESIGN.md`](./DESIGN.md) — design tokens, visual language, port-to-storefront instructions
- [`src/components/ui/README.md`](./src/components/ui/README.md) — per-primitive usage docs
- [`MIGRATION.md`](./MIGRATION.md) — playbook for applying these upgrades to `saas-storefront`
- [`CHANGELOG.md`](./CHANGELOG.md) — what changed and when
