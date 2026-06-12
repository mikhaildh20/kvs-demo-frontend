export const QR_PLACEHOLDERS = [
  { token: "{PART_NUMBER}", description: "Part number original" },
  { token: "{PART_NUMBER:LOWER}", description: "Part number jadi lowercase" },
  { token: "{PART_NUMBER:NODASH}", description: "Part number hapus '-'" },
  { token: "{PART_NUMBER:LOWER:NODASH}", description: "Lowercase + hapus '-'" },
  { token: "{SUPPLIER}", description: "Supplier original" },
  { token: "{SUPPLIER:7}", description: "Supplier padStart(7, '0')" },
  { token: "{SUPPLIER:16}", description: "Supplier padStart(16, '0')" },
  { token: "{QTY}", description: "Qty original" },
  { token: "{QTY:2}", description: "Qty padStart(2, '0')" },
  { token: "{QTY:3}", description: "Qty padStart(3, '0')" },
  { token: "{LOT_NO}", description: "Lot number" },
  { token: "{LOT_DATE}", description: "Lot date" },
  { token: "{KBN}", description: "Kanban no" },
  { token: "{SEQ}", description: "Sequence auto padStart berdasarkan qfm_seq_length" },
];

export const QR_PLACEHOLDER_GUIDE = [
  "Gunakan placeholder di dalam kurung kurawal, contoh: {SUPPLIER}-{PART_NUMBER}-{SEQ}",
  "Modifier numeric dipakai untuk padding nol di kiri, contoh: {SUPPLIER:7}, {QTY:3}",
  "SEQ akan otomatis padStart sesuai qfm_seq_length",
  "Placeholder tidak dikenal akan ditolak oleh validator",
];
