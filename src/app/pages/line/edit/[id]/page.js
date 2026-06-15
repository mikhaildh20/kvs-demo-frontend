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

export default function EditLinePage() {
  const router = useRouter();
  const params = useParams();
  const encryptedId = params?.id;

  const [form, setForm] = useState({ code: "" });
  const [originalLine, setOriginalLine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!encryptedId) {
      router.replace("/pages/line");
      return;
    }

    let isActive = true;

    fetchData(`lines/${encryptedId}`, {}, "GET").then((response) => {
      if (!isActive) return;

      setLoading(false);

      if (response.error) {
        Toast.error(response.message || "Line not found.");
        router.replace("/pages/line");
        return;
      }

      setForm({
        code: response.data?.Code || "",
      });
      setOriginalLine(response.data);
    });

    return () => {
      isActive = false;
    };
  }, [encryptedId, router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    const response = await fetchData(
      `lines/${encryptedId}`,
      {
        code: form.code,
      },
      "PUT"
    );

    if (response.error) {
      setSaving(false);
      Toast.error(response.message || "Failed to update line.");
      return;
    }

    const logResponse = await createActionLog({
      action: "UPDATE",
      oldValue: `Line: ${originalLine?.Code || "-"}`,
      newValue: `Line: ${response.data?.Code || form.code}`,
    });

    setSaving(false);

    if (logResponse.error) {
      Toast.error("Line updated successfully. Action log could not be saved.");
      return;
    }

    Toast.success("Line updated successfully.");
    router.push("/pages/line");
  };

  return (
    <>
      <Loading loading={loading || saving} message={saving ? "Saving data..." : "Loading data..."} />
      <Breadcrumb
        title="Edit Line"
        items={[
          { label: "Lines Management", href: "/pages/line" },
          { label: "Edit" },
        ]}
      />
      <div className="card border-0 shadow-sm">
        <div className="card-body">
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
