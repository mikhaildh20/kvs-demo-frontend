# PRODUCT_SPEC — Product Specification

## Kanban Verification System (KVS)

---

## Deskripsi Produk

KVS (Kanban Verification System) adalah sistem manajemen kualitas berbasis web yang dirancang untuk operasi produksi PT Nusantara Lighting Automotive (NLA). Sistem ini mengintegrasikan proses Ongoing Quality Check (OQC), Double Check, dan Barcode Delivery Scan dalam satu platform terpusat.

## Target Pengguna

| Role | Kegunaan |
|------|----------|
| Admin | Konfigurasi sistem, user, role, menu |
| Operator OQC | Verifikasi kualitas, cetak QR label |
| Operator Double Check | Verifikasi ganda di lini produksi |
| Operator Delivery | Scan barcode untuk pengiriman |
| Supervisor | Monitoring dan pelaporan |

## Fitur Detail

### 1. Authentication & Access Control
- Login/logout dengan JWT token
- Password policy (bcrypt hashing)
- Session management via httpOnly cookie
- Force password change (admin action)
- Account lockout (admin action)
- Role-based access control (RBAC)
- Per-page menu access assignment
- Dynamic sidebar sesuai role

### 2. Master Data Management
- **10 master data modules**: User, Role, Menu, Group Menu, Color, Customer, Supplier, Line, Matrix, QR Format
- Setiap modul: CRUD + search + paging + status toggle
- Relasi antar master data (customer → supplier, customer → QR format, line → users)
- Admin auto-grant menu access

### 3. Kanban Management
- CRUD kanban dengan unique 5-character number
- Part number management (multiple per kanban)
- Document uploads: instruction work, sequence check, logistic guide
- TTS/Voice generation untuk deskripsi naratif (max 2000 char)
- Excel import (idempotent, validasi kolom)
- Color coding untuk visual identification
- OQC barcode reference

### 4. OQC (Ongoing Quality Check)
- Select kanban → Enter lot no, qty plan
- Canvas-based QR label generation
- Print: A4 sheets dan individual stickers
- Track: total labels, total A4 sheets

### 5. Double Check
- Select kanban + assign line
- QR scan input (manual/scanner)
- Quantity total & NG (defect) tracking
- Sequence numbering per session
- Report page

### 6. Barcode Delivery Scan (BDS)
- Excel import: Ship Date, Ship No, S/O No, P/O No, Draw No, CUS Cd, Qty Per Box, Box Qty
- Barcode verification: PIK barcode, Customer barcode, OQC barcode
- Date-only timezone safety (Ship Date)
- Idempotent re-import (inserted/updated/unchanged counts)
- Detail dan report pages

### 7. Action Logs
- Automatic audit trail untuk semua CRUD
- Old value / new value tracking
- Menu context association

## User Experience (UX)

### Navigation
- Sidebar navigation dengan grouping
- Breadcrumb untuk orientasi
- Protected pages (route guard)
- Loading states dan spinners

### Feedback
- Toast notifications (English only)
- SweetAlert confirmations
- Validation error display
- Import progress dan results

### Data Display
- Searchable + filterable tables
- Pagination
- Status badges
- Detail views dengan sub-tables

### Forms
- Input validation
- Dropdown selects (load from master data)
- Date pickers
- File upload (drag & drop)
- Textarea dengan character limit

## Non-Functional Requirements

| Aspek | Requirement |
|-------|-------------|
| Performance | API response < 1s |
| Security | JWT + bcrypt + Helmet + CORS + rate limit |
| Data Integrity | Prisma ORM (no raw SQL) |
| Idempotency | Import tidak duplikat data |
| Audit Trail | Semua perubahan tercatat |
| Deployment | systemd + Nginx + Cloudflare |
| Browser Support | Modern browsers (ES2020+) |
| Data Protection | Env files tidak committed |

## Branding
- Logo: `/images/logoNLA.png`
- Company: Nusantara Lighting Automotive (NLA)
- Color scheme: Mengikuti Bootstrap 5 defaults
