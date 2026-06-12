"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import * as FaIcons from "react-icons/fa";
import Breadcrumb from "@/component/common/Breadcrumb";
import Button from "@/component/common/Button";
import Input from "@/component/common/Input";
import Loading from "@/component/common/Loading";
import Paging from "@/component/common/Paging";
import Table from "@/component/common/Table";
import Toast from "@/component/common/Toast";
import { createActionLog } from "@/lib/actionLog";
import fetchData from "@/lib/fetch";

const getMenuGroupPath = (path) => {
    const cleanPath = String(path || "").trim();
    if (!cleanPath.startsWith("/pages/")) return cleanPath || "-";

    const parts = cleanPath.split("/").filter(Boolean);
    if (parts.length < 2) return cleanPath;

    return `/${parts[0]}/${parts[1]}`;
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

export default function DetailRolePage() {
    const router = useRouter();
    const params = useParams();
    const encryptedId = params?.id;

    const [role, setRole] = useState(null);
    const [menus, setMenus] = useState([]);
    const [selectedMenus, setSelectedMenus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);

    useEffect(() => {
        if (!encryptedId) {
            router.replace("/pages/role");
            return;
        }

        let isActive = true;

        const loadData = async () => {
            setLoading(true);

            const response = await fetchData(`roles/${encryptedId}/detail`, {}, "GET");

            if (!isActive) return;

            setLoading(false);

            if (response.error) {
                Toast.error(response.message || "Role not found");
                router.replace("/pages/role");
                return;
            }

            const detail = response.data || {};
            const roleData = detail.role || null;
            const assigned = Array.isArray(detail.assignedMenuIds) ? detail.assignedMenuIds : [];

            setRole(roleData);
            setSelectedMenus(assigned);

            const groupedMenus = [...(detail.menus || [])].sort((a, b) => {
                const groupA = getMenuGroupPath(a.Path);
                const groupB = getMenuGroupPath(b.Path);
                if (groupA !== groupB) return groupA.localeCompare(groupB);
                return String(a.Path || "").localeCompare(String(b.Path || ""));
            });

            setMenus(
                groupedMenus.map((item, index) => ({
                    No: index + 1,
                    id: item.Id,
                    Group: getMenuGroupPath(item.Path),
                    Name: item.Name || "-",
                    Path: item.Path || "-",
                    Icon: (
                        <span className="d-inline-flex align-items-center gap-2">
                            {(() => {
                                const IconComp = FaIcons[item.Icon] || FaIcons.FaRegCircle;
                                return <IconComp size={14} />;
                            })()}
                            <span>{item.Icon || "-"}</span>
                        </span>
                    ),
                    Status: item.Status === 1 ? "Active" : "Inactive",
                    Alignment: ["center", "left", "left", "left", "center", "center"],
                }))
            );
            setCurrentPage(1);
        };

        loadData();

        return () => {
            isActive = false;
        };
    }, [encryptedId, router]);

    const filteredMenus = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return menus;

        return menus.filter((item) =>
            [item.Group, item.Name, item.Path, item.Status].some((value) =>
                String(value || "").toLowerCase().includes(keyword)
            )
        );
    }, [menus, search]);

    const pagedMenus = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredMenus.slice(start, start + pageSize).map((item, index) => ({
            ...item,
            No: start + index + 1,
        }));
    }, [currentPage, filteredMenus, pageSize]);

    const handleSearch = (event) => {
        setSearch(event.target.value);
        setCurrentPage(1);
    };

    const handleSave = async () => {
        setSaving(true);

        try {
            const response = await fetchData(
                `roles/${encryptedId}/assign-menus`,
                { menuIds: selectedMenus },
                "POST"
            );

            if (response.error) {
                throw new Error(response.message);
            }

            const logResponse = await createActionLog({
                action: "UPDATE",
                oldValue: null,
                newValue: `Role: ${role?.Name || "-"}, Menu assigned: ${selectedMenus.join(", ") || "-"}`,
            });

            if (logResponse.error) {
                throw new Error(logResponse.message || "Role menu saved, but action log failed");
            }

            Toast.success(response.message || "Role menu data saved successfully");
            router.push("/pages/role");
        } catch (error) {
            Toast.error(error.message || "Failed to save role menu data");
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Loading loading={loading || saving} message={saving ? "Saving data..." : "Loading data..."} />
            <Breadcrumb
                title="Detail Role"
                items={[
                    { label: "Roles Management", href: "/pages/role" },
                    { label: "Detail" },
                ]}
            />
            <div className="card border-0 shadow-sm mb-3">
                <div className="card-body p-4">
                    <div className="row">
                        <InfoItem label="Role Name" value={role?.Name} />
                        <InfoItem label="Status" value={role?.Status === 1 ? "Active" : "Inactive"} />
                        <div className="col-md-6 col-sm-12 mb-3 d-flex justify-content-end align-items-start">
                            <Button
                                classType="secondary"
                                iconName="arrow-left"
                                label="Back"
                                onClick={() => router.push("/pages/role")}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="card border-0 shadow-sm">
                <div className="card-body p-0">
                    <div className="d-flex justify-content-between align-items-center p-3 border-bottom gap-2">
                        <div>
                            <h6 className="mb-1" style={{ fontSize: 14 }}>
                                Menu Assignment
                            </h6>
                            <p className="text-secondary mb-0" style={{ fontSize: 13 }}>
                                Pilih menu yang bisa diakses role ini.
                            </p>
                        </div>
                        <Button
                            classType="primary"
                            iconName="save"
                            label={saving ? "Menyimpan..." : "Simpan"}
                            isDisabled={saving}
                            onClick={handleSave}
                        />
                    </div>
                    <div className="p-3 border-bottom">
                        <div style={{ maxWidth: 360 }}>
                            <Input
                                label="Search Menu"
                                name="searchMenu"
                                type="search"
                                value={search}
                                onChange={handleSearch}
                                placeholder="Search by group, menu, path, or status"
                            />
                        </div>
                    </div>
                    <Table
                        size="Small"
                        data={pagedMenus}
                        enableCheckbox
                        initialSelectedIds={selectedMenus}
                        onSelectionChange={setSelectedMenus}
                    />
                    {filteredMenus.length > 0 && (
                        <div className="p-3 border-top">
                            <Paging
                                pageSize={pageSize}
                                pageCurrent={currentPage}
                                totalData={filteredMenus.length}
                                navigation={setCurrentPage}
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
