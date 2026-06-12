"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import fetchData from "@/lib/fetch";
import { isAuthenticated, saveAuthSession, updateStoredUser } from "@/lib/auth";
import Button from "@/component/common/Button";
import Input from "@/component/common/Input";

const resolveLandingPath = async () => {
  const sessionResponse = await fetchData("/auth/session", {}, "GET");
  if (!sessionResponse.error) {
    updateStoredUser(sessionResponse.data.user);
  }

  return "/";
};

const clearSidebarGroupState = () => {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem("wms:sidebar-open-groups");
  }
};

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  useEffect(() => {
    let isActive = true;

    if (isAuthenticated()) {
      resolveLandingPath().then((path) => {
        if (isActive) router.replace(path);
      });
    }

    return () => {
      isActive = false;
    };
  }, [router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetchData("/auth/login", form, "POST");
    setLoading(false);

    if (response.error) {
      setMessage(response.message || "Login failed");
      return;
    }

    saveAuthSession(response.data);
    clearSidebarGroupState();
    if (Number(response.data?.user?.isForced || 0) === 1) {
      router.replace(`/pages/auth/change-password?forced=1&username=${encodeURIComponent(response.data?.user?.username || form.username)}`);
      return;
    }
    router.replace(await resolveLandingPath());
  };

  return (
    <main
      className="min-vh-100 d-flex align-items-center justify-content-center px-3"
      style={{ background: "#f6f8fb" }}
    >
      <section
        className="bg-white border rounded-3 shadow-sm w-100"
        style={{ maxWidth: 420, padding: 28 }}
      >
        <div className="mb-4">
          <img
            src="/images/logoKoito.png"
            alt="Koito"
            style={{
              width: 132,
              height: 42,
              objectFit: "contain",
              objectPosition: "left center",
              marginBottom: 18,
            }}
          />
          <p className="text-uppercase text-secondary fw-semibold mb-2" style={{ fontSize: 11 }}>
            Kanban Verification System
          </p>
        <h1 className="h3 fw-semibold mb-2">Sign In</h1>
        <p className="text-secondary mb-0" style={{ fontSize: 14 }}>
          Please sign in with your registered account to access the system.
        </p>
        </div>

        <form onSubmit={handleSubmit} className="d-flex flex-column">
          <Input
            label="Username"
            name="username"
            value={form.username}
            onChange={(event) => updateField("username", event.target.value)}
            autoComplete="username"
            required
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={(event) => updateField("password", event.target.value)}
            autoComplete="current-password"
            required
          />

          {message && (
            <div className="alert alert-danger py-2 mb-3" style={{ fontSize: 13 }}>
              {message}
            </div>
          )}

          <Button
            type="submit"
            classType="primary"
            iconName="shield-lock"
            label={loading ? "Signing in..." : "Sign In"}
            isDisabled={loading}
          />
          <button
            type="button"
            onClick={() => router.push("/pages/auth/change-password")}
            className="btn btn-link p-0 mt-2 text-start text-secondary"
            style={{ fontSize: 12, textDecoration: "none" }}
          >
            Want to change your password? Click here.
          </button>
        </form>
      </section>
    </main>
  );
}
