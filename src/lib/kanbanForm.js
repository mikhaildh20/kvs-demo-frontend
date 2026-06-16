export const getKanbanErrorMessage = (error, fallback = "Failed to create kanban.") => {
  const message =
    typeof error === "string"
      ? error
      : error?.message || error?.response?.data?.message || error?.data?.message || "";

  const lower = message.toLowerCase();

  if (lower.includes("job no") && lower.includes("unique")) {
    return "Job No is already used. Leave it empty or use another number.";
  }

  if (lower.includes("kanban") && (lower.includes("required") || lower.includes("invalid"))) {
    return "Kanban No is required or no longer valid.";
  }

  if (lower.includes("network") || lower.includes("server")) {
    return "The server is not responding. Check the connection or API.";
  }

  if (lower.includes("upload") || lower.includes("file")) {
    return "The file could not be uploaded. Check the file size or format.";
  }

  if (lower.includes("voice")) {
    return "The voice could not be generated. Check the description or voice service.";
  }

  return message && message.length <= 120 ? message : fallback;
};

export const getKanbanImportErrorMessage = (error) => {
  const message =
    typeof error === "string"
      ? error
      : error?.message || error?.response?.data?.message || error?.data?.message || "";

  const lower = message.toLowerCase();

  if (!message) {
    return "Failed to import kanban data. Check the Excel files and try again.";
  }

  if (lower.includes("excel a") && lower.includes("excel b") && lower.includes("required")) {
    return "Select Excel file A and Excel file B first.";
  }

  if (lower.includes("unsupported file type")) {
    return "Only Excel .xlsx files are allowed for kanban import.";
  }

  if (lower.includes("file") && (lower.includes("size") || lower.includes("limit") || lower.includes("maksimal"))) {
    return "The Excel file is too large. Maximum file size is 25 MB.";
  }

  if (lower.includes("missing required column")) {
    return message;
  }

  if (lower.includes("no matching data") || lower.includes("tidak ada data")) {
    return "No matching data was found between Excel A and Excel B. Check the item codes in both files.";
  }

  if (lower.includes("invalid file") || lower.includes("excel") || lower.includes("worksheet") || lower.includes("zip") || lower.includes("end of central directory")) {
    return "The Excel file could not be read. Make sure you upload a valid .xlsx template.";
  }

  if (
    lower.includes("prisma") ||
    lower.includes("stack") ||
    lower.includes("trace") ||
    lower.includes("constraint") ||
    lower.includes("null") ||
    lower.includes("undefined") ||
    message.length > 140
  ) {
    return "Failed to import kanban data. Check the Excel content and try again.";
  }

  return message;
};

export const normalizeOptionalText = (value) => {
  const normalized = String(value ?? "").trim();
  return normalized === "" ? null : normalized;
};

export default getKanbanErrorMessage;
