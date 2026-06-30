# ERD — Entity Relationship Diagram

## Kanban Verification System (KVS)

---

## Entity List (14 Tables)

### Legend
- 🔑 = Primary Key
- 🔗 = Foreign Key
- 🆔 = Unique Index

---

### 1. `mst_users` — Master Users

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| 🔑 `usr_id` | Int (auto) | Primary key |
| 🔗 `rol_id` | Int? | FK → mst_roles.rol_id |
| `usr_fullname` | VarChar(55) | Nama lengkap |
| 🆔 `usr_username` | VarChar(30) | Unique login username |
| `usr_password` | Text | bcrypt hash |
| `usr_status` | Int? | 1=active, 0=inactive |
| `usr_isLocked` | Int? | Lock status |
| `usr_isForced` | Int? | Force change password |
| Audit fields | Timestamp | creadate, modidate, creaby, modiby |

**Relations**: 1 user → N detail_line, N user → 1 role

---

### 2. `mst_roles` — Master Roles

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| 🔑 `rol_id` | Int (auto) | Primary key |
| `rol_name` | VarChar(20) | Nama role |
| `rol_status` | Int? | Active/inactive |
| Audit fields | Timestamp | |

**Relations**: 1 role → N user, 1 role → N detail_menu

---

### 3. `mst_menus` — Master Menus

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| 🔑 `mnu_id` | Int (auto) | Primary key |
| 🔗 `grm_id` | Int? | FK → mst_group_menu.grm_id |
| `mnu_icon` | VarChar(20) | Bootstrap icon name |
| `mnu_name` | VarChar(55) | Display name |
| `mnu_path` | VarChar(50) | Page path (e.g., `/pages/kanban`) |
| `mnu_status` | Int? | Active/inactive |
| Audit fields | Timestamp | |

**Relations**: 1 menu → 1 group_menu, 1 menu → N detail_menu, 1 menu → N action_logs

---

### 4. `mst_group_menu` — Master Group Menu

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| 🔑 `grm_id` | Int (auto) | Primary key |
| `grm_name` | VarChar(20) | Group display name |
| `grm_status` | Int? | Active/inactive |
| Audit fields | Timestamp | |

**Relations**: 1 group → N menus (sidebar grouping)

---

### 5. `detail_menu` — Detail Menu (Role-Menu Assignment)

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| 🔑 `mnu_id` | Int | FK → mst_menus.mnu_id (PK part 1) |
| 🔑 `rol_id` | Int | FK → mst_roles.rol_id (PK part 2) |
| `dtm_status` | Int? | Active/inactive |
| Audit fields | Timestamp | |

**Composite PK**: (mnu_id, rol_id)
**Relations**: N detail_menu → 1 menu, N detail_menu → 1 role

---

### 6. `mst_colors` — Master Colors

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| 🔑 `clr_id` | Int (auto) | Primary key |
| `clr_name` | VarChar(55) | Warna |
| `clr_status` | Int? | Active/inactive |
| Audit fields | Timestamp | |

**Relations**: 1 color → N kanban

---

### 7. `mst_customers` — Master Customers

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| 🔑 `cst_id` | Int (auto) | Primary key |
| 🔗 `spl_id` | Int? | FK → mst_suppliers.spl_id |
| 🔗 `qfm_id` | Int? | FK → mst_qr_formats.qfm_id |
| 🆔 `cst_code` | VarChar(4) | Unique customer code |
| `cst_name` | VarChar(55) | Nama customer |
| `cst_status` | Int? | Active/inactive |
| Audit fields | Timestamp | |

**Relations**: 1 customer → 1 supplier (optional), 1 customer → 1 QR format (optional), 1 customer → N kanban, 1 customer → N BDS records

---

### 8. `mst_suppliers` — Master Suppliers

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| 🔑 `spl_id` | Int (auto) | Primary key |
| 🆔 `spl_code` | VarChar(30) | Unique supplier code (partial index) |
| `spl_status` | Int? | Active/inactive |
| Audit fields | Timestamp | |

**Relations**: 1 supplier → N customers

---

