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
import fetchData from "@/lib/fetch";

const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

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

export default function DetailKanbanPage() {
    const router = useRouter();
    const params = useParams();
    const encryptedId = params?.id;

    const [kanban, setKanban] = useState(null);
    const [detailRows, setDetailRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);

    useEffect(() => {
        if (!encryptedId) {
            router.replace("/pages/kanban");
            return;
        }

        let isActive = true;

        fetchData(`kanbans/${encryptedId}`, {}, "GET").then((response) => {
            if (!isActive) return;

            setLoading(false);

            if (response.error) {
                Toast.error(response.message || "Kanban not found");
                router.replace("/pages/kanban");
                return;
            }

            const data = response.data || {};
            setKanban(data);
            setDetailRows(
                (data.Details || []).map((item, index) => ({
                    No: index + 1,
                    id: `${item.Code}-${item.KanbanNo}-${new Date(item.LatestDate).getTime()}`,
                    "Part Number Code": item.Code || "-",
                    "Kanban No": item.KanbanNo || "-",
                    "Latest Date": formatDate(item.LatestDate),
                    Status: item.Status === 1 ? "Active" : "Inactive",
                    "Created By": item.CreatedBy || "-",
                    "Created Date": formatDate(item.CreatedAt),
                    "Modified By": item.ModifiedBy || "-",
                    "Modified Date": formatDate(item.ModifiedAt),
                    Alignment: [
                        "center",
                        "left",
                        "center",
                        "center",
                        "center",
                        "left",
                        "center",
                        "left",
                        "center",
                    ],
                }))
            );
            setCurrentPage(1);
        });

        return () => {
            isActive = false;
        };
    }, [encryptedId, router]);

    const filteredRows = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return detailRows;

        return detailRows.filter((item) =>
            [
                item["Part Number Code"],
                item["Kanban No"],
                item["Latest Date"],
                item.Status,
                item["Created By"],
                item["Created Date"],
                item["Modified By"],
                item["Modified Date"],
            ].some((value) => String(value || "").toLowerCase().includes(keyword))
        );
    }, [detailRows, search]);

    const pagedRows = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredRows.slice(start, start + pageSize).map((item, index) => ({
            ...item,
            No: start + index + 1,
        }));
    }, [currentPage, filteredRows, pageSize]);

    const handleSearch = (event) => {
        setSearch(event.target.value);
        setCurrentPage(1);
    };

    return (
        <>
            <Loading loading={loading} message="Loading data..." />
            <Breadcrumb
                title="Detail Kanban"
                items={[
                    { label: "Kanban Management", href: "/pages/kanban" },
                    { label: "Detail" },
                ]}
            />
            <div className="card border-0 shadow-sm mb-3">
                <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                        <div>
                            <h5 className="mb-1" style={{ fontSize: 16 }}>
                                Kanban {kanban?.Id || "-"}
                            </h5>
                            <p className="text-secondary mb-0" style={{ fontSize: 13 }}>
                                {kanban?.CustomerCode || "-"} - {kanban?.CustomerName || "-"}
                            </p>
                        </div>
                        <Button
                            classType="secondary"
                            iconName="arrow-left"
                            label="Back"
                            onClick={() => router.push("/pages/kanban")}
                        />
                    </div>
                    <div className="row">
                        <InfoItem label="Unique No" value={kanban?.UniqNo} />
                        <InfoItem label="Customer" value={`${kanban?.CustomerCode || "-"} - ${kanban?.CustomerName || "-"}`} />
                        <InfoItem label="Color" value={kanban?.ColorName} />
                        <InfoItem label="Qty / Box" value={kanban?.QtyBox} />
                        <InfoItem label="Special" value={kanban?.Special === 1 ? "Special" : "Normal"} />
                        <InfoItem label="Status" value={kanban?.Status === 1 ? "Active" : "Inactive"} />
                        <InfoItem label="Stamp" value={kanban?.Stamp} />
                        <InfoItem label="Device No" value={kanban?.DeviceNo} />
                        <InfoItem label="Cert Mark" value={kanban?.CertMark} />
                        <InfoItem label="Remark" value={kanban?.Remark} />
                    </div>
                </div>
            </div>
            <div className="card border-0 shadow-sm">
                <div className="card-body p-0">
                    <div className="p-3 border-bottom">
                        <h6 className="mb-0" style={{ fontSize: 14 }}>
                            Detail Kanban Part Number
                        </h6>
                    </div>
                    <div className="p-3 border-bottom">
                        <div style={{ maxWidth: 360 }}>
                            <Input
                                label="Search Part Number"
                                name="searchPartNumber"
                                type="search"
                                value={search}
                                onChange={handleSearch}
                                placeholder="Search part number, date, or status"
                            />
                        </div>
                    </div>
                    <Table size="Small" data={pagedRows} />
                    {filteredRows.length > 0 && (
                        <div className="p-3 border-top">
                            <Paging
                                pageSize={pageSize}
                                pageCurrent={currentPage}
                                totalData={filteredRows.length}
                                navigation={setCurrentPage}
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
