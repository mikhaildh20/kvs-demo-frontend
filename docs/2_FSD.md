# FSD — Functional Specification Document

## Kanban Verification System (KVS)

---

## 1. Authentication & Profile

### Login
- **Trigger**: User membuka halaman login
- **Flow**: Input username + password → POST `/api/v1/auth/login` → Validasi bcrypt → Generate JWT → Set cookie (`sameSite: strict`, `secure` di HTTPS) → Redirect ke dashboard
- **Validasi**: Username unik, password diverifikasi dengan bcrypt
- **Edge Cases**: User locked (`usr_isLocked`), user forced change password (`usr_isForced`)
- **Error**: Invalid credential → toast error, account locked → toast khusus

### Change Password
- **Trigger**: User mengubah password dari halaman profile
- **Flow**: Input old + new password → PUT `/api/v1/auth/change-password` → Update bcrypt hash → Success toast
- **Validasi**: Minimal length, old password harus match

### Unauthorized Page
- Menampilkan halaman 403 jika user tidak punya akses menu

## 2. Master Data Management

### User Management
**Halaman**: `/pages/user` | `/pages/user/add` | `/pages/user/detail/[id]` | `/pages/user/edit/[id]`
- **Create**: Input fullname, username, password, role → POST `/api/v1/user`
- **Read**: Tabel dengan paging, search → GET `/api/v1/user`
- **Update**: Edit field, role → PUT `/api/v1/user/:id`
- **Detail**: Informasi lengkap user + line assignment
- **Line Assignment**: User bisa diassign ke line produksi (detail_line)
- **Status**: Active/inactive toggle
- **Lock/Force**: Admin bisa lock user atau force change password

### Role Management
**Halaman**: `/pages/role` | `/pages/role/add` | `/pages/role/detail/[id]` | `/pages/role/edit/[id]`
- **Create**: Input nama role → POST `/api/v1/role`
- **Menu Access**: Assign menu ke role via detail_menu
- **RBAC Enforcement**: Hidden action buttons jika role tidak punya path matching

### Menu Management
**Halaman**: `/pages/menu` | `/pages/menu/add` | `/pages/menu/edit/[id]`
- **Create**: Input nama menu, path, icon, group menu → POST `/api/v1/menu`
- **Path-based**: Hanya page path (e.g., `/pages/kanban`), bukan API path
- **Group Menu**: Sidebar grouping

### Group Menu Management
**Halaman**: `/pages/group-menu` | `/pages/group-menu/add` | `/pages/group-menu/detail/[id]` | `/pages/group-menu/edit/[id]`
- **Create**: Input nama group → POST `/api/v1/group-menu`
- **Detail**: Menampilkan menu yang termasuk dalam group

### Color Management
**Halaman**: `/pages/color` | `/pages/color/add` | `/pages/color/edit/[id]`
- **Create**: Input nama warna → POST `/api/v1/color`
- **Used in**: Assignment ke kanban (color coding)

### Customer Management
**Halaman**: `/pages/customer` | `/pages/customer/add` | `/pages/customer/detail/[id]` | `/pages/customer/edit/[id]`
- **Create**: Input code, name, supplier, QR format → POST `/api/v1/customer`
- **Code**: Unique, max 4 karakter
- **Relasi**: Supplier, QR Format

### Supplier Management
**Halaman**: `/pages/supplier` | `/pages/supplier/add` | `/pages/supplier/detail/[id]` | `/pages/supplier/edit/[id]`
- **Create**: Input code, name → POST `/api/v1/supplier`
- **Code**: Unique via partial index

### Line Management
**Halaman**: `/pages/line` | `/pages/line/add` | `/pages/line/detail/[id]` | `/pages/line/edit/[id]`
- **Create**: Input code, assign users → POST `/api/v1/line`
- **User Assignment**: Multiple users per line via detail_line

