# WIREFRAME — Layout Specifications

## Kanban Verification System (KVS)

---

## 1. General Layout (All Authenticated Pages)

```
┌──────────────────────────────────────────────────────┐
│  Top Bar (Logo: NLA)          [User] [Logout] [⚙]   │
├────────────┬─────────────────────────────────────────┤
│            │  Breadcrumb: Home > Module > Action      │
│  Sidebar   ├─────────────────────────────────────────┤
│            │                                         │
│  ┌───────┐ │          Content Area                   │
│  │Master │ │                                         │
│  │ Data  │ │  ┌─────────────────────────────────┐    │
│  ├───────┤ │  │  Search Bar    [Search] [Reset]  │    │
│  │Kanban │ │  ├─────────────────────────────────┤    │
│  ├───────┤ │  │  Action: [+ Add]  [Import xlsx] │    │
│  │ OQC   │ │  ├─────────────────────────────────┤    │
│  ├───────┤ │  │                                 │    │
│  │Double │ │  │         Data Table              │    │
│  │Check  │ │  │  ┌───┬───┬───┬───┬───┬───┐     │    │
│  ├───────┤ │  │  │No │ ..│ ..│ ..│ ..│ ⋮ │     │    │
│  │BDS    │ │  │  ├───┼───┼───┼───┼───┼───┤     │    │
│  ├───────┤ │  │  │1  │   │   │   │   │ 🔍│     │    │
│  │Report │ │  │  │2  │   │   │   │   │ 🔍│     │    │
│  └───────┘ │  │  └───┴───┴───┴───┴───┴───┘     │    │
│            │  ├─────────────────────────────────┤    │
│            │  │  Page 1  2  3  ...  Next  >>    │    │
│            │  └─────────────────────────────────┘    │
│            └─────────────────────────────────────────┘
└──────────────────────────────────────────────────────┘
```

### Sidebar Menu (contoh)
```
▼ Master Data
  - User
  - Role
  - Menu
  - Group Menu
  - Color
  - Customer
  - Supplier
  - Line
  - Matrix
  - QR Format
▼ Kanban
  - Kanban List
▼ OQC
  - OQC List
▼ Production
  - Double Check
  - Double Check Report
▼ Delivery
  - BDS Import
  - BDS Scan
  - BDS Report
▼ System
  - Action Log
  - Profile
```

---

## 2. Login Page

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              ┌────────────────────────┐              │
│              │     [NLA LOGO]         │              │
│              │                        │              │
│              │  Kanban Verification   │              │
│              │      System            │              │
│              │                        │              │
│              │  ┌──────────────────┐  │              │
│              │  │ Username         │  │              │
│              │  └──────────────────┘  │              │
│              │  ┌──────────────────┐  │              │
│              │  │ Password    [👁] │  │              │
│              │  └──────────────────┘  │              │
│              │                        │              │
│              │  [      LOGIN       ]  │              │
│              │                        │              │
│              └────────────────────────┘              │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 3. Add/Edit Form (Modul CRUD)

```
┌──────────────────────────────────────────────────────┐
│  Breadcrumb: Home > Module > Add / Edit              │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Form Title: Add New [Module]                        │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Field 1 *                                       │ │
│  │ ┌─────────────────────────────────────────────┐ │ │
│  │ │ input                                       │ │ │
│  │ └─────────────────────────────────────────────┘ │ │
│  │                                                 │ │
│  │ Field 2 *                                       │ │
│  │ ┌─────────────────────────────────────────────┐ │ │
│  │ │ dropdown select                             │ │ │
│  │ └─────────────────────────────────────────────┘ │ │
│  │                                                 │ │
│  │ Description (textarea 2000 char)                │ │
│  │ ┌─────────────────────────────────────────────┐ │ │
│  │ │                                             │ │ │
│  │ │  textarea                                   │ │ │
│  │ │                                             │ │ │
│  │ └─────────────────────────────────────────────┘ │ │
│  │                                                 │ │
│  │ File Upload                                     │ │
│  │ [Choose File]  filename.pdf                     │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  [  Save  ]  [  Cancel  ]                           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 4. Detail Page

```
┌──────────────────────────────────────────────────────┐
│  Breadcrumb: Home > Module > Detail                  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Detail [Module Name]                                │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Label 1        │ Value 1                        │ │
│  │ Label 2        │ Value 2                        │ │
│  │ Label 3        │ Value 3                        │ │
│  │ Status         │ Active ✅                      │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  ── Related Data ──                                  │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Sub-table (part numbers, users, menus, dll)   │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  [  Edit  ]  [  Back  ]                             │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 5. Kanban Detail (Special)