### 9. `mst_qr_formats` — Master QR Formats

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| 🔑 `qfm_id` | Int (auto) | Primary key |
| `qfm_name` | VarChar(55) | Format name |
| `qfm_pattern` | Text | QR pattern template |
| `qfm_seq_length` | Int? | Auto-increment length (default 4) |
| `qfm_status` | Int? | Active/inactive |
| Audit fields | Timestamp | |

**Relations**: 1 QR format → N customers

---

### 10. `mst_lines` — Master Lines (Produksi)

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| 🔑 `lin_id` | Int (auto) | Primary key |
| `lin_code` | VarChar(10) | Line code |
| `lin_status` | Int? | Active/inactive |
| Audit fields | Timestamp | |

**Relations**: 1 line → N detail_line, 1 line → N double_check

---

### 11. `detail_line` — Detail Line (User-Line Assignment)

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| 🔑 `usr_id` | Int | FK → mst_users.usr_id (PK part 1) |
| 🔑 `lin_id` | Int | FK → mst_lines.lin_id (PK part 2) |
| `dle_status` | Int? | Active/inactive |
| Audit fields | Timestamp | |

**Composite PK**: (usr_id, lin_id)
**Relations**: N detail_line → 1 user, N detail_line → 1 line

---

### 12. `mst_kanbans` — Master Kanbans

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| 🔑 `kbn_no` | VarChar(5) | Primary key (unique kanban number) |
| 🔗 `cst_id` | Int? | FK → mst_customers.cst_id |
| 🔗 `clr_id` | Int? | FK → mst_colors.clr_id |
| 🆔 `kbn_uniq_no` | VarChar(15) | Unique number (partial index) |
| `kbn_qty_box` | Int? | Quantity per box |
| `kbn_isSpecial` | Int? | Special flag |
| `kbn_sequence_check_desc` | Text | Sequence check narrative |
| `kbn_logistic_guide_desc` | Text | Logistic guide narrative |
| `kbn_instruction_work_path` | Text | Instruction work path file |
| `kbn_sequence_check_path` | Text | Sequence check file path |
| `kbn_logistic_guide_path` | Text | Logistic guide file path |
| `kbn_sequence_check_voice_path` | Text | TTS voice file |
| `kbn_logistic_guide_voice_path` | Text | TTS voice file |
| `kbn_stamp` | VarChar(5) | Stamp identifier |
| `kbn_remark` | VarChar(55) | Remark |
| `kbn_status` | Int? | Active/inactive |
| `kbn_device_no` | VarChar(3) | Device number |
| `kbn_cert_mark` | VarChar(3) | Certificate mark |
| `kbn_oqc_barcode` | VarChar(13) | OQC barcode number |
| Audit fields | Timestamp | |

**Relations**: 1 kanban → N part numbers, 1 kanban → 1 customer, 1 kanban → 1 color, 1 kanban → N BDS, 1 kanban → N double_check, 1 kanban → N OQC

---

### 13. `detail_kanban_part_number` — Detail Kanban Part Numbers

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| 🔑 `pnu_code` | VarChar(50) | PK part 1 |
| 🔑 `kbn_no` | VarChar(5) | PK part 2, FK → mst_kanbans.kbn_no |
| 🔑 `pnu_latest_date` | Date | PK part 3 |
| `pnu_part_number` | VarChar(55) | Part number |
| `pnu_part_desc` | VarChar(55) | Part description |
| `pnu_status` | Int? | Active/inactive |
| Audit fields | Timestamp | |

**Composite PK**: (pnu_code, kbn_no, pnu_latest_date)
**Cascade Delete**: Menghapus kanban akan menghapus part numbers

---

### 14. `txn_ongoing_quality_check` — Transaction OQC

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| 🔑 `oqc_id` | Int (auto) | Primary key |
| 🔗 `kbn_no` | VarChar(5)? | FK → mst_kanbans.kbn_no |
| `oqc_lot_no` | VarChar(3) | Lot number |
| `oqc_qty_box` | Int? | Qty per box |
| `oqc_qty_plan` | Int? | Plan quantity |
| `oqc_total_label` | Int? | Total sticker labels |
| `oqc_total_A4` | Int? | Total A4 sheets |
| `oqc_status` | Int? | Status |
| Audit fields | Timestamp | |

