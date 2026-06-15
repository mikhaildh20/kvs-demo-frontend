"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/component/common/Breadcrumb";
import Loading from "@/component/common/Loading";
import Button from "@/component/common/Button";
import Input from "@/component/common/Input";
import IconPickerFa from "@/component/common/IconPickerFa";
import Toast from "@/component/common/Toast";
import { createActionLog } from "@/lib/actionLog";
import fetchData from "@/lib/fetch";

const PATH_PREFIX = "/pages/";

const normalizeMenuFolder = (value) =>
  String(value || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/^pages\//i, "");

export default function AddMenuPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", path: "", icon: "" });
  const [saving, setSaving] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      path: `${PATH_PREFIX}${normalizeMenuFolder(form.path)}`,
      icon: form.icon?.trim() || null,
    };

    const response = await fetchData("menus", payload, "POST");

    if (response.error) {
      setSaving(false);
      Toast.error(response.message || "Failed to create menu.");
      return;
    }

    const logResponse = await createActionLog({
      action: "CREATE",
      oldValue: null,
      newValue: `Menu: ${response.data?.Name || form.name}`,
    });

    setSaving(false);

    if (logResponse.error) {
      Toast.error("Menu created successfully. Action log could not be saved.");
      return;
    }

    Toast.success("Menu created successfully.");
    router.push("/pages/menu");
  };

  return (
    <>
      <Loading loading={saving} message="Saving data..." />
      <Breadcrumb
        title="Add Menu"
        items={[
          { label: "Menu Management", href: "/pages/menu" },
          { label: "Add" },
        ]}
      />
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-lg-4">
                <Input
                  label="Menu Name"
                  name="name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  maxLength={55}
                />
              </div>
              <div className="col-lg-4">
                <label
                  htmlFor="path"
                  className="form-label"
                  style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}
                >
                  Menu Path <span style={{ color: "#a32d2d" }}>*</span>
                </label>
                <div className="input-group mb-3">
                  <span
                    className="input-group-text"
                    style={{ fontSize: 13, height: 38 }}
                  >
                    {PATH_PREFIX}
                  </span>
                  <input
                    id="path"
                    name="path"
                    className="form-control rounded-end-2"
                    value={form.path}
                    onChange={(event) => updateField("path", normalizeMenuFolder(event.target.value))}
                    placeholder="folder-name"
                    required
                    maxLength={50 - PATH_PREFIX.length}
                    style={{ fontSize: 13, height: 38 }}
                  />
                </div>
              </div>
              <div className="col-lg-4">
                <IconPickerFa value={form.icon} onChange={(icon) => updateField("icon", icon)} />
              </div>
            </div>
            <div className="row mt-4">
              <div className="col-12">
                <div className="d-flex justify-content-end gap-2">
                  <Button
                    classType="secondary"
                    iconName="arrow-left"
                    label="Back"
                    onClick={() => router.push("/pages/menu")}
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
