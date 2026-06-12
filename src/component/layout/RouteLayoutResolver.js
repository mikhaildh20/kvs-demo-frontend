"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppShell from "@/component/layout/AppShell";
import fetchData from "@/lib/fetch";
import {
  clearAuthSession,
  isAuthenticated,
  subscribeAuthState,
  updateStoredUser,
} from "@/lib/auth";
import { canAccessPage } from "@/lib/authorization";

const subscribeHydration = () => () => {};

export default function RouteLayoutResolver({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname?.startsWith("/pages/auth");
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false
  );
  const authenticated = useSyncExternalStore(
    subscribeAuthState,
    isAuthenticated,
    () => false
  );
  const [sessionState, setSessionState] = useState({
    loading: true,
    data: null,
  });

  useEffect(() => {
    if (!hydrated || isAuthPage) return;

    if (!authenticated) {
      router.replace("/pages/auth/login");
      return;
    }

    let isActive = true;
    queueMicrotask(() => {
      if (isActive) {
        setSessionState((current) => ({ ...current, loading: true }));
      }
    });

    fetchData("/auth/session", {}, "GET").then((response) => {
      if (!isActive) return;

      if (response.error) {
        setSessionState({ loading: false, data: null });
        if (response.status === 401) {
          clearAuthSession();
          router.replace("/pages/auth/login");
        } else {
          router.replace("/pages/auth/unauthorized");
        }
        return;
      }

      updateStoredUser(response.data.user);
      setSessionState({ loading: false, data: response.data });
      if (Number(response.data?.user?.isForced || 0) === 1) {
        router.replace(`/pages/auth/change-password?forced=1&username=${encodeURIComponent(response.data?.user?.username || "")}`);
        return;
      }

      if (!canAccessPage(pathname, response.data.accessPaths || [])) {
        router.replace("/pages/auth/unauthorized");
      }
    });

    return () => {
      isActive = false;
    };
  }, [authenticated, hydrated, isAuthPage, pathname, router]);

  if (isAuthPage) {
    return children;
  }

  if (!hydrated || !authenticated || sessionState.loading || !sessionState.data) {
    return null;
  }

  return <AppShell session={sessionState.data}>{children}</AppShell>;
}
