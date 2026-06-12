"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/component/common/Breadcrumb";
import Button from "@/component/common/Button";
import DropDown from "@/component/common/Dropdown";
import Input from "@/component/common/Input";
import Loading from "@/component/common/Loading";
import Paging from "@/component/common/Paging";
import Table from "@/component/common/Table";
import Toast from "@/component/common/Toast";
import { createActionLog } from "@/lib/actionLog";
import { encryptIdUrl } from "@/lib/encryptor";
import fetchData from "@/lib/fetch";
import * as FaIcons from "react-icons/fa";

const today = () => new Date().toISOString().slice(0, 10);

const initialFilter = {
  dateFrom: today(),
  dateTo: today(),
  poNo: "",
  status: "",
};

const statusOptions = [
  { Value: "0", Text: "Open" },
  { Value: "1", Text: "Done" },
];

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatNumber = (value) => Number(value || 0).toLocaleString("en-US");

const exportExcel = ({ rows, summary, filters }) => {
  const escapeCell = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const bodyRows = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeCell(formatDate(row.ShipDate))}</td>
          <td>${escapeCell(row.PoNo)}</td>
          <td>${escapeCell(row.CustomerName)}</td>
          <td>${escapeCell(row.TotalKanban)}</td>
          <td>${escapeCell(row.TotalBox)}</td>
          <td>${escapeCell(row.ScannedBox)}</td>
          <td>${escapeCell(row.RemainingBox)}</td>
          <td>${escapeCell(row.Status === 1 ? "DONE" : "OPEN")}</td>
        </tr>`
    )
    .join("");

  const html = `
    <html>
      <head><meta charset="utf-8" /></head>
      <body>
        <h3>Barcode Delivery Scan Report</h3>
        <p>Date: ${escapeCell(filters.dateFrom || "-")} to ${escapeCell(filters.dateTo || "-")}</p>
        <table border="1">
          <tr><th>Total PO</th><th>Total Box</th><th>Scanned Box</th><th>Remaining Box</th><th>Done PO</th><th>Open PO</th></tr>
          <tr>
            <td>${escapeCell(summary.totalPo)}</td>
            <td>${escapeCell(summary.totalBox)}</td>
            <td>${escapeCell(summary.scannedBox)}</td>
            <td>${escapeCell(summary.remainingBox)}</td>
            <td>${escapeCell(summary.donePo)}</td>
            <td>${escapeCell(summary.openPo)}</td>
          </tr>
        </table>
        <br />
        <table border="1">
          <thead>
            <tr>
              <th>Ship Date</th>
              <th>P/O No</th>
              <th>Customer</th>
              <th>Total Kanban</th>
              <th>Total Box</th>
              <th>Scanned Box</th>
              <th>Remaining Box</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </body>
    </html>`;

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `barcode-delivery-scan-report-${filters.dateFrom || "all"}-${filters.dateTo || "all"}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const SummaryCard = ({ label, value }) => (
  <div className="col-xl-2 col-lg-4 col-md-6">
    <div className="border rounded-2 bg-white p-3 h-100">
      <div className="text-secondary" style={{ fontSize: 12 }}>{label}</div>
      <div className="fw-semibold mt-1" style={{ fontSize: 24 }}>{value}</div>
    </div>
  </div>
);

