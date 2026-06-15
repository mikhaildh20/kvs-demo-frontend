"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Breadcrumb from "@/component/common/Breadcrumb";
import Button from "@/component/common/Button";
import Input from "@/component/common/Input";
import Loading from "@/component/common/Loading";
import Paging from "@/component/common/Paging";
import Table from "@/component/common/Table";
import Toast from "@/component/common/Toast";
import { createActionLog } from "@/lib/actionLog";
import fetchData from "@/lib/fetch";

const InfoItem = ({ label, value }) => (
    <div className="col-md-3 col-sm-6 mb-3">
        <div className="text-secondary mb-1" style={{ fontSize: 12 }}>
            {label}
        </div>
        <div className="fw-semibold" style={{ fontSize: 13 }}>
            {value || "-"}
        </div>
    </div>
);

export default function DetailCustomerPage() {
    const router = useRouter();
    const params = useParams();
    const encryptedId = params?.id;

    const [customer, setCustomer] = useState(null);
    const [kanbans, setKanbans] = useState([]);
    const [selectedKanbans, setSelectedKanbans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);

    useEffect(() => {
        if (!encryptedId) {
            router.replace("/pages/customer");
            return;
        }

        let isActive = true;

        const loadData = async () => {
            setLoading(true);

            const response = await fetchData(`customers/${encryptedId}/detail`, {}, "GET");

            if (!isActive) return;

            setLoading(false);

            if (response.error) {
                Toast.error(response.message || "Customer not found");
                router.replace("/pages/customer");
                return;
            }

            const detail = response.data || {};
            setCustomer(detail.customer || null);
            setSelectedKanbans(Array.isArray(detail.assignedKanbanIds) ? detail.assignedKanbanIds : []);
            setKanbans(
                (detail.kanbans || detail.unassignedKanbans || []).map((item, index) => ({
                    No: index + 1,
                    id: item.Id,
                    "Kanban No": item.Id,
                    "Unique No": item.UniqNo || "-",
                    Color: item.ColorName || "-",
                    "Qty/Box": item.QtyBox ?? "-",
                    Special: item.Special === 1 ? "Special" : "Normal",
                    Status: item.Status === 1 ? "Active" : "Inactive",
                    Alignment: [
                        "center",
                        "center",
                        "left",
                        "left",
                        "center",
                        "center",
                        "center",
                    ],
                }))
            );
            setCurrentPage(1);
        };

        loadData();

        return () => {
            isActive = false;
        };
    }, [encryptedId, router]);

    const filteredKanbans = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return kanbans;

        return kanbans.filter((item) =>
            [
                item["Kanban No"],
                item["Unique No"],
                item.Color,
                item["Qty/Box"],
                item.Special,
                item.Status,
            ].some((value) => String(value || "").toLowerCase().includes(keyword))
        );
    }, [kanbans, search]);

    const pagedKanbans = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredKanbans.slice(start, start + pageSize).map((item, index) => ({
            ...item,
            No: start + index + 1,
        }));
    }, [currentPage, filteredKanbans, pageSize]);

    const handleSearch = (event) => {
        setSearch(event.target.value);
        setCurrentPage(1);
    };

    const handleSave = async () => {
        if (selectedKanbans.length === 0) {
            Toast.error("Select at least one kanban");
            return;
        }

        setSaving(true);

        try {
            const response = await fetchData(
                `customers/${encryptedId}/assign-kanbans`,
                { kanbanIds: selectedKanbans },
                "POST"
            );

            if (response.error) {
                throw new Error(response.message);
            }

            const logResponse = await createActionLog({
                action: "UPDATE",
                oldValue: null,
                newValue: `Customer: ${customer?.Name || "-"}, Kanban assigned: ${selectedKanbans.join(", ")}`,
            });

            if (logResponse.error) {
                throw new Error(logResponse.message || "Customer kanban saved, but action log failed");
            }

            Toast.success(response.message || "Customer kanban data saved successfully");
            router.push("/pages/customer");
        } catch (error) {
            Toast.error(error.message || "Failed to save customer kanban data");
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Loading loading={loading || saving} message={saving ? "Saving data..." : "Loading data..."} />
            <Breadcrumb
                title="Detail Customer"
                items={[
                    { label: "Customer Management", href: "/pages/customer" },
                    { label: "Detail" },
                ]}
            />
            <div className="card border-0 shadow-sm mb-3">
                <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                        <div>
                            <h5 className="mb-1" style={{ fontSize: 16 }}>
                                {customer?.Name || "-"}
                            </h5>
                            <p className="text-secondary mb-0" style={{ fontSize: 13 }}>
                                {customer?.Code || "-"}
                            </p>
                        </div>
                        <Button
                            classType="secondary"
                            iconName="arrow-left"
                            label="Back"
                            onClick={() => router.push("/pages/customer")}
                        />
                    </div>
                    <div className="row">
                        <InfoItem label="Customer Code" value={customer?.Code} />
                        <InfoItem label="Customer Name" value={customer?.Name} />
                        <InfoItem label="Status" value={customer?.Status === 1 ? "Active" : "Inactive"} />
                    </div>
                </div>
            </div>
            <div className="card border-0 shadow-sm">
                <div className="card-body p-0">
                    <div className="d-flex justify-content-between align-items-center p-3 border-bottom gap-2">
                        <div>
                            <h6 className="mb-1" style={{ fontSize: 14 }}>
                                Kanban Assignment
                            </h6>
                            <p className="text-secondary mb-0" style={{ fontSize: 13 }}>
                                Select kanbans assigned to this customer.
                            </p>
                        </div>
                        <Button
                            classType="primary"
                            iconName="save"
                            label={saving ? "Saving..." : "Save"}
                            isDisabled={saving || selectedKanbans.length === 0}
                            onClick={handleSave}
                        />
                    </div>
                    <div className="p-3 border-bottom">
                        <div style={{ maxWidth: 360 }}>
                            <Input
                                label="Search Kanban"
                                name="searchKanban"
                                type="search"
                                value={search}
                                onChange={handleSearch}
                                placeholder="Search by kanban, unique no, color, or status"
                            />
                        </div>
                    </div>
                    <Table
                        size="Small"
                        data={pagedKanbans}
                        enableCheckbox
                        initialSelectedIds={selectedKanbans}
                        onSelectionChange={setSelectedKanbans}
                    />
                    {filteredKanbans.length > 0 && (
                        <div className="p-3 border-top">
                            <Paging
                                pageSize={pageSize}
                                pageCurrent={currentPage}
                                totalData={filteredKanbans.length}
                                navigation={setCurrentPage}
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
