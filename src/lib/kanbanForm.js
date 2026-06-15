export const getKanbanErrorMessage = (error, fallback = "Failed to save kanban") => {
  const message =
    typeof error === "string"
      ? error
      : error?.message || error?.response?.data?.message || error?.data?.message || "";

  const lower = message.toLowerCase();

  if (lower.includes("job no") && lower.includes("unique")) {
    return "Failed because Job No is already used. Leave it empty or use another number.";
  }

  if (lower.includes("kanban") && (lower.includes("required") || lower.includes("invalid"))) {
    return "Failed because Kanban No is required or no longer valid.";
  }

  if (lower.includes("network") || lower.includes("server")) {
    return "Failed because the server is not responding. Check the connection or API.";
  }

  if (lower.includes("upload") || lower.includes("file")) {
    return "Failed because the file could not be uploaded. Check the file size or format.";
  }

  if (lower.includes("voice")) {
    return "Failed because the voice could not be generated. Check the description or voice service.";
  }

  return message && message.length <= 120 ? `Failed because ${message}` : fallback;
};

export const normalizeOptionalText = (value) => {
  const normalized = String(value ?? "").trim();
  return normalized === "" ? null : normalized;
};

export default getKanbanErrorMessage;
