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
import * as FaIcons from "react-icons/fa";

const dataFilterSort = [
  { Value: "qfm_name ASC", Text: "Format Name [?]" },
  { Value: "qfm_name DESC", Text: "Format Name [?]" },
  { Value: "qfm_seq_length ASC", Text: "Seq Length [?]" },
  { Value: "qfm_seq_length DESC", Text: "Seq Length [?]" },
];

const dataFilterStatus = [
  { Value: "1", Text: "Active" },
  { Value: "0", Text: "Inactive" },
];

export default function QrFormatPage() {
  const router = useRouter();
  const sortRef = useRef();
  const statusRef = useRef();

  const [dataRows, setDataRows] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(dataFilterSort[0].Value);
  const [sortStatus, setSortStatus] = useState(dataFilterStatus[0].Value);
  const [menuIcon, setMenuIcon] = useState("FaRegCircle");

  useEffect(() => {
    let isActive = true;

    fetchData("/auth/session", {}, "GET").then((response) => {
      if (!isActive || response.error) return;

      const qrFormatMenu = (response.data?.menus || []).find(
        (menu) => menu.path === "/pages/qr-format"
      );

      setMenuIcon(qrFormatMenu?.icon || "FaRegCircle");
    });

    return () => {
      isActive = false;
    };
  }, []);

  const loadData = useCallback(async (page, sort, keyword, status) => {
    try {
      setLoading(true);
      const response = await fetchData(
        "qr-formats",
        {
          Status: status,
          ...(keyword === "" ? {} : { Keyword: keyword }),
          Urut: sort,
          PageNumber: page,
          PageSize: pageSize,
        },
        "GET"
      );

      if (response.error) throw new Error(response.message);

      const { data = [], totalData: total = 0 } = response.data || {};
      setRawRows(data);
      setDataRows(
        data.map((item, index) => ({
          No: (page - 1) * pageSize + index + 1,
          id: item.Id,
          Name: item.Name,
          Pattern: item.Pattern,
          "Seq Length": item.SeqLength,
          Status: item.Status === 1 ? "Active" : "Inactive",
          Action: ["Detail", "Edit", "Toggle"],
          Alignment: ["center", "left", "left", "center", "center", "center"],
        }))
      );
      setTotalData(total);
      setCurrentPage(page);
    } catch (err) {
      Toast.error(err.message || "Failed to load QR format data.");
      setDataRows([]);
      setTotalData(0);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  const handleSearch = useCallback((query) => {
    setSearch(query);
    loadData(1, sortBy, query, sortStatus);
  }, [loadData, sortBy, sortStatus]);

  const handleFilterApply = useCallback(() => {
    const newSortBy = sortRef.current.value;
    const newStatus = statusRef.current.value;
    setSortBy(newSortBy);
    setSortStatus(newStatus);
    setCurrentPage(1);
    loadData(1, newSortBy, search, newStatus);
  }, [loadData, search]);

  const handleNavigation = useCallback((page) => {
    loadData(page, sortBy, search, sortStatus);
  }, [loadData, search, sortBy, sortStatus]);

  const handleAdd = useCallback(() => {
    router.push("/pages/qr-format/add");
  }, [router]);

  const handleEdit = useCallback((id) => {
    router.push(`/pages/qr-format/edit/${encryptIdUrl(id)}`);
  }, [router]);

  const handleDetail = useCallback((id) => {
    router.push(`/pages/qr-format/detail/${encryptIdUrl(id)}`);
  }, [router]);

  const handleToggle = useCallback(async (id) => {
    const row = rawRows.find((item) => item.Id === id);
    const isActive = row?.Status === 1;

    const result = await SweetAlert({
      title: isActive ? "Disable QR Format" : "Enable QR Format",
      text: isActive
        ? "Are you sure you want to disable this QR format?"
        : "Are you sure you want to enable this QR format?",
      icon: isActive ? "warning" : "info",
      confirmText: isActive ? "Yes, disable it!" : "Yes, enable it!",
    });

    if (!result) return;

    setLoading(true);

    try {
      const response = await fetchData("qr-formats/toggle-status", { id }, "POST");
      if (response.error) throw new Error(response.message);

      const logResponse = await createActionLog({
        action: "UPDATE",
        oldValue: `QR Format: ${row?.Name}, Status: ${isActive ? "Active" : "Inactive"}`,
        newValue: `QR Format: ${row?.Name}, Status: ${isActive ? "Inactive" : "Active"}`,
      });

      if (logResponse.error) {
        throw new Error("QR format status updated successfully. Action log could not be saved.");
      }

      Toast.success("QR format status updated successfully.");
      await loadData(currentPage, sortBy, search, sortStatus);
    } catch (error) {
      Toast.error(error.message || "Failed to update QR format status.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, loadData, rawRows, search, sortBy, sortStatus]);

  useEffect(() => {
    queueMicrotask(() => {
      loadData(1, sortBy, search, sortStatus);
    });
  }, [loadData, search, sortBy, sortStatus]);

  const filterContent = useMemo(() => (
    <>
      <DropDown ref={sortRef} arrData={dataFilterSort} type="choose" label="Sorting" forInput="sortBy" defaultValue={sortBy} />
      <DropDown ref={statusRef} arrData={dataFilterStatus} type="choose" label="Status" forInput="sortStatus" defaultValue={sortStatus} />
    </>
  ), [sortBy, sortStatus]);

  const QrFormatMenuIcon = FaIcons[menuIcon] || FaIcons.FaRegCircle;

  return (
    <>
      <Loading loading={loading} message="loading data..." />
      <Breadcrumb title="QR Formats Management" items={[]} />
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
              <QrFormatMenuIcon size={16} />
            </div>
            <div>
              <h6 className="mb-1" style={{ fontSize: 14 }}>
                QR Format Overview
              </h6>
              <p
                className="text-secondary mb-0"
                style={{ fontSize: 13, lineHeight: 1.6 }}
              >
                Manage QR parsing formats used to solve scanned kanban labels
                and extract sequence data for inspection workflows. Active
                formats can be assigned to customers so scan processes can read
                the correct kanban number and sequence structure.
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
          searchPlaceholder="Search QR format data"
          addButtonText="Add"
          showExportButton={false}
          filterContent={filterContent}
        />
      </div>
      <div className="col-12">
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <Table size="Small" data={dataRows} onDetail={handleDetail} onEdit={handleEdit} onToggle={handleToggle} config={{ isWrap: { Pattern: true } }} />
            {totalData > 0 && (
              <div className="p-3 border-top">
                <Paging pageSize={pageSize} pageCurrent={currentPage} totalData={totalData} navigation={handleNavigation} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
