"use client";

import { createContext, useContext } from "react";
import { canAccessPage, normalizePagePath } from "@/lib/authorization";

const SessionContext = createContext(null);

export function SessionProvider({ session, children }) {
  return (
    <SessionContext.Provider value={session || null}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}

export function useAccessPaths() {
  const session = useSession();
  return session?.accessPaths || [];
}

export function useCanAccessPage() {
  const accessPaths = useAccessPaths();
  return (pathname) => canAccessPage(pathname, accessPaths);
}

export function buildActionPath(currentPath, action) {
  const normalizedPath = normalizePagePath(currentPath || "");
  if (!normalizedPath.startsWith("/pages/")) return normalizedPath;

  const segments = normalizedPath.split("/").filter(Boolean);
  const lastSegment = segments.at(-1);
  const actionSegments = new Set(["add", "edit", "detail", "print", "view"]);
  const baseSegments = actionSegments.has(lastSegment) ? segments.slice(0, -1) : segments;

  return `/${[...baseSegments, action].join("/")}`;
}
