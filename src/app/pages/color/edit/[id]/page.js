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

export default function EditColorPage() {
    const router = useRouter();
    const params = useParams();
    const encryptedId = params?.id;

    const [form, setForm] = useState({ name: "" });
    const [originalColor, setOriginalColor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!encryptedId) {
            router.replace("/pages/color");
            return;
        }

        let isActive = true;

        fetchData(`colors/${encryptedId}`, {}, "GET").then((response) => {
            if (!isActive) return;

            setLoading(false);

            if (response.error) {
                Toast.error(response.message || "Color not found");
                router.replace("/pages/color");
                return;
            }
            setForm({ name: response.data?.Name || "" });
            setOriginalColor(response.data);
        });

        return () => {
            isActive = false;
        };
    }, [encryptedId, router]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);

        const response = await fetchData(
            `colors/${encryptedId}`,
            { name: form.name },
            "PUT"
        );

        if (response.error) {
            setSaving(false);
            Toast.error(response.message || "Failed to update color");
            return;
        }

        const logResponse = await createActionLog({
            action: "UPDATE",
            oldValue: `Color: ${originalColor?.Name || ""}`,
            newValue: `Color: ${form.name}`,
        });

        setSaving(false);

        if (logResponse.error) {
            Toast.error(logResponse.message || "Color updated, but action log failed");
            return;
        }

        Toast.success(response.message || "Color updated successfully");
        router.push("/pages/color");
    };

    return (
        <>
            <Loading loading={loading || saving} message={loading ? "Loading data..." : "Saving data..."} />
            <Breadcrumb
                title="Edit Color"
                items={[
                    { label: "Colors Management", href: "/pages/color" },
                    { label: "Edit" },
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
