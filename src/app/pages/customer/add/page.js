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

export default function AddCustomerPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        code: "", 
        name: "" ,
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        const response = await fetchData("customers",form,"POST");

        if (response.error) {
            setSaving(false);
            Toast.error(response.message || "Failed to create customer.");
            return;
        }

        const logResponse = await createActionLog({
            action: "CREATE",
            oldValue: null,
            newValue: `Customer: ${response.data?.Name || form.name}`,
        });

        setSaving(false);

        if (logResponse.error) {
            Toast.error("Customer created successfully. Action log could not be saved.");
            return;
        }

        Toast.success("Customer created successfully.");
        router.push("/pages/customer");
    }

    return (
        <>
            <Loading loading={saving} message="Saving data..." />
            <Breadcrumb
                title="Add Customer"
                items={[
                    { label: "Customer Management", href: "/pages/customer" },
                    { label: "Add" },
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
    )
}
