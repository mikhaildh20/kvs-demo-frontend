"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearAuthSession } from "@/lib/auth";

export default function UnauthorizedPage({ searchParams }) {
  const router = useRouter();
  const resolvedSearchParams = use(searchParams);
  const isLocked = resolvedSearchParams?.reason === "locked";

  useEffect(() => {
    if (isLocked) {
      clearAuthSession();
    }
  }, [isLocked]);

  useEffect(() => {
    if (!isLocked) return undefined;

    const audio = new Audio("/audio/alert.wav");
    audio.loop = true;
    audio.play().catch(() => {});

    const retryPlay = () => {
      audio.play().catch(() => {});
    };

    window.addEventListener("click", retryPlay);
    window.addEventListener("keydown", retryPlay);

    return () => {
      window.removeEventListener("click", retryPlay);
      window.removeEventListener("keydown", retryPlay);
      audio.pause();
      audio.currentTime = 0;
    };
  }, [isLocked]);

  return (
    <main
      className="min-vh-100 d-flex align-items-center justify-content-center px-3"
      style={{ background: "#f6f8fb" }}
    >
      <section className="bg-white border rounded-3 shadow-sm text-center" style={{ maxWidth: 460, padding: 32 }}>
        <i className="bi bi-lock-fill text-danger" style={{ fontSize: 36 }} />
        <h1 className="h4 fw-semibold mt-3">{isLocked ? "Account Locked" : "403 Forbidden"}</h1>
        <p className="text-secondary" style={{ fontSize: 14 }}>
          {isLocked
            ? "Your account has been locked. Please contact your leader to unlock your account."
            : "Your role does not have access to this page or endpoint."}
        </p>
        <button className="btn btn-primary" type="button" onClick={() => router.replace(isLocked ? "/pages/auth/login" : "/")}>
          {isLocked ? "Back to Login" : "Back"}
        </button>
      </section>
    </main>
  );
}
