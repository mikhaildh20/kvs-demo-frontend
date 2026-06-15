"use client";

import { useEffect, useState } from "react";
import Breadcrumb from "@/component/common/Breadcrumb";
import Button from "@/component/common/Button";
import Input from "@/component/common/Input";
import Loading from "@/component/common/Loading";
import Toast from "@/component/common/Toast";
import fetchData from "@/lib/fetch";
import { FaUserCircle } from "react-icons/fa";

const Info = ({ label, value }) => (
  <div className="col-lg-4 col-md-6 mb-3">
    <div className="text-secondary" style={{ fontSize: 12 }}>{label}</div>
    <div className="fw-semibold">{value ?? "-"}</div>
  </div>
);

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });

  useEffect(() => {
    fetchData("/auth/session", {}, "GET").then((response) => {
      setLoading(false);
      if (response.error) {
        Toast.error(response.message || "Failed to load profile.");
        return;
      }
      setUser(response.data?.user || null);
    });
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    const response = await fetchData("/auth/change-password-self", {
      username: user?.username || "",
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    }, "POST");

    setSaving(false);

    if (response.error) {
      Toast.error(response.message || "Failed to change password.");
      return;
    }

    setForm({ currentPassword: "", newPassword: "" });
    Toast.success("Password changed successfully.");
  };

  return (
    <>
      <Loading loading={loading || saving} message={saving ? "Saving password..." : "Loading profile..."} />
      <Breadcrumb title="My Profile" items={[]} />

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body p-3">
          <div className="d-flex align-items-start gap-3">
            <div
              className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
              style={{
                width: 38,
                height: 38,
                background: "#eef5ff",
                color: "#185fa5",
              }}
            >
              <FaUserCircle size={16} />
            </div>
            <div>
              <h6 className="mb-1" style={{ fontSize: 14 }}>
                Profile Overview
              </h6>
              <p
                className="text-secondary mb-0"
                style={{ fontSize: 13, lineHeight: 1.6 }}
              >
                Review your signed-in account identity, username, and assigned
                role for the Kanban Verification System. You can also update
                your own password here to keep your account access secure.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body p-4">
          <div className="row">
            <Info label="Full Name" value={user?.fullname} />
            <Info label="Username" value={user?.username} />
            <Info label="Role" value={user?.role_name} />
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <h6 className="mb-3" style={{ fontSize: 14 }}>Change Password</h6>
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-lg-4">
                <Input label="Current Password" type="password" value={form.currentPassword} onChange={(e) => setForm((c) => ({ ...c, currentPassword: e.target.value }))} required />
              </div>
              <div className="col-lg-4">
                <Input label="New Password" type="password" value={form.newPassword} onChange={(e) => setForm((c) => ({ ...c, newPassword: e.target.value }))} required />
              </div>
            </div>
            <div className="d-flex justify-content-end mt-3">
              <Button type="submit" classType="primary" iconName="key" label={saving ? "Saving..." : "Save Password"} isDisabled={saving} />
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
