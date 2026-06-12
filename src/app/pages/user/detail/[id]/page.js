"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Breadcrumb from "@/component/common/Breadcrumb";
import Button from "@/component/common/Button";
import Loading from "@/component/common/Loading";
import Toast from "@/component/common/Toast";
import fetchData from "@/lib/fetch";
import swal from "sweetalert";
import { createActionLog } from "@/lib/actionLog";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const showGeneratedPasswordAlert = async (password) => {
  swal({
    title: "Generated Password",
    text: `Password: ${password}\n\nCatat password ini. Tombol OK akan muncul dalam 5 detik...`,
    icon: "warning",
    buttons: false,
    closeOnClickOutside: false,
    closeOnEsc: false,
  });
  await wait(5000);
  swal.close();
  await swal({ title: "Generated Password", text: `Password: ${password}`, icon: "success", button: "OK", closeOnClickOutside: false, closeOnEsc: false });
};

const Info = ({ label, value }) => (
  <div className="col-lg-4 col-md-6 mb-3">
    <div className="text-secondary" style={{ fontSize: 12 }}>{label}</div>
    <div className="fw-semibold">{value ?? "-"}</div>
  </div>
);

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const encryptedId = params?.id;
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!encryptedId) {
      router.replace("/pages/user");
      return;
    }

    fetchData(`users/${encryptedId}`, {}, "GET").then((response) => {
      setLoading(false);
      if (response.error) {
        Toast.error(response.message || "User not found");
        router.replace("/pages/user");
        return;
      }
      setUser(response.data || null);
    });
  }, [encryptedId, router]);

  const handleReset = async () => {
    const result = await swal({
      title: "Reset Password",
      text: `Reset password untuk user ${user?.Username}?`,
      icon: "warning",
      buttons: ["Batal", "Ya, reset"],
      dangerMode: true,
    });
    if (!result) return;

    setLoading(true);
    const response = await fetchData("users/reset-password", { id: user?.Id }, "POST");
    setLoading(false);

    if (response.error) {
      Toast.error(response.message || "Failed to reset password");
      return;
    }

    await createActionLog({ action: "UPDATE", oldValue: `Reset Password User: ${user?.Username}`, newValue: `Reset Password User: ${user?.Username}` });
    await showGeneratedPasswordAlert(response.data?.generatedPassword || "-");
    Toast.success(response.message || "Password reset successfully");
    router.push("/pages/user");
  };

  return (
    <>
      <Loading loading={loading} message="Loading detail..." />
      <Breadcrumb title="Detail User" items={[{ label: "User Management", href: "/pages/user" }, { label: "Detail" }]} />
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="row">
            <Info label="Full Name" value={user?.Fullname} />
            <Info label="Username" value={user?.Username} />
            <Info label="Role" value={user?.RoleName} />
            <Info label="Status" value={Number(user?.Status || 0) === 1 ? "Active" : "Inactive"} />
            <Info label="Forced Change" value={Number(user?.IsForced || 0) === 1 ? "Yes" : "No"} />
            <Info label="Locked" value={Number(user?.IsLocked || 0) === 1 ? "Yes" : "No"} />
          </div>
          <div className="d-flex justify-content-end gap-2 mt-2">
            <Button classType="secondary" iconName="arrow-left" label="Back" onClick={() => router.push("/pages/user")} />
            <Button classType="warning" iconName="arrow-clockwise" label="Reset Password" onClick={handleReset} />
          </div>
        </div>
      </div>
    </>
  );
}

