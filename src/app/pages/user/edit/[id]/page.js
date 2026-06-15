"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Breadcrumb from "@/component/common/Breadcrumb";
import Button from "@/component/common/Button";
import DropDown from "@/component/common/Dropdown";
import Input from "@/component/common/Input";
import Loading from "@/component/common/Loading";
import Toast from "@/component/common/Toast";
import fetchData from "@/lib/fetch";
import { createActionLog } from "@/lib/actionLog";

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const encryptedId = params?.id;

  const [form, setForm] = useState({ fullname: "", username: "", roleId: "" });
  const [roles, setRoles] = useState([]);
  const [original, setOriginal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const roleOptions = roles.map((role) => ({ Value: role.Id, Text: role.Name }));

  useEffect(() => {
    if (!encryptedId) {
      router.replace("/pages/user");
      return;
    }

    Promise.all([
      fetchData("users/roles", {}, "GET"),
      fetchData(`users/${encryptedId}`, {}, "GET"),
    ]).then(([roleResp, userResp]) => {
      setLoading(false);
      if (roleResp.error) {
        Toast.error(roleResp.message || "Failed to load role options.");
        return;
      }
      if (userResp.error) {
        Toast.error(userResp.message || "User not found.");
        router.replace("/pages/user");
        return;
      }

      setRoles(roleResp.data || []);
      setOriginal(userResp.data);
      setForm({
        fullname: userResp.data?.Fullname || "",
        username: userResp.data?.Username || "",
        roleId: String(userResp.data?.RoleId || ""),
      });
    });
  }, [encryptedId, router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    const response = await fetchData(`users/${encryptedId}`, { roleId: Number(form.roleId) }, "PUT");
    if (response.error) {
      setSaving(false);
      Toast.error(
        String(response.message || "").toLowerCase().includes("username")
          ? "Username unavailable."
          : response.message || "Failed to update user."
      );
      return;
    }

    await createActionLog({
      action: "UPDATE",
      oldValue: `User: ${original?.Username || ""}`,
      newValue: `User: ${original?.Username || ""}, Role ID: ${form.roleId}`,
    });

    setSaving(false);
    Toast.success("User updated successfully.");
    router.push("/pages/user");
  };

  return (
    <>
      <Loading loading={loading || saving} message={saving ? "Saving data..." : "Loading data..."} />
      <Breadcrumb title="Edit User" items={[{ label: "User Management", href: "/pages/user" }, { label: "Edit" }]} />
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-lg-4">
                <Input
                  label="Full Name"
                  name="fullname"
                  value={form.fullname}
                  onChange={(e) => setForm((c) => ({ ...c, fullname: e.target.value }))}
                  required
                  maxLength={55}
                  disabled
                  helperText="Full name cannot be changed."
                />
              </div>
              <div className="col-lg-4">
                <Input
                  label="Username"
                  name="username"
                  value={form.username}
                  onChange={(e) => setForm((c) => ({ ...c, username: e.target.value }))}
                  required
                  maxLength={30}
                  disabled
                  helperText="Username is unique and cannot be changed."
                />
              </div>
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
