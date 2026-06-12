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

export default function EditSupplierPage() {
  const router = useRouter();
  const params = useParams();
  const encryptedId = params?.id;

  const [form, setForm] = useState({ code: "" });
  const [originalSupplier, setOriginalSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!encryptedId) {
      router.replace("/pages/supplier");
      return;
    }

    let isActive = true;

    fetchData(`suppliers/${encryptedId}`, {}, "GET").then((response) => {
      if (!isActive) return;

      setLoading(false);

      if (response.error) {
        Toast.error(response.message || "Supplier not found");
        router.replace("/pages/supplier");
        return;
      }

      setForm({ code: response.data?.Code || "" });
      setOriginalSupplier(response.data);
    });

    return () => {
      isActive = false;
    };
  }, [encryptedId, router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    const response = await fetchData(`suppliers/${encryptedId}`, { code: form.code }, "PUT");

    if (response.error) {
      setSaving(false);
      Toast.error(response.message || "Failed to update supplier");
      return;
    }

    const logResponse = await createActionLog({
      action: "UPDATE",
      oldValue: `Supplier: ${originalSupplier?.Code || ""}`,
      newValue: `Supplier: ${form.code}`,
    });

    setSaving(false);

    if (logResponse.error) {
      Toast.error(logResponse.message || "Supplier updated, but action log failed");
      return;
    }

    Toast.success(response.message || "Supplier updated successfully");
    router.push("/pages/supplier");
  };

  return (
    <>
      <Loading loading={loading || saving} message={saving ? "Saving data..." : "Loading data..."} />
      <Breadcrumb
        title="Edit Supplier"
        items={[
          { label: "Suppliers Management", href: "/pages/supplier" },
          { label: "Edit" },
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
                  onChange={(e) => setForm((current) => ({ ...current, code: e.target.value }))}
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
