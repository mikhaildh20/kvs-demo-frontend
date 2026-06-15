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

export const normalizeOptionalText = (value) => {
  const normalized = String(value ?? "").trim();
  return normalized === "" ? null : normalized;
};

export default getKanbanErrorMessage;
