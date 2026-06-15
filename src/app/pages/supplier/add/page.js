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

export default function AddSupplierPage() {
  const router = useRouter();
  const [form, setForm] = useState({ code: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    const response = await fetchData("suppliers", { code: form.code }, "POST");

    if (response.error) {
      setSaving(false);
      Toast.error(response.message || "Failed to create supplier.");
      return;
    }

    const logResponse = await createActionLog({
      action: "CREATE",
      oldValue: null,
      newValue: `Supplier: ${response.data?.Code || form.code}`,
    });

    setSaving(false);

    if (logResponse.error) {
      Toast.error("Supplier created successfully. Action log could not be saved.");
      return;
    }

    Toast.success("Supplier created successfully.");
    router.push("/pages/supplier");
  };

  return (
    <>
      <Loading loading={saving} message="Saving data..." />
      <Breadcrumb
        title="Add Supplier"
        items={[
          { label: "Suppliers Management", href: "/pages/supplier" },
          { label: "Add" },
        ]}
      />
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-lg-4">
                <Input
                  label="Supplier Code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required
                  maxLength={3}
                />
              </div>
            </div>
            <div className="row mt-4">
              <div className="col-12">
                <div className="d-flex justify-content-end gap-2">
                  <Button classType="secondary" iconName="arrow-left" label="Back" onClick={() => router.push("/pages/supplier")} />
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
