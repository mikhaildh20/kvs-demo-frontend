# HLD — High-Level Design

## Kanban Verification System (KVS)

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Cloudflare                          │
│                      (CDN / SSL / Proxy)                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                         Nginx                               │
│              Reverse Proxy / SSL Termination                 │
│  ┌────────────────┐  ┌────────────────┐                    │
│  │ kvs-demo.karsa │  │kvs-demo-api.   │                    │
│  │ -dev.my.id     │  │karsa-dev.my.id │                    │
│  │ → localhost:3001│  │ → localhost:5000│                   │
│  └────────────────┘  └────────────────┘                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼─────────────────────┐
        │                  │                      │
┌───────▼───────┐  ┌──────▼──────┐  ┌───────────▼──────────┐
│   Frontend     │  │   Backend   │  │   Static / Uploads   │
│  Next.js 16    │  │  Express 5  │  │   /uploads/ proxy    │
│  Port 3001     │  │  Port 5000  │  │                      │
│  systemd       │  │  systemd    │  │  via Nginx direct    │
└────────────────┘  └──────┬──────┘  └──────────────────────┘
                           │
                    ┌──────▼──────┐
                    │  PostgreSQL │
                    │  Database   │
                    │kvs_demo_   │
                    │  backend   │
                    └─────────────┘
```

## 2. Component Diagram

### Frontend (Next.js 16)
- **App Router** (`src/app/`)
  - `layout.js` — Root layout dengan Bootstrap CSS
  - `page.js` — Landing/redirect
  - `pages/auth/` — Login, Change Password, Unauthorized
  - `pages/` — Semua modul bisnis (CRUD pages)
- **Components** (`src/component/`)
  - `common/` — UI primitives: Button, Table, Input, Modal, Toast, Badge, Card, Calendar, Dropdown, dll
  - `layout/` — AppShell, Sidebar, ProtectedPage, RouteLayoutResolver
  - `oqc/` — OqcLabelCanvas (canvas-based QR label generation)
- **Lib** (`src/lib/`)
  - API client (axios), auth utilities

### Backend (Express.js 5 ESM)
- **Routes** — RESTful endpoints per modul
- **Models** — Prisma ORM queries
- **Middlewares** — Auth JWT, rate limiting, file upload (multer)
- **Utils** — Path resolver (`path.js`), helpers
- **Services** — Business logic

### Database (PostgreSQL)
- **ORM**: Prisma dengan adapter `@prisma/adapter-pg`
- **Schema**: 14 models (tables) dengan foreign key relations
- **Migration**: `prisma db push` pattern

### Infrastructure
- **Runtime**: systemd services (`kvs-demo-frontend.service`, `kvs-demo-backend.service`)
- **User**: `kvsdemo` (non-root)
- **systemd hardening**: `NoNewPrivileges`, `ProtectSystem=strict`, `ProtectHome`, `PrivateTmp`

## 3. Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js 16, React 19, Bootstrap 5, Axios, Bootstrap Icons, React Icons |
| Backend | Express.js 5 (ESM node:module), Prisma 7, JWT, Bcrypt |
| Database | PostgreSQL (via Prisma adapter-pg) |
| File Upload | Multer (max 10MB, xlsx only untuk Excel) |
| Excel Parser | exceljs (bukan xlsx vulnerable package) |
| Security | Helmet, express-rate-limit, CORS |
| Deployment | systemd + Nginx, Cloudflare TLS |

## 4. URL Routing

| URL | Target | Service |
|-----|--------|---------|
| `https://kvs-demo.karsa-dev.my.id` | `localhost:3001` | Frontend |
| `https://kvs-demo.karsa-dev.my.id/uploads/*` | Static files via Nginx (backend uploads) | Proxy |
| `https://kvs-demo-api.karsa-dev.my.id` | `localhost:5000` | Backend API |

## 5. Security Architecture

- **CORS**: Restricted to `https://kvs-demo.karsa-dev.my.id`
- **Bad CORS**: Response 403
- **Helmet**: Security headers enabled
- **X-Powered-By**: Disabled
- **Rate Limiting**: Auth routes + general API routes dibatasi
- **JSON Body Limit**: 1mb
- **Upload Max Size**: 10MB
- **Upload Restrictions**: No dotfiles, no directory listing
- **Excel Only**: `.xlsx` via exceljs (reject `.xls` dan file lain)
- **No Raw SQL**: Prisma ORM methods only (guard via test file)
- **Auth Cookie**: `sameSite: strict`, `secure` on HTTPS
