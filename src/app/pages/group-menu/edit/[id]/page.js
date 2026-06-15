"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Breadcrumb from "@/component/common/Breadcrumb";
import Button from "@/component/common/Button";
import Input from "@/component/common/Input";
import Loading from "@/component/common/Loading";
import Toast from "@/component/common/Toast";
import { createActionLog } from "@/lib/actionLog";
import fetchData from "@/lib/fetch";

export default function EditGroupMenuPage() {
  const router = useRouter();
  const params = useParams();
  const encryptedId = params?.id;

  const [form, setForm] = useState({ name: "" });
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!encryptedId) {
      router.replace("/pages/group-menu");
      return;
    }

    let isActive = true;

    fetchData(`group-menus/${encryptedId}`, {}, "GET").then((response) => {
      if (!isActive) return;

      setLoading(false);

      if (response.error) {
        Toast.error(response.message || "Group menu not found.");
        router.replace("/pages/group-menu");
        return;
      }

      setForm({ name: response.data?.Name || "" });
      setOriginalData(response.data);
    });

    return () => {
      isActive = false;
    };
  }, [encryptedId, router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    const response = await fetchData(`group-menus/${encryptedId}`, { name: form.name }, "PUT");

    if (response.error) {
      setSaving(false);
      Toast.error(response.message || "Failed to update group menu.");
      return;
    }

    const logResponse = await createActionLog({
      action: "UPDATE",
      oldValue: `Group Menu: ${originalData?.Name || ""}`,
      newValue: `Group Menu: ${form.name}`,
    });

    setSaving(false);

    if (logResponse.error) {
      Toast.error("Group menu updated successfully. Action log could not be saved.");
      return;
    }

    Toast.success("Group menu updated successfully.");
    router.push("/pages/group-menu");
  };

  return (
    <>
      <Loading loading={loading || saving} message={saving ? "Saving data..." : "Loading data..."} />
      <Breadcrumb
        title="Edit Group Menu"
        items={[
          { label: "Group Menu Management", href: "/pages/group-menu" },
          { label: "Edit" },
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
                  onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
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
