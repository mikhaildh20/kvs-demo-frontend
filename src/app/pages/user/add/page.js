"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/component/common/Breadcrumb";
import Button from "@/component/common/Button";
import DropDown from "@/component/common/Dropdown";
import Input from "@/component/common/Input";
import Loading from "@/component/common/Loading";
import Toast from "@/component/common/Toast";
import fetchData from "@/lib/fetch";
import { createActionLog } from "@/lib/actionLog";
import swal from "sweetalert";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const usernamePattern = /^[A-Za-z0-9._-]+$/;

const showGeneratedPasswordAlert = async (password) => {
  swal({
    title: "Generated Password",
    text: `Password: ${password}\n\nPlease note this password. The OK button will appear in 5 seconds...`,
    icon: "warning",
    buttons: false,
    closeOnClickOutside: false,
    closeOnEsc: false,
  });
  await wait(5000);
  swal.close();
  await swal({
    title: "Generated Password",
    text: `Password: ${password}`,
    icon: "success",
    button: "OK",
    closeOnClickOutside: false,
    closeOnEsc: false,
  });
};

export default function AddUserPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullname: "", username: "", roleId: "" });
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData("users/roles", {}, "GET").then((response) => {
      setLoading(false);
      if (response.error) {
        Toast.error(response.message || "Failed to load role options.");
        return;
      }
      setRoles(response.data || []);
    });
  }, []);

  const roleOptions = roles.map((role) => ({ Value: role.Id, Text: role.Name }));

  const handleSubmit = async (event) => {
    event.preventDefault();

    const username = form.username.trim();
    if (!usernamePattern.test(username)) {
      Toast.error("Username can only contain letters, numbers, dot, dash, and underscore. Spaces are not allowed.");
      return;
    }

    setSaving(true);

    const response = await fetchData("users", { fullname: form.fullname, username, roleId: Number(form.roleId) }, "POST");
    if (response.error) {
      setSaving(false);
      Toast.error(
        String(response.message || "").toLowerCase().includes("username")
          ? "Username unavailable."
          : response.message || "Failed to create user."
      );
      return;
    }

    const generatedPassword = response.data?.generatedPassword || "-";
    await createActionLog({ action: "CREATE", oldValue: null, newValue: `User: ${response.data?.user?.Username || form.username}` });

    setSaving(false);
    await showGeneratedPasswordAlert(generatedPassword);
    Toast.success("User created successfully.");
    router.push("/pages/user");
  };

  return (
    <>
      <Loading loading={loading || saving} message={saving ? "Saving data..." : "Loading data..."} />
      <Breadcrumb title="Add User" items={[{ label: "User Management", href: "/pages/user" }, { label: "Add" }]} />
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-lg-4"><Input label="Full Name" name="fullname" value={form.fullname} onChange={(e) => setForm((c) => ({ ...c, fullname: e.target.value }))} required maxLength={55} /></div>
              <div className="col-lg-4"><Input label="Username" name="username" value={form.username} onChange={(e) => setForm((c) => ({ ...c, username: e.target.value }))} required maxLength={30} /></div>
              <div className="col-lg-4">
                <DropDown
                  arrData={roleOptions}
                  type="choose"
                  label="Role"
                  forInput="roleId"
                  value={form.roleId}
                  onChange={(e) => setForm((c) => ({ ...c, roleId: e.target.value }))}
                  isRequired
                  required
                />
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button classType="secondary" iconName="arrow-left" label="Back" onClick={() => router.push("/pages/user")} />
              <Button type="submit" classType="primary" iconName={saving ? "" : "save"} label={saving ? "Saving..." : "Save"} isDisabled={saving} />
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

