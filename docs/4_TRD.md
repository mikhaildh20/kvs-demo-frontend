# TRD — Technical Requirements Document

## Kanban Verification System (KVS)

---

## 1. Frontend Architecture

### Framework & Runtime
- **Next.js 16** dengan App Router
- **React 19** dengan server components + client components
- **Build**: `next build --webpack` (non-Turbopack)
- **React Compiler**: Enabled via `next.config.mjs` (`reactCompiler: true`)

### Dependencies Utama
| Package | Versi | Fungsi |
|---------|-------|--------|
| axios | ^1.16.0 | HTTP client ke backend API |
| bootstrap | ^5.3.8 | UI framework |
| bootstrap-icons | ^1.13.1 | Icons |
| crypto-js | ^4.2.0 | Encryption utilities (client-side) |
| isomorphic-dompurify | ^3.12.0 | XSS sanitasi |
| js-cookie | ^3.0.8 | Cookie management (minimal, auth via native cookie) |
| react-hot-toast | ^2.6.0 | Toast notifications |
| react-icons | ^5.6.0 | Icon library (fallback) |
| react-spinners | ^0.17.0 | Loading spinners |
| sweetalert | ^2.1.2 | Alert dialogs |

### Component Architecture
```
src/
├── app/                     # Next.js App Router pages
│   ├── layout.js            # Root layout (Bootstrap, fonts)
│   ├── page.js              # Landing redirect
│   ├── pages/
│   │   ├── auth/            # Login, change password, unauthorized
│   │   ├── [module]/        # CRUD pages per modul
│   │   └── ...
│   └── globals.css          # Global styles
├── component/
│   ├── common/              # UI components (Button, Table, Input, dll)
│   ├── layout/              # AppShell, Sidebar, RouteLayoutResolver
│   └── oqc/                 # OqcLabelCanvas
└── lib/                     # Utilities, API client, auth helpers
```

### Common UI Components
| Component | Fungsi |
|-----------|--------|
| Badge | Status badge (active/inactive) |
| Breadcrumb | Navigation breadcrumb |
| Button | Reusable button dengan loading state |
| Calendar | Date picker |
| Card | Card container |
| CategoryBadge | Category tag |
| Dropdown | Dropdown menu |
| Editor | Rich text / large text input |
| Filter | Table filter panel |
| Formsearch | Search form |
| Icon | Icon wrapper |
| Img | Image component with fallback |
| Input | Form input reusable |
| Label | Form label |
| Loading | Loading spinner overlay |
| Paging | Pagination component |
| Table/TableHeader/TableRow | Table builder |
| Toast/ToastProvider | Notification system |
| SweetAlert | Confirmation dialog |
| ValidationError | Field error display |

### Layout Components
| Component | Fungsi |
|-----------|--------|
| AppShell | Main application shell (sidebar + content) |
| Sidebar | Navigation sidebar (menu from API) |
| ProtectedPage | Route guard (RBAC check) |
| RouteLayoutResolver | Dynamic layout resolver |

## 2. Backend Architecture

### Framework & Runtime
- **Express.js 5** (ESM — `"type": "module"`)
- **Node.js** — server.js entry point
- **Nodemon** — dev mode hot reload

### Dependencies Utama
| Package | Fungsi |
|---------|--------|
| @prisma/client + @prisma/adapter-pg | Database ORM |
| bcrypt | Password hashing |
| cors | CORS middleware |
| crypto-js | Encryption utilities |
| exceljs | Excel parsing (read/write) |
| express-rate-limit | Rate limiting |
| helmet | Security headers |
| jsonwebtoken | JWT auth |
| multer | File upload handling |
| dotenv | Environment config |

### Project Structure
```
├── server.js               # Entry point
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── ...                 # Prisma generated
├── routes/                 # Route definitions per modul
├── models/                 # Prisma query methods
├── middlewares/             # Auth, upload, rate limit
├── services/               # Business logic layer
├── utils/                  # Helpers (path.js, etc.)
├── controllers/            # Request handlers
├── uploads/                # Uploaded files directory
└── test/                   # Test files
```

### API Route Pattern
```
/api/v1/{module}           → GET    (list/search)
/api/v1/{module}           → POST   (create)
/api/v1/{module}/:id       → GET    (detail)
/api/v1/{module}/:id       → PUT    (update)
/api/v1/{module}/:id       → DELETE (delete)
/api/v1/{module}/import    → POST   (Excel import)
```

### Middleware Stack
1. Helmet (security headers)
2. CORS (restricted origin)
3. Rate Limiter (per route group)
4. JSON Body Parser (1mb limit)
5. Multer (file upload, 10MB limit)
6. Auth JWT Verifier (protected routes)
7. Route Handler

## 3. Database Design (Prisma ORM)

### Conventions
- **Provider**: PostgreSQL (dialek Prisma `postgresql`)
- **Naming**: Snake case untuk model dan field
- **Migrations**: `prisma db push` (development/staging pattern)
- **Raw SQL**: DILARANG di file model (enforced via test guard)
- **Prefixed names**: `mst_` (master), `txn_` (transaction), `dtl_`/`detail_` (detail)

## 4. Authentication & Authorization

### JWT Flow
1. Login → server validasi credentials → generate JWT (payload: user_id, role_id, username)
2. Set cookie: `httpOnly`, `secure: true`, `sameSite: strict`
3. Setiap request API → middleware verify token dari cookie
4. Backend resolve menu path dari request path → check detail_menu untuk role user

### RBAC Implementation
- **Frontend**: Sidebar filter berdasarkan menu milik role. Action buttons (Add, Detail, Edit, Print) hidden jika path tidak ada di menu role.
- **Backend**: Path resolver (`utils/path.js`) mapping request path ke menu path, lalu verifikasi akses role.
- **Admin**: Auto-grant ke semua menu active.

## 5. Security Requirements

| Aspek | Requirement |
|-------|-------------|
| Password storage | bcrypt hashing |
| JWT secret | Environment variable, strong random |
| CORS | Single origin — frontend domain only |
| SQL Injection | Prevented by Prisma ORM |
| XSS | DOMPurify di frontend |
| CSRF | SameSite cookie |
| Rate Limit | Auth: stricter limit, API: general limit |
| File Upload | Only xlsx via exceljs, max 10MB |
| systemd | Non-root user, no new privileges, protect system |
| npm audit | 0 vulnerabilities (moderate+) |

## 6. Caching & Optimization

- **Next.js**: Automatic static optimization + server components
- **No Redis/memcache** di backend (database langsung)
- **Date handling**: UTC midnight untuk date-only fields (BDS Ship Date)

## 7. File Upload Strategy

- **Multer**: Single file upload (`upload.single('file')`)
- **Limits**: 10MB file size
- **Extension filter**: `.xlsx` only
- **Storage**: `./uploads/` di backend, diakses via Nginx proxy `/uploads/` di frontend domain
- **PDF viewer**: Load via app-origin URL untuk menghindari iframe blocking
