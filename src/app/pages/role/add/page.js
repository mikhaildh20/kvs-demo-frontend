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

export default function AddRolePage() {
    const router = useRouter();
    const [form, setForm] = useState({ name: "" });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);

        const response = await fetchData("roles", { name: form.name }, "POST");

        if (response.error) {
            setSaving(false);
            Toast.error(response.message || "Failed to create role.");
            return;
        }

        const logResponse = await createActionLog({
            action: "CREATE",
            oldValue: null,
            newValue: `Role: ${response.data?.Name || form.name}`,
        });

        setSaving(false);

        if (logResponse.error) {
            Toast.error("Role created successfully. Action log could not be saved.");
            return;
        }

        Toast.success("Role created successfully.");
        router.push("/pages/role");
    };

    return (
        <>
            <Loading loading={saving} message="Saving data..." />
            <Breadcrumb
                title="Add Role"
                items={[
                    { label: "Roles Management", href: "/pages/role" },
                    { label: "Add" },
                ]}
            />
            <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-lg-4">
                                <Input
                                    label="Role Name"
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
                                    <Button
                                    classType="secondary"
                                    iconName="arrow-left"
                                    label="Back"
                                    onClick={() => router.push("/pages/role")}
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
