# PRD — Product Requirements Document

## Kanban Verification System (KVS)

---

## 1. Tujuan Produk

KVS (Kanban Verification System) adalah sistem verifikasi berbasis web untuk mendukung proses Quality Control (OQC), Double Check, dan Barcode Delivery Scan di lingkungan produksi PT Nusantara Lighting Automotive (NLA).

Sistem ini menggantikan proses manual/paper-based dengan digital workflow yang terintegrasi, mencakup manajemen kanban, pelacakan lot produksi, verifikasi QR/barcode, dan pelaporan.

## 2. Masalah yang Diselesaikan

| Masalah | Solusi KVS |
|---------|------------|
| Proses OQC masih manual dan rentan human error | Digital OQC workflow dengan QR code label generation |
| Double Check tidak terstruktur dan sulit dilacak | Double Check workflow dengan line assignment dan QR scan |
| Delivery scan masih menggunakan kertas | Barcode Delivery Scan dengan import Excel dan verifikasi barcode |
| Data kanban tersebar dan sulit dicari | Centralized kanban management dengan import Excel |
| Pelaporan lambat dan tidak real-time | Report/detail page untuk setiap modul |
| Role-based access tidak terkontrol | RBAC dengan menu path dan role management |

## 3. Target Pengguna

| Peran | Deskripsi |
|-------|-----------|
| Administrator | Mengelola user, role, menu, dan konfigurasi sistem |
| Operator OQC | Melakukan Ongoing Quality Check dan cetak label QR |
| Operator Double Check | Melakukan verifikasi ganda di lini produksi |
| Operator Gudang/Delivery | Melakukan Barcode Delivery Scan untuk pengiriman |
| Supervisor/Manajer | Melihat laporan dan monitoring |

## 4. Fitur Utama

### Authentication & Profile
- Login/logout dengan JWT
- Change password
- Profile management
- Session management

### Master Data
- **User Management**: CRUD user dengan role assignment
- **Role Management**: CRUD role dengan menu access
- **Menu Management**: CRUD menu dengan group menu
- **Group Menu Management**: CRUD group menu (sidebar grouping)
- **Color Management**: CRUD warna untuk kanban
- **Customer Management**: CRUD customer dengan QR format & supplier
- **Supplier Management**: CRUD supplier
- **Line Management**: CRUD lini produksi dengan assignment user
- **Matrix Management**: Pengaturan matrix date
- **QR Format Management**: CRUD format QR pattern

### Kanban
- Import kanban dari Excel
- View, detail, edit kanban
- Kanban part number management
- Sequence check & logistic guide documents
- TTS (Text-to-Speech) untuk deskripsi naratif

### OQC (Ongoing Quality Check)
- Add OQC record
- Generate QR label dengan canvas
- Cetak label (A4 dan sticker)
- Detail OQC

### Double Check
- Double Check entry dengan QR scan
- Line assignment
- Sequence tracking

### Barcode Delivery Scan
- Import BDS dari Excel
- Verifikasi barcode (PIK, Customer, OQC)
- Detail scan
- Report

### Action Logs
- Audit trail untuk semua aksi CRUD
- Detail log

## 5. Kriteria Keberhasilan

| Metrik | Target |
|--------|--------|
| Login page response | HTTP 200 |
| API response time | < 1s |
| Import Excel | Support .xlsx, idempotent |
| RBAC enforcement | Hide action buttons tanpa akses |
| QR/Label generation | Print-ready |
| Audit log coverage | Semua aksi CRUD tercatat |
| Security | Helmet, CORS, rate limit, no raw SQL |

## 6. Batasan dan Asumsi

- Frontend: Next.js (React 19)
- Backend: Express.js ESM
- Database: PostgreSQL
- Auth: JWT dengan cookie httpOnly
- File upload: Multer, max 10MB
- Excel import: exceljs, xlsx only
- TTS: Backend chunking, frontend textarea 2000 char limit
- Deployment: systemd + Nginx, bukan PM2
- Branding: Nusantara Lighting Automotive (NLA)
