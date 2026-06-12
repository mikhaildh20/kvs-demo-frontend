"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/component/common/Breadcrumb";
import Button from "@/component/common/Button";
import Input from "@/component/common/Input";
import Loading from "@/component/common/Loading";
import Toast from "@/component/common/Toast";
import { createActionLog } from "@/lib/actionLog";
import fetchData from "@/lib/fetch";

export default function AddGroupMenuPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    const response = await fetchData("group-menus", { name: form.name }, "POST");

    if (response.error) {
      setSaving(false);
      Toast.error(response.message || "Failed to save group menu");
      return;
    }

    const logResponse = await createActionLog({
      action: "CREATE",
      oldValue: null,
      newValue: `Group Menu: ${response.data?.Name || form.name}`,
    });

    setSaving(false);

    if (logResponse.error) {
      Toast.error(logResponse.message || "Group menu saved, but action log failed");
      return;
    }

    Toast.success(response.message || "Group menu saved successfully");
    router.push("/pages/group-menu");
  };

  return (
    <>
      <Loading loading={saving} message="Saving data..." />
      <Breadcrumb
        title="Add Group Menu"
        items={[
          { label: "Group Menu Management", href: "/pages/group-menu" },
          { label: "Add" },
        ]}
      />
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-lg-4">
                <Input
                  label="Group Menu Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  maxLength={20}
                  required
                />
              </div>
            </div>
            <div className="row mt-4">
              <div className="col-12">
                <div className="d-flex justify-content-end gap-2">
                  <Button classType="secondary" iconName="arrow-left" label="Back" onClick={() => router.push("/pages/group-menu")} />
                  <Button type="submit" classType="primary" iconName={saving ? "" : "save"} label={saving ? "Saving..." : "Save"} isDisabled={saving} />
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
