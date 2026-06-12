import fetchData from "@/lib/fetch";

export const createActionLog = ({
  action,
  oldValue = null,
  newValue = null,
  menuId,
  menuPath,
}) =>
  fetchData(
    "/action-logs",
    {
      action,
      oldValue,
      newValue,
      ...(menuId ? { menuId } : {}),
      ...(menuPath ? { menuPath } : {}),
    },
    "POST"
  );
