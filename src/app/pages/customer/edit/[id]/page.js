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

export default function EditCustomerPage() {
    const router = useRouter();
    const params = useParams();
    const encryptedId = params?.id;

    const [form, setForm] = useState({
        code: "",
        name: "",
    });
    const [originalCustomer, setOriginalCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!encryptedId) {
            router.replace("/pages/customer");
            return;
        }

        let isActive = true;

        fetchData(`customers/${encryptedId}`, {}, "GET").then((response) => {
            if (!isActive) return;

            setLoading(false);

            if (response.error) {
                Toast.error(response.message || "Customer not found");
                router.replace("/pages/customer");
                return;
            }

            setForm({
                code: response.data?.Code || "",
                name: response.data?.Name || "",
            });
            setOriginalCustomer(response.data);
        });

        return () => {
            isActive = false;
        };

    }, [encryptedId, router]);

    const getChangedFields = (oldData, newData) => {
        const changes = {};

        Object.keys(newData).forEach((key) => {
            if (oldData?.[key] !== newData[key]) {
                changes[key] = {
                    old: oldData?.[key] ?? null,
                    new: newData[key],
                };
            }
        });

        return changes;
    };

    const formatChangesToString = (changes) => {
        const oldValues = [];
        const newValues = [];

        Object.keys(changes).forEach((key) => {
            oldValues.push(`${key}: ${changes[key].old ?? "-"}`);
            newValues.push(`${key}: ${changes[key].new ?? "-"}`);
        });

        return {
            oldValue: oldValues.join(", "),
            newValue: newValues.join(", "),
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            // 🔹 Payload
            const payload = {
                code: form.code,
                name: form.name,
            };

            // 🔹 Update API
            const response = await fetchData(
                `customers/${encryptedId}`,
                payload,
                "PUT"
            );

            if (response.error) {
                Toast.error(response.message || "Failed to update customer");
                return;
            }

            // 🔹 Normalisasi
            const normalizedOriginal = {
                code: originalCustomer?.Code || "",
                name: originalCustomer?.Name || "",
            };

            // Capture changed fields
            const changes = getChangedFields(normalizedOriginal, payload);

            // 🔹 Convert ke string (biar sesuai struktur lama)
            if (Object.keys(changes).length > 0) {
                const { oldValue, newValue } = formatChangesToString(changes);

                createActionLog({
                    action: "UPDATE",
                    oldValue,
                    newValue,
                }).catch((err) => {
                    console.error("Action log failed:", err);
                });
            }

            Toast.success(response.message || "Customer updated successfully");
            router.push("/pages/customer");

        } catch (err) {
            console.error(err);
            Toast.error("Unexpected error occurred");
        } finally {
            setSaving(false);
        }
    };

    return(
        <>
            <Loading loading={saving} message="Saving data..." />
            <Breadcrumb
                title="Edit Customer"
                items={[
                    { label: "Customer Management", href: "/pages/customer" },
                    { label: "Edit" },
                ]}
            />
            <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-lg-4">
                                <Input
                                    label="Customer Code"
                                    value={form.code}
                                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                                    maxLength={4}
                                />
                            </div>
                            <div className="col-lg-4">
                                <Input
                                    label="Customer Name"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    maxLength={55}
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
                                    onClick={() => router.push("/pages/customer")}
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