### Matrix Management
**Halaman**: `/pages/matrix`
- Display/edit matrix date configuration
- Fields: actual_date, date, actual_month, month, actual_year, year

### QR Format Management
**Halaman**: `/pages/qr-format` | `/pages/qr-format/add` | `/pages/qr-format/detail/[id]` | `/pages/qr-format/edit/[id]`
- **Create**: Input name, pattern (Text), sequence length → POST `/api/v1/qr-format`
- **Pattern**: Format template untuk QR code
- **Sequence Length**: Auto-increment length (default: 4)

## 3. Kanban Management

### Kanban List
**Halaman**: `/pages/kanban`
- Searchable table dengan paging
- Filter by status, customer, color
- Action: Add, Detail, Edit, Print

### Kanban Add
**Halaman**: `/pages/kanban/add`
- Input: Kanban no (unique, 5 char), customer, color, qty box, special flag, device no, cert mark, stamp, remark
- **Narrative Description**: Textarea 2000 char limit untuk sequence check & logistic guide
- **Documents**: Upload PDF untuk sequence check, logistic guide, instruction work path
- **Part Numbers**: Multiple part number entries per kanban
- **TTS Voice**: Upload voice file untuk sequence check & logistic guide

### Kanban Detail
**Halaman**: `/pages/kanban/detail/[id]`
- Full information display
- Part numbers list
- Document viewer via app-origin proxy (`/uploads/...`)

### Kanban Edit
**Halaman**: `/pages/kanban/edit/[id]`
- Update semua field kanban
- Manage part numbers dan documents

### Kanban Import
- **Trigger**: Upload Excel `.xlsx` dari halaman kanban
- **Flow**: Parse Excel (exceljs) → Validasi kolom → Insert/update batch
- **Idempotent**: Re-import file identik menghasilkan `noChanges: true`
- **Validation**: Missing column names → English error toast

## 4. OQC (Ongoing Quality Check)

**Halaman**: `/pages/oqc` | `/pages/oqc/add` | `/pages/oqc/detail/[id]`
- **Add**: Pilih kanban, input lot no, qty box, qty plan → Generate QR label
- **QR Label**: Generate via canvas dengan format OQC barcode
- **Print Labels**: Sticker labels (A4 dan individual)
- **Detail**: Tampilkan informasi OQC + generated labels

## 5. Double Check

**Halaman**: `/pages/double-check`
- **Entry**: Pilih kanban, assign line, scan QR, input qty total & NG
- **Sequence**: Setiap entry memiliki sequence number
- **QR Scan**: Input scanned QR string (manual atau scanner)

## 6. Barcode Delivery Scan

**Halaman**: `/pages/barcode-delivery-scan`
- **Import Excel**: Upload `.xlsx` dengan kolom: Ship Date, Ship No, S/O No, P/O No, Draw No, CUS Cd, Qty Per Box, Box Qty
- **Idempotent**: Duplicate import → inserted/updated/unchanged counts
- **Date Handling**: Ship Date tetap date-only, tidak bergeser timezone

**Halaman**: `/pages/barcode-delivery-scan-import`
- Verifikasi detail hasil import

**Halaman**: `/pages/barcode-delivery-scan-report/detail/[id]`
- Detail delivery scan dengan barcode verification

## 7. Action Logs

**Halaman**: `/pages/log` | `/pages/log/detail/[id]`
- Audit trail: mencatat aksi (create/update/delete), old value, new value
- Relasi ke menu untuk konteks

## 8. Roles & Permissions Flow

1. Admin mendefinisikan menu dengan path (e.g., `/pages/kanban/add`)
2. Admin assign menu ke role via detail_menu
3. User login → load menu access → render sidebar sesuai role
4. Frontend hide action buttons jika current role tidak memiliki path:
   - `/pages/{module}/add`
   - `/pages/{module}/detail/[id]`
   - `/pages/{module}/edit/[id]`
   - `/pages/{module}/print/[id]`
5. Backend verify path via `utils/path.js`
