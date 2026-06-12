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

export default function AddLinePage() {
  const router = useRouter();
  const [form, setForm] = useState({ code: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    const response = await fetchData("lines", { code: form.code }, "POST");

    if (response.error) {
      setSaving(false);
      Toast.error(response.message || "Failed to save line");
      return;
    }

    const logResponse = await createActionLog({
      action: "CREATE",
      oldValue: null,
      newValue: `Line: ${response.data?.Code || form.code}`,
    });

    setSaving(false);

    if (logResponse.error) {
      Toast.error(logResponse.message || "Line saved, but action log failed");
      return;
    }

    Toast.success(response.message || "Line saved successfully");
    router.push("/pages/line");
  };

  return (
    <>
      <Loading loading={saving} message="Saving data..." />
      <Breadcrumb
        title="Add Line"
        items={[
          { label: "Lines Management", href: "/pages/line" },
          { label: "Add" },
        ]}
      />
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-lg-4">
                <Input
                  label="Line Code"
                  name="code"
                  value={form.code}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, code: event.target.value }))
                  }
                  required
                  maxLength={10}
                />
              </div>
            </div>
            <div className="row mt-4">
              <div className="col-12">
                  <div className="d-flex justify-content-end gap-2">
                    <Button
                      classType="secondary"
                      iconName="arrow-left"
                      label="Back"
                      onClick={() => router.push("/pages/line")}
                    />
                    <Button
                      type="submit"
                      classType="primary"
                      iconName={saving ? "" : "save"}
                      label={saving ? "Saving..." : "Save"}
                      isDisabled={saving}
                    />
                  </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
