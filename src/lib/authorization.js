const trimSlashes = (value) => value.replace(/\/+$/, "") || "/";

const stripQuery = (value = "") => value.split("?")[0].split("#")[0];

const looksLikeDynamicId = (segment = "") => {
  if (/^\d+$/.test(segment)) return true;
  if (segment.length >= 12 && /^[A-Za-z0-9_-]+$/.test(segment)) return true;
  return false;
};

export const normalizePagePath = (rawPath = "") => {
  const cleanPath = trimSlashes(stripQuery(rawPath));
  const segments = cleanPath.split("/").filter(Boolean);

  if (segments.length <= 2) {
    return cleanPath;
  }

  const lastSegment = segments.at(-1);
  const previousSegment = segments.at(-2);
  const dynamicParents = new Set(["edit", "detail", "view", "print"]);

  if (dynamicParents.has(previousSegment) && looksLikeDynamicId(lastSegment)) {
    return `/${segments.slice(0, -1).join("/")}`;
  }

  return cleanPath;
};

export const canAccessPage = (pathname, accessPaths = []) => {
  if (!pathname || pathname === "/") return true;
  if (pathname.startsWith("/pages/auth")) return true;
  if (pathname === "/pages/profile") return true;

  const normalizedPath = normalizePagePath(pathname);
  return accessPaths.includes(normalizedPath);
};
