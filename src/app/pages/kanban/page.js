"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Paging from "@/component/common/Paging";
import Table from "@/component/common/Table";
import Toast from "@/component/common/Toast";
import DropDown from "@/component/common/Dropdown";
import Formsearch from "@/component/common/Formsearch";
import { useRouter } from "next/navigation";
import fetchData from "@/lib/fetch";
import { encryptIdUrl } from "@/lib/encryptor";
import Breadcrumb from "@/component/common/Breadcrumb";
import Loading from "@/component/common/Loading";
import SweetAlert from "@/component/common/SweetAlert";
import { createActionLog } from "@/lib/actionLog";
import Button from "@/component/common/Button";
import * as FaIcons from "react-icons/fa";

const dataFilterSort = [
    { Value: "kbn_no ASC", Text: "Kanban No [↑]"},
    { Value: "kbn_no DESC", Text: "Kanban No [↓]"},
    { Value: "kbn_uniq_no ASC", Text: "Kanban Unique Number [↑]"},
    { Value: "kbn_uniq_no DESC", Text: "Kanban Unique Number [↓]"},
    { Value: "kbn_qty_box ASC", Text: "Kanban Quantity Perbox [↑]"},
    { Value: "kbn_qty_box DESC", Text: "Kanban Quantity Perbox [↓]"},
];

const dataFilterSpecial = [
    { Value: "1", Text: "Special" },
    { Value: "0", Text: "Normal" },
];

const dataFilterStatus = [
    { Value: "1", Text: "Active" },
    { Value: "0", Text: "Inactive" },
];