**Relations**: N OQC → 1 kanban

---

### 15. `txn_double_check` — Transaction Double Check

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| 🔑 `doc_id` | Int (auto) | Primary key |
| 🔗 `kbn_no` | VarChar(5)? | FK → mst_kanbans.kbn_no |
| 🔗 `lin_id` | Int? | FK → mst_lines.lin_id |
| `doc_qty_total` | Int? | Total quantity checked |
| `doc_qty_ng` | Int? | NG (defect) quantity |
| `doc_qr_scan` | Text | QR scanned data |
| `doc_sequence` | Int? | Sequence number |
| Audit fields | Timestamp | |

**Relations**: N double_check → 1 kanban, N double_check → 1 line

---

### 16. `txn_barcode_delivery_scan` — Transaction BDS Header

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| 🔑 `bds_ship_date` | Date | PK part 1 |
| 🔑 `bds_ship_no` | VarChar(10) | PK part 2 |
| 🔑 `bds_so_no` | VarChar(10) | PK part 3 |
| 🔑 `bds_po_no` | VarChar(6) | PK part 4 |
| 🔑 `kbn_no` | VarChar(5) | PK part 5, FK → mst_kanbans.kbn_no |
| 🔗 `cst_code` | VarChar(4)? | FK → mst_customers.cst_code |
| `bds_qty_perbox` | Int? | Qty per box |
| `bds_box_qty` | Int? | Box quantity |
| `bds_status` | Int? | Status |
| Audit fields | Timestamp | |

**Composite PK**: (bds_ship_date, bds_ship_no, bds_so_no, bds_po_no, kbn_no)
**Relations**: N BDS → 1 customer (by code), N BDS → 1 kanban, 1 BDS header → N BDS details

---

### 17. `txn_barcode_delivery_scan_detail` — Transaction BDS Detail

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| 🔑 `bdsd_id` | Int (auto) | Primary key |
| `bds_ship_date` | Date? | FK part (to header) |
| `bds_ship_no` | VarChar(10)? | FK part (to header) |
| `bds_so_no` | VarChar(10)? | FK part (to header) |
| `bds_po_no` | VarChar(6)? | FK part (to header) |
| `kbn_no` | VarChar(5)? | FK part (to header) |
| `bds_barcode_pik` | VarChar(100) | PIK barcode |
| `bds_barcode_cst` | VarChar(100) | Customer barcode |
| `bds_barcode_oqc` | VarChar(100) | OQC barcode |
| Audit fields | Timestamp | |

**Relations**: N BDS details → 1 BDS header

---

### 18. `txn_action_logs` — Transaction Action Logs

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| 🔑 `acl_id` | Int (auto) | Primary key |
| 🔗 `mnu_id` | Int? | FK → mst_menus.mnu_id |
| `acl_action` | VarChar(10) | Action type (create/update/delete) |
| `acl_old` | Text | JSON old values |
| `acl_new` | Text | JSON new values |
| Audit fields | Timestamp | |

**Relations**: N logs → 1 menu

---

## Entity Relationship Summary

```
mst_group_menu ──1:N── mst_menus ──1:N── txn_action_logs
                             │
                            1:N
                             │
mst_roles ──1:N── detail_menu
    │
   1:N
    │
mst_users ──1:N── detail_line ──N:1── mst_lines
    │
   1:N
    │
    └── (action logs via creaby)

mst_suppliers ──1:N── mst_customers
mst_qr_formats ──1:N── mst_customers
                           │
                         1:N
                           │
mst_colors ──1:N── mst_kanbans ──1:N── detail_kanban_part_number
    │               │
    │              1:N
    │               │
    │      ┌────────┼────────┐
    │      │        │        │
    │     1:N      1:N      1:N
    │      │        │        │
    └── txn_oqc  txn_dc  txn_bds ──1:N── txn_bds_detail
                              │
                            1:N
                              │
                         mst_customers
```
