"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import fetchData from "@/lib/fetch";
import Button from "@/component/common/Button";
import Input from "@/component/common/Input";
import { isAuthenticated, updateStoredUser } from "@/lib/auth";

const resolveLandingPath = async () => {
  const sessionResponse = await fetchData("/auth/session", {}, "GET");
  if (!sessionResponse.error) {
    updateStoredUser(sessionResponse.data.user);
  }
  const firstMenu = sessionResponse.error ? null : sessionResponse.data?.menus?.[0];
  return firstMenu?.path || "/";
};

function ChangePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const forced = searchParams.get("forced") === "1";
  const defaultUsername = searchParams.get("username") || "";

  const [form, setForm] = useState({ username: defaultUsername, currentPassword: "", newPassword: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (defaultUsername) {
      setForm((current) => ({ ...current, username: defaultUsername }));
    }
  }, [defaultUsername]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetchData("/auth/change-password-self", form, "POST");
    setLoading(false);

    if (response.error) {
      setMessage(response.message || "Failed to change password");
      return;
    }

    if (isAuthenticated()) {
      router.replace(await resolveLandingPath());
    } else {
      router.replace("/pages/auth/login");
    }
  };

  return (
    <main className="min-vh-100 d-flex align-items-center justify-content-center px-3" style={{ background: "#f6f8fb" }}>
      <section className="bg-white border rounded-3 shadow-sm w-100" style={{ maxWidth: 460, padding: 28 }}>
        <div className="mb-4">
          <img src="/images/logoNLA.png" alt="NLA" style={{ width: 132, height: 42, objectFit: "contain", objectPosition: "left center", marginBottom: 18 }} />
          <p className="text-uppercase text-secondary fw-semibold mb-2" style={{ fontSize: 11 }}>Kanban Verification System</p>
          <h1 className="h3 fw-semibold mb-2">Change Password</h1>
          <p className="text-secondary mb-0" style={{ fontSize: 14 }}>
            {forced ? "You must change your password before accessing any features." : "Change your account password by entering your current password."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="d-flex flex-column">
          <Input label="Username" name="username" value={form.username} onChange={(event) => setForm((c) => ({ ...c, username: event.target.value }))} required />
          <Input label="Current Password" name="currentPassword" type="password" value={form.currentPassword} onChange={(event) => setForm((c) => ({ ...c, currentPassword: event.target.value }))} required />
          <Input label="New Password" name="newPassword" type="password" value={form.newPassword} onChange={(event) => setForm((c) => ({ ...c, newPassword: event.target.value }))} required />

          {message && <div className="alert alert-danger py-2 mb-3" style={{ fontSize: 13 }}>{message}</div>}

          <Button type="submit" classType="primary" iconName="key" label={loading ? "Processing..." : "Save Password"} isDisabled={loading} />
          {!forced && (
            <button
              type="button"
              onClick={() => router.push("/pages/auth/login")}
              className="btn btn-link p-0 mt-2 text-start text-secondary"
              style={{ fontSize: 12, textDecoration: "none" }}
            >
              Want to return to the login page? Click here.
            </button>
          )}
        </form>
      </section>
    </main>
  );
}


export default function ChangePasswordPage() {
  return (
    <Suspense fallback={<main className="min-vh-100 d-flex align-items-center justify-content-center px-3">Loading...</main>}>
      <ChangePasswordForm />
    </Suspense>
  );
}
