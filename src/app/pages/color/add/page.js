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

export default function AddColorPage() {
    const router = useRouter();
    const [form, setForm] = useState({ name: "" });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);

        const response = await fetchData("colors", { name: form.name }, "POST");

        if (response.error) {
            setSaving(false);
            Toast.error(response.message || "Failed to create color.");
            return;
        }

        const logResponse = await createActionLog({
            action: "CREATE",
            oldValue: null,
            newValue: `Color: ${response.data?.Name || form.name}`,
        });

        setSaving(false);

        if (logResponse.error) {
            Toast.error("Color created successfully. Action log could not be saved.");
            return;
        }

        Toast.success("Color created successfully.");
        router.push("/pages/color");
    };

    return (
        <>
            <Loading loading={saving} message="Saving data..." />
            <Breadcrumb
                title="Add Color"
                items={[
                    { label: "Colors Management", href: "/pages/color" },
                    { label: "Add" },
                ]}
            />
            <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-lg-4">
                                <Input
                                    label="Color Name"
                                    name="name"
                                    value={form.name}
                                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                                    maxLength={55}
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
                                        onClick={() => router.push("/pages/color")}
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
