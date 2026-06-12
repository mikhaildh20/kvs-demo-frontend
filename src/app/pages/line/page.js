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
  { Value: "lin_code ASC", Text: "Line Code [↑]" },
  { Value: "lin_code DESC", Text: "Line Code [↓]" },
];

const dataFilterStatus = [
  { Value: "1", Text: "Active" },
  { Value: "0", Text: "Inactive" },
];

export default function LinePage() {
  const router = useRouter();
  const sortRef = useRef();
  const statusRef = useRef();

  const [dataLine, setDataLine] = useState([]);
  const [dataLineRaw, setDataLineRaw] = useState([]);
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

      const lineMenu = (response.data?.menus || []).find(
        (menu) => menu.path === "/pages/line"
      );

      setMenuIcon(lineMenu?.icon || "FaRegCircle");
    });

    return () => {
      isActive = false;
    };
  }, []);

  const loadData = useCallback(
    async (page, sort, cari, status) => {
      try {
        setLoading(true);

        const response = await fetchData(
          "lines",
          {
            Status: status,
            ...(cari === "" ? {} : { Keyword: cari }),
            Urut: sort,
            PageNumber: page,
            PageSize: pageSize,
          },
          "GET"
        );

        if (response.error) {
          throw new Error(response.message);
        }

        const { data = [], totalData: total = 0 } = response.data || {};
        setDataLineRaw(data);
        setDataLine(
          data.map((item, index) => ({
            No: (page - 1) * pageSize + index + 1,
            id: item.Id,
            Code: item.Code,
            Status: item.Status === 1 ? "Active" : "Inactive",
            Action: ["Detail", "Edit", "Toggle"],
            Alignment: ["center", "center", "center", "center", "center"],
          }))
        );
        setTotalData(total);
        setCurrentPage(page);
      } catch (err) {
        Toast.error(err.message || "Failed to load data");
        setDataLine([]);
        setTotalData(0);
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  const handleSearch = useCallback(
    (query) => {
      setSearch(query);
      loadData(1, sortBy, query, sortStatus);
    },
    [sortBy, sortStatus, loadData]
  );

  const handleFilterApply = useCallback(() => {
    const newSortBy = sortRef.current.value;
    const newStatus = statusRef.current.value;

    setSortBy(newSortBy);
    setSortStatus(newStatus);
    setCurrentPage(1);
    loadData(1, newSortBy, search, newStatus);
  }, [search, loadData]);

  const handleNavigation = useCallback(
    (page) => {
      loadData(page, sortBy, search, sortStatus);
    },
    [sortBy, search, sortStatus, loadData]
  );

  const handleAdd = useCallback(() => {
    router.push("/pages/line/add");
  }, [router]);

  const handleEdit = useCallback(
    (id) => router.push(`/pages/line/edit/${encryptIdUrl(id)}`),
    [router]
  );

  const handleDetail = useCallback(
    (id) => router.push(`/pages/line/detail/${encryptIdUrl(id)}`),
    [router]
  );

  const handleToggle = useCallback(
    async (id) => {
      const line = dataLineRaw.find((item) => item.Id === id);
      const isActive = line?.Status === 1;
      const result = await SweetAlert({
        title: isActive ? "Disable Line" : "Enable Line",
        text: isActive
          ? "Are you sure you want to disable this line?"
          : "Are you sure you want to enable this line?",
        icon: isActive ? "warning" : "info",
        confirmText: isActive ? "Yes, disable it!" : "Yes, enable it!",
      });

      if (!result) return;

      setLoading(true);

      try {
        const response = await fetchData("lines/toggle-status", { id }, "POST");

        if (response.error) {
          throw new Error(response.message);
        }

        const logResponse = await createActionLog({
          action: "UPDATE",
          oldValue: `Line: ${line?.Code || id} ${isActive ? "Active" : "Inactive"}`,
          newValue: `Line: ${line?.Code || id} ${isActive ? "Inactive" : "Active"}`,
        });

        if (logResponse.error) {
          throw new Error(logResponse.message || "Line status updated, but action log failed");
        }

        Toast.success(response.message || "Line status updated successfully");
        await loadData(currentPage, sortBy, search, sortStatus);
      } catch (err) {
        Toast.error(err.message || "Failed to update line status");
      } finally {
        setLoading(false);
      }
    },
    [currentPage, dataLineRaw, loadData, search, sortBy, sortStatus]
  );

  useEffect(() => {
    queueMicrotask(() => {
      loadData(1, sortBy, search, sortStatus);
    });
  }, [loadData, sortBy, search, sortStatus]);

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
          ref={statusRef}
          arrData={dataFilterStatus}
          type="choose"
          label="Status"
          forInput="sortStatus"
          defaultValue={sortStatus}
        />
      </>
    ),
    [sortBy, sortStatus]
  );

  const LineMenuIcon = FaIcons[menuIcon] || FaIcons.FaRegCircle;

  return (
    <>
      <Loading loading={loading} message="Loading data..." />
      <Breadcrumb title="Lines Management" items={[]} />
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
              <LineMenuIcon size={16} />
            </div>
            <div>
              <h6 className="mb-1" style={{ fontSize: 14 }}>
                Line Master Overview
              </h6>
              <p
                className="text-secondary mb-0"
                style={{ fontSize: 13, lineHeight: 1.6 }}
              >
                Manage production line master data used to control process
                access, inspection ownership, double check activity, and report
                filtering. Active lines are available for operational
                transactions, while inactive lines are kept for historical data
                reference.
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
          searchPlaceholder="Search line data"
          addButtonText="Add"
          showExportButton={false}
          filterContent={filterContent}
        />
      </div>
      <div className="col-12">
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <Table
              size="Small"
              data={dataLine}
              onDetail={handleDetail}
              onEdit={handleEdit}
              onToggle={handleToggle}
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
    </>
  );
}
