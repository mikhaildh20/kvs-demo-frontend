export const QR_PLACEHOLDERS = [
  { token: "{PART_NUMBER}", description: "Original part number" },
  { token: "{PART_NUMBER:LOWER}", description: "Part number converted to lowercase" },
  { token: "{PART_NUMBER:NODASH}", description: "Part number without '-'" },
  { token: "{PART_NUMBER:LOWER:NODASH}", description: "Lowercase + remove '-'" },
  { token: "{SUPPLIER}", description: "Original supplier" },
  { token: "{SUPPLIER:7}", description: "Supplier padStart(7, '0')" },
  { token: "{SUPPLIER:16}", description: "Supplier padStart(16, '0')" },
  { token: "{QTY}", description: "Original qty" },
  { token: "{QTY:2}", description: "Qty padStart(2, '0')" },
  { token: "{QTY:3}", description: "Qty padStart(3, '0')" },
  { token: "{LOT_NO}", description: "Lot number" },
  { token: "{LOT_DATE}", description: "Lot date" },
  { token: "{KBN}", description: "Kanban no" },
  { token: "{SEQ}", description: "Auto sequence using qfm_seq_length padding" },
];

export const QR_PLACEHOLDER_GUIDE = [
  "Use placeholders inside curly braces, for example: {SUPPLIER}-{PART_NUMBER}-{SEQ}",
  "Numeric modifiers add left zero padding, for example: {SUPPLIER:7}, {QTY:3}",
  "SEQ is automatically padded using qfm_seq_length",
  "Unknown placeholders are rejected by the validator",
];
