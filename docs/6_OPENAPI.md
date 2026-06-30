# OpenAPI — API Specification

## Kanban Verification System (KVS)

---

Base URL: `https://kvs-demo-api.karsa-dev.my.id/api/v1`

Auth: JWT token via `Cookie` header (httpOnly, sameSite: strict, secure)

---

## 1. Authentication

### POST /api/v1/auth/login
- **Description**: User login
- **Request Body**:
  ```json
  { "username": "string", "password": "string" }
  ```
- **Response 200**:
  ```json
  { "success": true, "message": "Login successful", "data": { "user_id": "int", "username": "string", "fullname": "string", "role": "string", "menus": [...] } }
  ```
- **Response 401**: `Invalid credentials`
- **Response 403**: `Account locked` / `Forced password change`

### PUT /api/v1/auth/change-password
- **Description**: Change current user's password
- **Request Body**:
  ```json
  { "oldPassword": "string", "newPassword": "string" }
  ```
- **Response 200**: `Password changed successfully`

### POST /api/v1/auth/logout
- **Description**: Clear auth cookie
- **Response 200**: `Logged out`

---

## 2. User Management

### GET /api/v1/user
- **Description**: List/search users
- **Query Params**: `page`, `limit`, `search`, `status`
- **Response 200**:
  ```json
  { "success": true, "data": [...], "pagination": { "page": 1, "limit": 10, "total": 100 } }
  ```

### POST /api/v1/user
- **Description**: Create new user
- **Request Body**:
  ```json
  { "fullname": "string", "username": "string", "password": "string", "rol_id": "int", "lines": ["int", ...] }
  ```
- **Response 201**: `User created successfully`

### GET /api/v1/user/:id
- **Description**: Get user detail
- **Response 200**: User object with role and line assignments

### PUT /api/v1/user/:id
- **Description**: Update user
- **Request Body**:
  ```json
  { "fullname": "string", "username": "string", "rol_id": "int", "usr_status": "int", "usr_isLocked": "int", "lines": ["int", ...] }
  ```

### DELETE /api/v1/user/:id
- **Description**: Soft-delete (set status inactive)

---

## 3. Role Management

### GET /api/v1/role
- **Description**: List all roles

### POST /api/v1/role
- **Description**: Create role
- **Request Body**:
  ```json
  { "rol_name": "string" }
  ```

### GET /api/v1/role/:id
- **Description**: Role detail with assigned menus

### PUT /api/v1/role/:id
- **Description**: Update role
- **Request Body**:
  ```json
  { "rol_name": "string", "rol_status": "int", "menus": ["mnu_id", ...] }
  ```

---

## 4. Menu Management

### GET /api/v1/menu
- **Description**: List menus with group menu info

### POST /api/v1/menu
- **Description**: Create menu
- **Request Body**:
  ```json
  { "mnu_name": "string", "mnu_path": "string", "mnu_icon": "string", "grm_id": "int" }
  ```

### PUT /api/v1/menu/:id
- **Description**: Update menu

---

## 5. Group Menu Management

### GET /api/v1/group-menu
- **Description**: List group menus

### POST /api/v1/group-menu
- **Description**: Create group menu
- **Request Body**:
  ```json
  { "grm_name": "string" }
  ```

### GET /api/v1/group-menu/:id
- **Description**: Group menu detail with menus

### PUT /api/v1/group-menu/:id
- **Description**: Update group menu

---

## 6. Color Management

### GET /api/v1/color
### POST /api/v1/color
### PUT /api/v1/color/:id

---

## 7. Customer Management

### GET /api/v1/customer
### POST /api/v1/customer
  ```json
  { "cst_code": "string", "cst_name": "string", "spl_id": "int?", "qfm_id": "int?" }
  ```
### GET /api/v1/customer/:id
### PUT /api/v1/customer/:id

---

## 8. Supplier Management

### GET /api/v1/supplier
### POST /api/v1/supplier
### GET /api/v1/supplier/:id
### PUT /api/v1/supplier/:id

---

## 9. Line Management

### GET /api/v1/line
### POST /api/v1/line
  ```json
  { "lin_code": "string", "users": ["usr_id", ...] }
  ```
### GET /api/v1/line/:id
### PUT /api/v1/line/:id

---

## 10. QR Format Management

### GET /api/v1/qr-format
### POST /api/v1/qr-format
  ```json
  { "qfm_name": "string", "qfm_pattern": "string", "qfm_seq_length": "int?" }
  ```