```
┌──────────────────────────────────────────────────────┐
│  Breadcrumb: Home > Kanban > Detail                  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Kanban KBN-00001                                   │
│                                                      │
│  ┌──────────────┐  ┌──────────────────────────────┐ │
│  │ General Info │  │ Descriptions                  │ │
│  │──────────────│  │                              │ │
│  │ Kanban No    │  │ Sequence Check:              │ │
│  │ Customer     │  │ [Textarea / link to doc]     │ │
│  │ Color        │  │                              │ │
│  │ Qty Box      │  │ Logistic Guide:              │ │
│  │ Status       │  │ [Textarea / link to doc]     │ │
│  └──────────────┘  └──────────────────────────────┘ │
│                                                      │
│  ── Part Numbers ──                                  │
│  ┌──────┬──────────┬──────────────┬──────────────┐  │
│  │ Code │ Part No  │ Description  │ Latest Date  │  │
│  ├──────┼──────────┼──────────────┼──────────────┤  │
│  │ PN01 │ ABC-1234 │ Description  │ 2026-01-15   │  │
│  └──────┴──────────┴──────────────┴──────────────┘  │
│                                                      │
│  ── Documents ──                                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐       │
│  │ Instruction │ │ Sequence  │ │ Logistic   │       │
│  │ Work (PDF)  │ │ Check     │ │ Guide      │       │
│  │ [Preview]   │ │ [Preview] │ │ [Preview]  │       │
│  └────────────┘ └────────────┘ └────────────┘       │
│                                                      │
│  [  Edit  ]  [  Back  ]                             │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 6. OQC Label Canvas (Add OQC)

```
┌──────────────────────────────────────────────────────┐
│  Breadcrumb: Home > OQC > Add OQC                   │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Add OQC                                             │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Select Kanban *                                 │ │
│  │ [Dropdown: search kanban...]                    │ │
│  │                                                 │ │
│  │ Lot No *        │ Qty Box *                     │ │
│  │ [input]         │ [input]                       │ │
│  │                                                 │ │
│  │ Plan Qty *      │                               │ │
│  │ [input]         │                               │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  ── Generated Labels (Canvas) ──                     │
│  ┌─────────────────────────────────────────────────┐ │
│  │                                                 │ │
│  │   ┌─────────────┐ ┌─────────────┐              │ │
│  │   │ [QR CODE]   │ │ [QR CODE]   │              │ │
│  │   │ KBN-00001   │ │ KBN-00001   │              │ │
│  │   │ LOT: 001    │ │ LOT: 002    │              │ │
│  │   └─────────────┘ └─────────────┘              │ │
│  │                                                 │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  [ Print A4 ]  [ Print Stickers ]  [  Back  ]       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 7. Import Excel Modal

```
┌──────────────────────────────────────┐
│  Import [Module]             [X]     │
├──────────────────────────────────────┤
│                                      │
│  Upload Excel File (.xlsx)           │
│                                      │
│  ┌──────────────────────────────┐    │
│  │                              │    │
│  │   📁 Drop file here or      │    │
│  │      [Browse Files]          │    │
│  │                              │    │
│  └──────────────────────────────┘    │
│                                      │
│  Required columns:                   │
│  • Col A, Col B, Col C, ...        │
│                                      │
│  [  Import  ]  [  Cancel  ]         │
│                                      │
└──────────────────────────────────────┘
```

---

## 8. Import Result Toast

```
Success Toast:
┌──────────────────────────────────┐
│  ✅ Import completed             │
│  Inserted: 10 | Updated: 3      │
│  Unchanged: 5 | Invalid: 0      │
└──────────────────────────────────┘

No-Change Toast (re-import identical):
┌──────────────────────────────────┐
│  ℹ️ Import completed             │
│  No changes — file is identical  │
└──────────────────────────────────┘
```

---

## 9. Common UI Patterns

### Search Bar
```
┌──────────────────────────────────────┐
│ 🔍 [Search input...]  [Search] [X]  │
└──────────────────────────────────────┘
```

### Toast Messages
- Success: `✅ [Action] completed successfully`
- Error: `❌ [Action] failed: [reason]`
- English only, never raw backend messages

### Action Buttons (RBAC-aware)
- `[+ Add]` — shown only if role has `/{module}/add` path
- `[🔍 Detail]` — per row, shown only if role has `/{module}/detail`
- `[✏️ Edit]` — per row, shown only if role has `/{module}/edit`
- `[🖨️ Print]` — shown only if role has `/{module}/print`