export default function KanbanPage(){
    const router = useRouter();
    const sortRef = useRef();
    const specialRef = useRef();
    const statusRef = useRef();
    const specialToggleRef = useRef(() => {});

    const [dataKanban, setDataKanban] = useState([]);
    const [dataKanbanRaw, setDataKanbanRaw] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalData, setTotalData] = useState(0);
    const [pageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState(dataFilterSort[0].Value);
    const [sortSpecial, setSortSpecial] = useState("");
    const [sortStatus, setSortStatus] = useState("");
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFileA, setImportFileA] = useState(null);
    const [importFileB, setImportFileB] = useState(null);
    const [menuIcon, setMenuIcon] = useState("FaRegCircle");

    useEffect(() => {
        let isActive = true;

        fetchData("/auth/session", {}, "GET").then((response) => {
            if (!isActive || response.error) return;

            const kanbanMenu = (response.data?.menus || []).find(
                (menu) => menu.path === "/pages/kanban"
            );

            setMenuIcon(kanbanMenu?.icon || "FaRegCircle");
        });

        return () => {
            isActive = false;
        };
    }, []);

    const loadData = useCallback(
        async (page, sort, cari, special, status) =>{
            try{
                setLoading(true);
                const response = await fetchData(
                    "kanbans",
                    {
                        Special: special,
                        Status: status,
                        ...(cari === "" ? {} : { Keyword: cari }),
                        Urut: sort,
                        PageNumber: page,
                        PageSize: pageSize,
                    },
                    "GET"
                );

                if(response.error){
                    throw new Error(response.message);
                }

                const { data = [], totalData: total = 0 } = response.data || {};
                setDataKanbanRaw(data);
                setDataKanban(
                    data.map((item, index) => ({
                        No: (page - 1) * pageSize + index + 1,
                        id: item.Id,
                        "Kanban No": item.Id,
                        "Unique No": item.UniqNo,
                        Customer: item.CustomerName || "-",
                        Color: item.ColorName || "-",
                        "Qty/Box": item.QtyBox ?? "-",
                        Special: item.Special === 1 ? "Special" : "Normal",
                        Status: item.Status === 1 ? "Active" : "Inactive",
                        Action: [
                            "Detail",
                            "Edit",
                            {
                                IconName: item.Special === 1 ? "star-fill" : "star",
                                Title: item.Special === 1 ? "Set Normal" : "Set Special",
                                Function: () => specialToggleRef.current(item.Id),
                            },
                            "Toggle",
                        ],
                        Alignment: [
                            "center",
                            "center",
                            "center",
                            "center",
                            "center",
                            "center",
                            "center",
                            "center",
                            "center",
                            "center",
                        ],
                    }))
                );
                setTotalData(total);
                setCurrentPage(page);
            }catch(error){
                Toast.error(error.message || "Failed to load data");
                setDataKanban([]);
                setDataKanbanRaw([]);
                setTotalData(0);
            }finally{
                setLoading(false);
            }
        },
        [pageSize]
    );

    const handleSearch = useCallback(
        (query) => {
        setSearch(query);
        loadData(1, sortBy, query, sortSpecial, sortStatus);
        },
        [sortBy, sortSpecial, sortStatus, loadData]
    );

    const handleFilterApply = useCallback(() => {
        const newSortBy = sortRef.current.value;
        const newSpecial = specialRef.current.value;
        const newStatus = statusRef.current.value;

        setSortBy(newSortBy);
        setSortSpecial(newSpecial);
        setSortStatus(newStatus);
        setCurrentPage(1);
        loadData(1, newSortBy, search, newSpecial, newStatus);
    }, [search, loadData]);

    const handleNavigation = useCallback(
        (page) => {
            loadData(page, sortBy, search, sortSpecial, sortStatus);
        },
        [sortBy, search, sortSpecial, sortStatus, loadData]
    );

    const handleAdd = useCallback(() => {
        router.push("/pages/kanban/add");
    }, [router]);

    const handleEdit = useCallback((id) => 
        router.push(`/pages/kanban/edit/${encryptIdUrl(id)}`),
        [router]
    );

    const handleDetail = useCallback((id) => 
        router.push(`/pages/kanban/detail/${encryptIdUrl(id)}`),
        [router]
    );

    const handleToggleStatus = useCallback(
        async (id) => {
            const kanban = dataKanbanRaw.find((item) => item.Id === id);
            const isActive = kanban?.Status === 1;
            const result = await SweetAlert({
                title: isActive ? "Disable Kanban" : "Enable Kanban",
                text: isActive
                ? "Are you sure you want to disable this kanban?"
                : "Are you sure you want to enable this kanban?",
                icon: isActive ? "warning" : "info",
                confirmText: isActive ? "Yes, disable it!" : "Yes, enable it!",
            });

            if(!result) return;

            setLoading(true);

            try{
                const response = await fetchData("kanbans/toggle-status", {id}, "POST");

                if(response.error){
                    throw new Error(response.message);
                }

                const logResponse = await createActionLog({
                    action: "UPDATE",
                    oldValue: `Kanban: ${kanban.Id}, Status: ${isActive ? "Active" : "Inactive"}`,
                    newValue: `Kanban: ${kanban.Id}, Status: ${isActive ? "Inactive" : "Active"}`,
                });

                if(logResponse.error){
                    throw new Error(logResponse.message || "Kanban status updated, but action log failed");
                }

                Toast.success(response.message || "Kanban status updated successfully");
                await loadData(currentPage, sortBy, search, sortSpecial, sortStatus);
            }catch(error){
                Toast.error(error.message || "Failed to update kanban status");
            } finally {
                setLoading(false);
            }
        },
        [currentPage, dataKanbanRaw, loadData, search, sortBy, sortSpecial, sortStatus]
    );

    const handleToggleSpecial = useCallback(
        async (id) => {
            const kanban = dataKanbanRaw.find((item) => item.Id === id);
            const isActive = kanban?.Special === 1;
            const result = await SweetAlert({
                title: isActive ? "Disable Special" : "Enable Special",
                text: isActive
                ? "Are you sure you want to unflag this special kanban?"
                : "Are you sure you want to flag this as special kanban?",
                icon: isActive ? "warning" : "info",
                confirmText: isActive ? "Yes, disable it!" : "Yes, enable it!",
            });

            if(!result) return;

            setLoading(true);

            try{
                const response = await fetchData("kanbans/toggle-special", {id}, "POST");

                if(response.error){
                    throw new Error(response.message);
                }

                const logResponse = await createActionLog({
                    action: "UPDATE",
                    oldValue: `Kanban: ${kanban.Id}, Status: ${isActive ? "Special" : "Normal"}`,
                    newValue: `Kanban: ${kanban.Id}, Status: ${isActive ? "Normal" : "Special"}`,
                });

                if(logResponse.error){
                    throw new Error(logResponse.message || "Special kanban updated, but action log failed");
                }

                Toast.success(response.message || "Special kanban updated successfully");
                await loadData(currentPage, sortBy, search, sortSpecial, sortStatus);
            }catch(error){
                Toast.error(error.message || "Failed to update special kanban");
            } finally {
                setLoading(false);
            }
        },
        [currentPage, dataKanbanRaw, loadData, search, sortBy, sortSpecial, sortStatus]
    );

    useEffect(() => {
        specialToggleRef.current = handleToggleSpecial;
    }, [handleToggleSpecial]);

    const resetImportForm = useCallback(() => {
        setImportFileA(null);
        setImportFileB(null);
    }, []);

    const handleOpenImport = useCallback(() => {
        resetImportForm();
        setShowImportModal(true);
    }, [resetImportForm]);

    const handleCloseImport = useCallback(() => {
        setShowImportModal(false);
        resetImportForm();
    }, [resetImportForm]);

    const handleImport = useCallback(async () => {
        if (!importFileA || !importFileB) {
            Toast.error("Select Excel file A and Excel file B first");
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("fileA", importFileA);
            formData.append("fileB", importFileB);

            const response = await fetchData("kanbans/import", formData, "POST", true);

            if (response.error) {
                throw new Error(response.message);
            }

            await createActionLog({
                action: "IMPORT",
                oldValue: null,
                newValue: `Kanban import: ${response.data?.total ?? 0} rows`,
            });

            Toast.success(response.message || "Kanban imported successfully");
            handleCloseImport();
            await loadData(1, sortBy, search, sortSpecial, sortStatus);
        } catch (error) {
            Toast.error(error.message || "Failed to import kanban");
            console.log(error);
        } finally {
            setLoading(false);
        }
    }, [handleCloseImport, importFileA, importFileB, loadData, search, sortBy, sortSpecial, sortStatus]);

    useEffect(() => {
        queueMicrotask(() => {
            loadData(1, sortBy, search, sortSpecial, sortStatus);
        });
    }, [loadData, sortBy, search, sortSpecial, sortStatus]);

    const filterContent = useMemo(
        () => (
            <>
                <DropDown
                ref={sortRef}
                arrData={dataFilterSort}
                type="choose"
                label="Sorting"
                forInput="sortBy"
                defaultValue={sortBy}
                />
                <DropDown
                ref={specialRef}
                arrData={dataFilterSpecial}
                type="choose"
                label="Special"
                forInput="Special"
                defaultValue={sortSpecial}
                />
                <DropDown
                ref={statusRef}
                arrData={dataFilterStatus}
                type="choose"
                label="Status"
                forInput="sortStatus"
                defaultValue={sortStatus}
                />
            </>
        ),
        [sortBy, sortSpecial, sortStatus]
    );

    const KanbanMenuIcon = FaIcons[menuIcon] || FaIcons.FaRegCircle;

    return(
        <>
            <Loading loading={loading} message="loading data..." />
            <Breadcrumb title="Kanbans Management" items={[]} />
            <div className="card border-0 shadow-sm mb-3">
                <div className="card-body p-3">
                    <div className="d-flex align-items-start gap-3">
                        <div
                            className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                            style={{
                                width: 38,
                                height: 38,
                                background: "#eef5ff",
                                color: "#185fa5",
                            }}
                        >
                            <KanbanMenuIcon size={16} />
                        </div>
                        <div>
                            <h6 className="mb-1" style={{ fontSize: 14 }}>
                                Kanban Master Overview
                            </h6>
                            <p
                                className="text-secondary mb-0"
                                style={{ fontSize: 13, lineHeight: 1.6 }}
                            >
                                Manage kanban master data used by OQC,
                                double check inspection, barcode delivery
                                scanning, and production reports. This page
                                controls kanban status, customer linkage,
                                quantity, special handling, document
                                references, and barcode information used across
                                operational workflows.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <Formsearch
                    onSearch={handleSearch}
                    onAdd={handleAdd}
                    onFilter={handleFilterApply}
                    searchPlaceholder="Search kanban data"
                    addButtonText="Add"
                    showExportButton={false}
                    showImportButton
                    importButtonText="Import"
                    onImport={handleOpenImport}
                    filterContent={filterContent}
                />
            </div>
            <div className="col-12">
                <div className="card border-0 shadow-sm">
                    <div className="card-body p-0">
                        <Table
                            size="Small"
                            data={dataKanban}
                            onEdit={handleEdit}
                            onDetail={handleDetail}
                            onToggle={handleToggleStatus}
                        />
                        {totalData > 0 && (
                        <div className="p-3 border-top">
                            <Paging
                            pageSize={pageSize}
                            pageCurrent={currentPage}
                            totalData={totalData}
                            navigation={handleNavigation}
                            />
                        </div>
                        )}
                    </div>
                </div>
            </div>
            {showImportModal && (
                <div
                    className="modal d-block"
                    tabIndex="-1"
                    style={{ background: "rgba(26, 26, 26, 0.35)" }}
                >
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header">
                                <div>
                                    <h5 className="modal-title" style={{ fontSize: 16 }}>
                                        Import Kanban
                                    </h5>
                                    <p className="text-secondary mb-0" style={{ fontSize: 13 }}>
                                        Upload customer part list dan kanban master.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="btn-close"
                                    aria-label="Close"
                                    onClick={handleCloseImport}
                                />
                            </div>
                            <div className="modal-body">
                                <div className="row">
                                    <div className="col-lg-6">
                                        <label
                                            className="form-label"
                                            style={{ fontSize: 13 }}
                                        >
                                            Excel A - Customer Part List
                                        </label>

                                        <input
                                            className="form-control rounded-2"
                                            name="fileA"
                                            type="file"
                                            accept=".xlsx"
                                            onChange={(e) =>
                                                setImportFileA(
                                                    e.target.files?.[0] || null
                                                )
                                            }
                                            style={{
                                                fontSize: 13,
                                                height: 38,
                                            }}
                                        />

                                        {importFileA && (
                                            <div
                                                className="form-text"
                                                style={{ fontSize: 12 }}
                                            >
                                                {importFileA.name}
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-lg-6">
                                        <label
                                            className="form-label"
                                            style={{ fontSize: 13 }}
                                        >
                                            Excel B - Kanban Master
                                        </label>

                                        <input
                                            className="form-control rounded-2"
                                            name="fileB"
                                            type="file"
                                            accept=".xlsx"
                                            onChange={(e) =>
                                                setImportFileB(
                                                    e.target.files?.[0] || null
                                                )
                                            }
                                            style={{
                                                fontSize: 13,
                                                height: 38,
                                            }}
                                        />

                                        {importFileB && (
                                            <div
                                                className="form-text"
                                                style={{ fontSize: 12 }}
                                            >
                                                {importFileB.name}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div
                                    className="border rounded-3 p-3 mt-3"
                                    style={{
                                        background: "#f8fafc",
                                    }}
                                >
                                    <div className="row g-3">
                                        {/* 🔥 FILE A */}
                                        <div className="col-lg-6">
                                            <div
                                                className="border rounded-3 p-3 h-100"
                                                style={{
                                                    background: "#ffffff",
                                                }}
                                            >
                                                <div
                                                    className="fw-semibold mb-2"
                                                    style={{ fontSize: 13 }}
                                                >
                                                    File A Guide - Customer Part List
                                                </div>

                                                <ol
                                                    className="mb-0 ps-3 text-secondary"
                                                    style={{
                                                        fontSize: 12,
                                                        lineHeight: 1.7,
                                                    }}
                                                >
                                                    <li>
                                                        Open the PRONES application and
                                                        log in.
                                                    </li>

                                                    <li>
                                                        Go to menu{" "}
                                                        <span className="fw-semibold text-dark">
                                                            KOITO A
                                                        </span>{" "}
                                                        →{" "}
                                                        <span className="fw-semibold text-dark">
                                                            REPORT
                                                        </span>
                                                    </li>

                                                    <li>
                                                        Click the{" "}
                                                        <span className="fw-semibold text-dark">
                                                            Customer Item Master
                                                            List
                                                        </span>{" "}
                                                        button.
                                                    </li>

                                                    <li>
                                                        In the{" "}
                                                        <span className="fw-semibold text-dark">
                                                            Customer Item Master
                                                            List
                                                        </span>{" "}
                                                        window, click the{" "}
                                                        <span className="fw-semibold text-dark">
                                                            PRINT
                                                        </span>{" "}
                                                        button.
                                                    </li>

                                                    <li>
                                                        After the print result window
                                                        appears, click the{" "}
                                                        <span className="fw-semibold text-dark">
                                                            export to file
                                                        </span>{" "}
                                                        icon next to the printer icon.
                                                    </li>

                                                    <li>
                                                        Save the file with the name{" "}
                                                        <span className="fw-semibold text-dark">
                                                            Customer Item
                                                            Master.xlsx
                                                        </span>
                                                    </li>
                                                </ol>
                                            </div>
                                        </div>

                                        {/* 🔥 FILE B */}
                                        <div className="col-lg-6">
                                            <div
                                                className="border rounded-3 p-3 h-100"
                                                style={{
                                                    background: "#ffffff",
                                                }}
                                            >
                                                <div
                                                    className="fw-semibold mb-2"
                                                    style={{ fontSize: 13 }}
                                                >
                                                    File B Guide - Kanban Master
                                                </div>

                                                <ol
                                                    className="mb-0 ps-3 text-secondary"
                                                    style={{
                                                        fontSize: 12,
                                                        lineHeight: 1.7,
                                                    }}
                                                >
                                                    <li>
                                                        Open the PRONES application and
                                                        log in.
                                                    </li>

                                                    <li>
                                                        Go to menu{" "}
                                                        <span className="fw-semibold text-dark">
                                                            KOITO B
                                                        </span>{" "}
                                                        →{" "}
                                                        <span className="fw-semibold text-dark">
                                                            REPORT
                                                        </span>
                                                    </li>

                                                    <li>
                                                        Click the{" "}
                                                        <span className="fw-semibold text-dark">
                                                            Item Master List
                                                        </span>{" "}
                                                        button.
                                                    </li>

                                                    <li>
                                                        In the{" "}
                                                        <span className="fw-semibold text-dark">
                                                            Item Master List
                                                        </span>{" "}
                                                        window, press{" "}
                                                        <span className="fw-semibold text-dark">
                                                            [Enter]
                                                        </span>{" "}
                                                        then click the{" "}
                                                        <span className="fw-semibold text-dark">
                                                            PRINT
                                                        </span>{" "}
                                                        button.
                                                    </li>

                                                    <li>
                                                        After the print result window
                                                        appears, click the{" "}
                                                        <span className="fw-semibold text-dark">
                                                            export to file
                                                        </span>{" "}
                                                        icon next to the printer icon.
                                                    </li>

                                                    <li>
                                                        Save the file with the name{" "}
                                                        <span className="fw-semibold text-dark">
                                                            Kanban Item
                                                            Master.xlsx
                                                        </span>
                                                    </li>
                                                </ol>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <Button
                                    classType="secondary"
                                    iconName="x"
                                    label="Cancel"
                                    onClick={handleCloseImport}
                                />
                                <Button
                                    classType="primary"
                                    iconName="cloud-arrow-up"
                                    label="Import"
                                    onClick={handleImport}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