### GET /api/v1/qr-format/:id
### PUT /api/v1/qr-format/:id

---

## 11. Kanban Management

### GET /api/v1/kanban
- **Description**: List/search kanbans with paging
- **Query Params**: `page`, `limit`, `search`, `cst_id`, `clr_id`, `status`

### POST /api/v1/kanban
- **Description**: Create kanban with part numbers
- **Request Body**:
  ```json
  {
    "kbn_no": "string", "cst_id": "int?", "clr_id": "int?",
    "kbn_qty_box": "int?", "kbn_isSpecial": "int?",
    "kbn_sequence_check_desc": "string (max 2000)",
    "kbn_logistic_guide_desc": "string (max 2000)",
    "part_numbers": [{ "pnu_code": "string", "pnu_part_number": "string?", "pnu_part_desc": "string?" }]
  }
  ```

### GET /api/v1/kanban/:id
- **Description**: Kanban detail with part numbers

### PUT /api/v1/kanban/:id
- **Description**: Update kanban

### POST /api/v1/kanban/import
- **Description**: Import kanban from Excel
- **Request**: `multipart/form-data` — field: `file` (.xlsx)
- **Response 200**:
  ```json
  { "success": true, "message": "Import completed", "data": { "inserted": 10, "updated": 3, "unchanged": 0, "invalid": 1, "noChanges": false } }
  ```
- **Idempotent**: Re-import identical file → `noChanges: true`

---

## 12. OQC (Ongoing Quality Check)

### GET /api/v1/oqc
### POST /api/v1/oqc
  ```json
  { "kbn_no": "string", "oqc_lot_no": "string", "oqc_qty_box": "int", "oqc_qty_plan": "int" }
  ```
### GET /api/v1/oqc/:id

### POST /api/v1/oqc/:id/print
- **Description**: Generate/print OQC labels

---

## 13. Double Check

### GET /api/v1/double-check
### POST /api/v1/double-check
  ```json
  { "kbn_no": "string", "lin_id": "int", "doc_qty_total": "int", "doc_qty_ng": "int", "doc_qr_scan": "string" }
  ```
### GET /api/v1/double-check-report

---

## 14. Barcode Delivery Scan

### GET /api/v1/barcode-delivery-scan
### POST /api/v1/barcode-delivery-scan/import
- **Description**: Import BDS from Excel
- **Request**: `multipart/form-data` — field: `file` (.xlsx)
- **Required columns**: `Ship Date`, `Ship No`, `S/O No`, `P/O No`, `Draw No`, `CUS Cd`, `Qty Per Box`, `Box Qty`
- **Response 200**:
  ```json
  { "success": true, "data": { "inserted": 5, "updated": 2, "unchanged": 8, "noChanges": false } }
  ```
- **Idempotent**: Re-import → `noChanges: true` saat tidak ada perubahan

### GET /api/v1/barcode-delivery-scan-report
### GET /api/v1/barcode-delivery-scan-report/:id

---

## 15. Action Logs

### GET /api/v1/log
- **Description**: List action logs with paging
- **Query Params**: `page`, `limit`

### GET /api/v1/log/:id
- **Description**: Log detail (old/new values)

---

## 16. Upload

### POST /api/v1/upload
- **Description**: Upload file
- **Request**: `multipart/form-data` — field: `file`
- **Restrictions**: Max 10MB, .xlsx only for Excel uploads
- **Response 200**:
  ```json
  { "success": true, "url": "/uploads/filename.ext" }
  ```

### GET /api/v1/upload/:filename
- **Description**: Access uploaded file (also available via Nginx `/uploads/`)

---

## 17. Matrix

### GET /api/v1/matrix

---

## 18. Voice

### POST /api/v1/voice
- **Description**: Generate TTS audio for kanban descriptions
- **Request Body**:
  ```json
  { "text": "string", "type": "sequence_check" | "logistic_guide" }
  ```
- **Notes**: Long text handled via backend chunking

---

## Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "error": "Technical detail (production: hidden)"
}
```

## Common HTTP Status Codes

| Code | Keterangan |
|------|------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (no token) |
| 403 | Forbidden (role/menu access denied) |
| 404 | Not Found |
| 413 | Payload Too Large (upload > 10MB) |
| 429 | Too Many Requests (rate limit) |
| 500 | Internal Server Error |
