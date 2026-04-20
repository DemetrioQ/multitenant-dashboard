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
npm run dev      # starts Vite on http://localhost:5173
npm run build    # tsc -b && vite build
npm run lint
```

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
| Role | Description |
|---|---|
| `member` | Regular tenant user; read-only on Team page |
| `admin` | Tenant admin; can edit tenant + manage users |
| `super-admin` | Platform-level account; not scoped to a tenant; sees everything |

### Caching
All list/detail data is fetched through TanStack Query with a `localStorage` persister (see `src/lib/queryClient.ts`):

- On mount: cached data renders **immediately** — no loading flash
- Every mount also kicks off a background refetch (`staleTime: 0`)
- When the response returns, the UI silently updates if anything changed
- Cache is cleared on `signIn` / `signOut` so a different user on the same browser never sees stale data

### Vite dev proxy
`/api/v1/*` → `VITE_API_URL` (with self-signed certs allowed). `/api/uploadthing` is handled in-process by the Vite plugin in `vite.config.ts`.

## Project layout

```
src/
  api/           # axios client + per-resource API modules
  components/    # Layout, Modal, AvatarCropModal, OnboardingChecklist…
  contexts/      # AuthContext (token + role + tenant/profile via useQuery)
  hooks/         # useAuth
  lib/           # queryClient, queryKeys
  pages/         # one file per route
  router/        # ProtectedLayout + public routes
  uploadthing/   # UploadThing router (used by dev middleware)
  utils/         # formatMoney, formatDate, …
```
