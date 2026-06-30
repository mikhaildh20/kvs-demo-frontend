# ROADMAP — Development Timeline

## Kanban Verification System (KVS)

---

## Project Status: ✅ COMPLETED

KVS adalah proyek akhir (tugas akhir) yang sudah selesai dikembangkan oleh Mikhail Daffa Herdiansah di PT Indonesia Koito / PT Nusantara Lighting Automotive (NLA).

---

## Fase 1: Planning & Setup
**Status**: ✅ Selesai

- [x] Definisi kebutuhan (PRD)
- [x] Arsitektur sistem (HLD)
- [x] Database design (ERD)
- [x] Tech stack selection: Next.js + Express.js + PostgreSQL
- [x] Repository setup: `mikhaildh20/kvs-demo-frontend` & `mikhaildh20/kvs-demo-backend`
- [x] Development environment setup

## Fase 2: Authentication & RBAC
**Status**: ✅ Selesai

- [x] User login/logout dengan JWT
- [x] Cookie hardening (httpOnly, secure, sameSite: strict)
- [x] Role management CRUD
- [x] Menu management dengan page path
- [x] Group menu management
- [x] Menu access per role (detail_menu)
- [x] Backend path resolver
- [x] Frontend route guard (ProtectedPage)
- [x] Sidebar filtering berdasarkan role

## Fase 3: Master Data
**Status**: ✅ Selesai

- [x] User management (CRUD + line assignment + lock/force)
- [x] Role management (CRUD + menu assignment)
- [x] Menu management (CRUD + group assignment)
- [x] Group menu management (CRUD)
- [x] Color management (CRUD)
- [x] Customer management (CRUD + supplier + QR format)
- [x] Supplier management (CRUD)
- [x] Line management (CRUD + user assignment)
- [x] Matrix management
- [x] QR format management (CRUD)

## Fase 4: Core Business Logic
**Status**: ✅ Selesai

- [x] Kanban management (CRUD + part numbers + documents)
- [x] Kanban import dari Excel (exceljs, idempotent)
- [x] OQC workflow (add + label generation + print)
- [x] OQC label canvas (canvas-based QR label)
- [x] Double Check workflow (entry + line assignment + QR scan)
- [x] Barcode Delivery Scan (import Excel + verifikasi)
- [x] BDS detail & report pages

## Fase 5: Advanced Features
**Status**: ✅ Selesai

- [x] TTS/Voice untuk kanban descriptions (backend chunking)
- [x] PDF/document viewer via app-origin proxy
- [x] Action logs (audit trail)
- [x] Profile page
- [x] Change password
- [x] Date-only handling (BDS Ship Date timezone safety)

## Fase 6: Security & Hardening
**Status**: ✅ Selesai

- [x] Helmet security headers
- [x] CORS restriction (single origin)
- [x] Rate limiting (auth + general API)
- [x] JSON body limit (1mb)
- [x] Upload size limit (10MB)
- [x] No raw SQL in model files (Prisma ORM only)
- [x] Guard test file (model-orm-refactor.test.js)
- [x] npm audit 0 vulnerabilities
- [x] systemd hardening (non-root, NoNewPrivileges, ProtectSystem)

## Fase 7: Deployment & Production
**Status**: ✅ Selesai

- [x] Backend: `kvs-demo-backend.service` (systemd, port 5000)
- [x] Frontend: `kvs-demo-frontend.service` (systemd, port 3001)
- [x] Nginx reverse proxy
- [x] Cloudflare TLS termination
- [x] Frontend: `https://kvs-demo.karsa-dev.my.id`
- [x] API: `https://kvs-demo-api.karsa-dev.my.id`
- [x] Migration: SQL Server → PostgreSQL

## Fase 8: Refactoring & Quality
**Status**: ✅ Selesai

- [x] Prisma ORM refactor (raw SQL → ORM methods)
- [x] Toast messages: English, frontend-controlled
- [x] Import idempotency (no-change states)
- [x] Branding: NLA (Nusantara Lighting Automotive)
- [x] RBAC: Hide action buttons per role path
- [x] Date-only timezone handling
- [x] ESLint + build verification

---

## Future Enhancements (Post-Skop Tugas Akhir)

- [ ] Real-time notifications (WebSocket)
- [ ] Dashboard analytics & charts
- [ ] Mobile responsive optimization
- [ ] Batch operations (bulk delete, bulk status change)
- [ ] Export to Excel/PDF
- [ ] Multi-language support (ID/EN)
- [ ] API documentation (Swagger UI)
- [ ] Automated testing coverage
- [ ] CI/CD pipeline