export default function BarcodeDeliveryScanReportPage() {
  const router = useRouter();
  const [filters, setFilters] = useState(initialFilter);
  const [appliedFilters, setAppliedFilters] = useState(initialFilter);
  const [rows, setRows] = useState([]);
  const [poOptions, setPoOptions] = useState([]);
  const [poDisplay, setPoDisplay] = useState("");
  const [summary, setSummary] = useState({ totalPo: 0, totalBox: 0, scannedBox: 0, remainingBox: 0, donePo: 0, openPo: 0 });
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [pageSize] = useState(10);
  const [menuIcon, setMenuIcon] = useState("FaRegCircle");

  useEffect(() => {
    let isActive = true;

    fetchData("/auth/session", {}, "GET").then((response) => {
      if (!isActive || response.error) return;

      const reportMenu = (response.data?.menus || []).find(
        (menu) => menu.path === "/pages/barcode-delivery-scan-report"
      );

      setMenuIcon(reportMenu?.icon || "FaRegCircle");
    });

    return () => {
      isActive = false;
    };
  }, []);

  const loadReport = useCallback(async (nextFilters, page = 1) => {
    try {
      setLoading(true);
      const response = await fetchData(
        "barcode-delivery-scans/report",
        {
          DateFrom: nextFilters.dateFrom,
          DateTo: nextFilters.dateTo,
          PoNo: nextFilters.poNo,
          Status: nextFilters.status,
          PageNumber: page,
          PageSize: pageSize,
        },
        "GET"
      );

      if (response.error) throw new Error(response.message || "Failed to load report");

      setRows(response.data?.data || []);
      setSummary(response.data?.summary || { totalPo: 0, totalBox: 0, scannedBox: 0, remainingBox: 0, donePo: 0, openPo: 0 });
      setTotalData(response.data?.totalData || 0);
      setCurrentPage(page);
      setAppliedFilters(nextFilters);
    } catch (error) {
      Toast.error(error.message || "Failed to load report");
      setRows([]);
      setTotalData(0);
      setSummary({ totalPo: 0, totalBox: 0, scannedBox: 0, remainingBox: 0, donePo: 0, openPo: 0 });
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    queueMicrotask(() => {
      loadReport(initialFilter);
    });
  }, [loadReport]);

  const loadPoOptions = useCallback(async (dateFrom, dateTo) => {
    try {
      const response = await fetchData(
        "barcode-delivery-scans/report",
        {
          DateFrom: dateFrom,
          DateTo: dateTo,
          PageNumber: 1,
          PageSize: 1000,
        },
        "GET"
      );

      if (response.error) throw new Error(response.message || "Failed to load PO list");
      setPoOptions(response.data?.data || []);
    } catch (error) {
      Toast.error(error.message || "Failed to load PO list");
      setPoOptions([]);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      loadPoOptions(filters.dateFrom, filters.dateTo);
    });
  }, [filters.dateFrom, filters.dateTo, loadPoOptions]);

  const tableRows = useMemo(
    () =>
      rows.map((row) => ({
        id: row.Id,
        "Ship Date": formatDate(row.ShipDate),
        "P/O No": row.PoNo,
        Customer: row.CustomerName,
        "Total Kanban": row.TotalKanban,
        "Total Box": row.TotalBox,
        "Scanned Box": row.ScannedBox,
        "Remaining Box": row.RemainingBox,
        Status: row.Status === 1 ? "DONE" : "OPEN",
        Action: ["Detail"],
        Alignment: ["center", "center", "left", "end", "end", "end", "end", "center", "center"],
      })),
    [rows]
  );

  const poLovData = useMemo(
    () =>
      poOptions.map((row) => ({
        PoNo: row.PoNo,
        Customer: row.CustomerName || "-",
        Status: row.Status === 1 ? "DONE" : "OPEN",
      })),
    [poOptions]
  );

  const handleApply = () => {
    if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
      Toast.error("Date From cannot be greater than Date To");
      return;
    }

    loadReport(filters, 1);
  };

  const handleReset = () => {
    setFilters(initialFilter);
    setPoDisplay("");
    loadReport(initialFilter, 1);
  };

  const handleNavigation = (page) => {
    loadReport(appliedFilters, page);
  };

  const handleDetail = (id) => {
    router.push(`/pages/barcode-delivery-scan-report/detail/${encryptIdUrl(id)}`);
  };

  const handleExport = async () => {
    if (totalData === 0) {
      Toast.error("No data to export");
      return;
    }

    try {
      const logResponse = await createActionLog({
        action: "EXPORT",
        oldValue: null,
        newValue: `Barcode Delivery Scan Report: ${appliedFilters.dateFrom || "-"} to ${appliedFilters.dateTo || "-"}, PO ${totalData}`,
        menuPath: "/pages/barcode-delivery-scan-report",
      });

      if (logResponse.error) throw new Error(logResponse.message || "Export log failed");

      const response = await fetchData(
        "barcode-delivery-scans/report",
        {
          DateFrom: appliedFilters.dateFrom,
          DateTo: appliedFilters.dateTo,
          PoNo: appliedFilters.poNo,
          Status: appliedFilters.status,
          PageNumber: 1,
          PageSize: totalData,
        },
        "GET"
      );

      if (response.error) throw new Error(response.message || "Failed to load export data");

      exportExcel({ rows: response.data?.data || [], summary: response.data?.summary || summary, filters: appliedFilters });
    } catch (error) {
      Toast.error(error.message || "Failed to export report");
    }
  };

  const ReportMenuIcon = FaIcons[menuIcon] || FaIcons.FaRegCircle;

  return (
    <>
      <Loading loading={loading} message="Loading barcode delivery scan report..." />
      <Breadcrumb title="Delivery Scan Report" items={[]} />

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
              <ReportMenuIcon size={16} />
            </div>
            <div>
              <h6 className="mb-1" style={{ fontSize: 14 }}>
                Delivery Scan Report Overview
              </h6>
              <p
                className="text-secondary mb-0"
                style={{ fontSize: 13, lineHeight: 1.6 }}
              >
                Monitor barcode delivery scan progress by shipment date, P/O
                number, customer, and completion status. This report summarizes
                total boxes, scanned boxes, remaining boxes, and PO completion
                so logistics teams can quickly identify deliveries that are
                still open or already done.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body p-3">
          <div className="row g-2 align-items-end">
            <div className="col-lg-2">
              <Input label="Date From" name="dateFrom" type="date" value={filters.dateFrom} onChange={(e) => setFilters((current) => ({ ...current, dateFrom: e.target.value }))} />
            </div>
            <div className="col-lg-2">
              <Input label="Date To" name="dateTo" type="date" value={filters.dateTo} onChange={(e) => setFilters((current) => ({ ...current, dateTo: e.target.value }))} />
            </div>
            <div className="col-lg-3">
              <Input
                label="P/O No"
                name="poNo"
                type="lov"
                value={poDisplay}
                lovData={poLovData}
                lovColumns={[
                  { key: "PoNo", label: "P/O No" },
                  { key: "Customer", label: "Customer" },
                  { key: "Status", label: "Status" },
                ]}
                lovValueColumn="PoNo"
                lovDisplayColumn="PoNo"
                onLovSelect={(row, value, display) => {
                  setPoDisplay(display || value || "");
                  setFilters((current) => ({ ...current, poNo: value || "" }));
                }}
              />
            </div>
            <div className="col-lg-2">
              <DropDown
                arrData={statusOptions}
                type="all"
                label="Status"
                forInput="status"
                value={filters.status}
                onChange={(e) => setFilters((current) => ({ ...current, status: e.target.value }))}
              />
            </div>
            <div className="col-lg-3 d-flex justify-content-end gap-2 mb-2">
              <Button classType="secondary" iconName="arrow-clockwise" label="Reset" onClick={handleReset} />
              <Button classType="primary" iconName="funnel" label="Apply" onClick={handleApply} />
              <Button classType="warning" iconName="box-arrow-up" label="Export" onClick={handleExport} />
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <SummaryCard label="Total PO" value={formatNumber(summary.totalPo)} />
        <SummaryCard label="Total Box" value={formatNumber(summary.totalBox)} />
        <SummaryCard label="Scanned Box" value={formatNumber(summary.scannedBox)} />
        <SummaryCard label="Remaining Box" value={formatNumber(summary.remainingBox)} />
        <SummaryCard label="Done PO" value={formatNumber(summary.donePo)} />
        <SummaryCard label="Open PO" value={formatNumber(summary.openPo)} />
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <Table size="Small" data={tableRows} onDetail={handleDetail} />
          {totalData > 0 && (
            <div className="p-3 border-top">
              <Paging pageSize={pageSize} pageCurrent={currentPage} totalData={totalData} navigation={handleNavigation} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
