"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Breadcrumb from "@/component/common/Breadcrumb";
import Button from "@/component/common/Button";
import DropDown from "@/component/common/Dropdown";
import Input from "@/component/common/Input";
import Loading from "@/component/common/Loading";
import Paging from "@/component/common/Paging";
import Table from "@/component/common/Table";
import Toast from "@/component/common/Toast";
import { createActionLog } from "@/lib/actionLog";
import fetchData from "@/lib/fetch";
import * as FaIcons from "react-icons/fa";

const REPORT_TIME_ZONE = "Asia/Jakarta";

const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const initialFilter = {
  dateFrom: today(),
  dateTo: today(),
  lineId: "",
  kanbanNo: "",
};

const toOptions = (items, getText) =>
  (items || []).map((item) => ({
    Value: item.Id,
    Text: getText(item),
  }));

const getDatabaseDateParts = (value) => {
  const match = String(value || "").match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/
  );

  if (!match) return null;

  return {
    year: match[1],
    month: match[2],
    day: match[3],
    hour: match[4],
    minute: match[5],
    second: match[6],
  };
};

const formatDateOnly = (value) => {
  if (!value) return "-";
  const parts = getDatabaseDateParts(value);
  if (parts) return `${parts.day}/${parts.month}/${parts.year}`;

  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatTimeOnly = (value) => {
  if (!value) return "-";
  const parts = getDatabaseDateParts(value);
  if (parts) return `${parts.hour}:${parts.minute}:${parts.second}`;

  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, "0");

  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const formatNumber = (value) => Number(value || 0).toLocaleString("en-US");
const formatThreeDigitMark = (value) => String(value ?? "000").trim().padStart(3, "0").slice(-3);

const sortRowsByLine = (rows) =>
  [...(rows || [])].sort((a, b) => {
    const lineCompare = String(a.LineCode || "").localeCompare(String(b.LineCode || ""), "en", { numeric: true });
    if (lineCompare !== 0) return lineCompare;
    return new Date(a.Date || 0) - new Date(b.Date || 0);
  });

const exportExcel = ({ rows, summary, filters }) => {
  const escapeCell = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const tableRows = sortRowsByLine(rows)
    .map(
      (row, index) => `
        <tr>
          <td>${escapeCell(index + 1)}</td>
          <td>${escapeCell(row.LineCode)}</td>
          <td>${escapeCell(formatDateOnly(row.Date))}</td>
          <td>${escapeCell(formatTimeOnly(row.Date))}</td>
          <td>${escapeCell(row.KanbanNo)}</td>
          <td>${escapeCell(row.QtyTotal)}</td>
          <td>${escapeCell(row.QtyNG)}</td>
          <td>${escapeCell(row.QtyOK)}</td>
          <td>${escapeCell(row.Inspector)}</td>
          <td style="mso-number-format:'\\@';">${escapeCell(formatThreeDigitMark(row.DeviceNo))}</td>
          <td style="mso-number-format:'\\@';">${escapeCell(formatThreeDigitMark(row.CertMark))}</td>
        </tr>`
    )
    .join("");

  const html = `
    <html>
      <head><meta charset="utf-8" /></head>
      <body>
        <h3>Double Check Report</h3>
        <p>Date: ${escapeCell(filters.dateFrom || "-")} to ${escapeCell(filters.dateTo || "-")}</p>
        <table border="1">
          <tr><th>Total Qty</th><th>All Line Qty</th><th>Total OK</th><th>Total NG</th><th>NG Ratio from OK</th></tr>
          <tr>
            <td>${escapeCell(summary.totalQty)}</td>
            <td>${escapeCell(summary.allLineQty)}</td>
            <td>${escapeCell(summary.totalOK)}</td>
            <td>${escapeCell(summary.totalNG)}</td>
            <td>${escapeCell(`${Number(summary.ngRatio || 0).toFixed(2)}%`)}</td>
          </tr>
        </table>
        <br />
        <table border="1">
          <thead>
            <tr>
              <th>NO</th>
              <th>LINE</th>
              <th>DATE</th>
              <th>TIME</th>
              <th>KANBAN</th>
              <th>TOTAL</th>
              <th>NG</th>
              <th>OK</th>
              <th>Inspector</th>
              <th>Device No</th>
              <th>Certificated Mark</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
    </html>`;

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `double-check-report-${filters.dateFrom || "all"}-${filters.dateTo || "all"}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const SummaryCard = ({ label, value }) => (
  <div className="col-xl col-lg-4 col-md-6">
    <div className="border rounded-2 bg-white p-3 h-100">
      <div className="text-secondary" style={{ fontSize: 12 }}>{label}</div>
      <div className="fw-semibold mt-1" style={{ fontSize: 24 }}>{value}</div>
    </div>
  </div>
);

export default function DoubleCheckReportPage() {
  const [filters, setFilters] = useState(initialFilter);
  const [appliedFilters, setAppliedFilters] = useState(initialFilter);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ totalQty: 0, allLineQty: 0, totalOK: 0, totalNG: 0, ngRatio: 0 });
  const [lines, setLines] = useState([]);
  const [kanbans, setKanbans] = useState([]);
  const [kanbanDisplay, setKanbanDisplay] = useState("");
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
        (menu) => menu.path === "/pages/double-check-report"
      );

      setMenuIcon(reportMenu?.icon || "FaRegCircle");
    });

    return () => {
      isActive = false;
    };
  }, []);

  const loadOptions = useCallback(async () => {
    try {
      const [lineResponse, kanbanResponse] = await Promise.all([
        fetchData("lines", { Status: 1, PageNumber: 1, PageSize: 1000 }, "GET"),
        fetchData("kanbans", { Status: 1, PageNumber: 1, PageSize: 1000 }, "GET"),
      ]);

      if (lineResponse.error) throw new Error(lineResponse.message || "Failed to load lines.");
      if (kanbanResponse.error) throw new Error(kanbanResponse.message || "Failed to load kanbans.");

      setLines(toOptions(lineResponse.data?.data || [], (item) => item.Code || "-"));
      setKanbans(kanbanResponse.data?.data || []);
    } catch (error) {
      Toast.error(error.message || "Failed to load filter options.");
    }
  }, []);

  const loadReport = useCallback(async (nextFilters, page = 1) => {
    try {
      setLoading(true);
      const response = await fetchData(
        "double-check/report",
        {
          DateFrom: nextFilters.dateFrom,
          DateTo: nextFilters.dateTo,
          LineId: nextFilters.lineId,
          KanbanNo: nextFilters.kanbanNo,
          PageNumber: page,
          PageSize: pageSize,
        },
        "GET"
      );

      if (response.error) throw new Error(response.message || "Failed to load report.");

      setRows(response.data?.data || []);
      setSummary(response.data?.summary || { totalQty: 0, allLineQty: 0, totalOK: 0, totalNG: 0, ngRatio: 0 });
      setTotalData(response.data?.totalData || 0);
      setCurrentPage(page);
      setAppliedFilters(nextFilters);
    } catch (error) {
      Toast.error(error.message || "Failed to load report.");
      setRows([]);
      setTotalData(0);
      setSummary({ totalQty: 0, allLineQty: 0, totalOK: 0, totalNG: 0, ngRatio: 0 });
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    queueMicrotask(() => {
      loadOptions();
      loadReport(initialFilter);
    });
  }, [loadOptions, loadReport]);

  const tableRows = useMemo(
    () =>
      rows.map((row, index) => ({
        id: row.Id,
        No: (currentPage - 1) * pageSize + index + 1,
        LINE: row.LineCode,
        DATE: formatDateOnly(row.Date),
        TIME: formatTimeOnly(row.Date),
        KANBAN: row.KanbanNo,
        TOTAL: row.QtyTotal,
        NG: row.QtyNG,
        OK: row.QtyOK,
        Inspector: row.Inspector,
        "Device No": formatThreeDigitMark(row.DeviceNo),
        "Certificated Mark": formatThreeDigitMark(row.CertMark),
        Alignment: ["center", "center", "center", "center", "center", "end", "end", "end", "left", "center", "center"],
      })),
    [currentPage, pageSize, rows]
  );

  const kanbanLovData = useMemo(
    () =>
      kanbans.map((item) => ({
        No: item.Id,
      })),
    [kanbans]
  );

  const handleApply = () => {
    if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
      Toast.error("Date From cannot be greater than Date To.");
      return;
    }

    loadReport(filters, 1);
  };

  const handleReset = () => {
    setFilters(initialFilter);
    setKanbanDisplay("");
    loadReport(initialFilter, 1);
  };

  const handleNavigation = (page) => {
    loadReport(appliedFilters, page);
  };

  const handleExport = async () => {
    if (totalData === 0) {
      Toast.error("No data to export.");
      return;
    }

    try {
      const logResponse = await createActionLog({
        action: "EXPORT",
        oldValue: null,
        newValue: `Double Check Report: ${appliedFilters.dateFrom || "-"} to ${appliedFilters.dateTo || "-"}, Rows ${totalData}, Qty ${summary.totalQty}, OK ${summary.totalOK}, NG ${summary.totalNG}`,
      });

      if (logResponse.error) {
        throw new Error(logResponse.message || "Export log failed");
      }

      const response = await fetchData(
        "double-check/report",
        {
          DateFrom: appliedFilters.dateFrom,
          DateTo: appliedFilters.dateTo,
          LineId: appliedFilters.lineId,
          KanbanNo: appliedFilters.kanbanNo,
          PageNumber: 1,
          PageSize: totalData,
        },
        "GET"
      );

      if (response.error) throw new Error(response.message || "Failed to load export data.");

      exportExcel({ rows: response.data?.data || [], summary: response.data?.summary || summary, filters: appliedFilters });
    } catch (error) {
      Toast.error(error.message || "Failed to export report.");
    }
  };

  const ReportMenuIcon = FaIcons[menuIcon] || FaIcons.FaRegCircle;

  return (
    <>
      <Loading loading={loading} message="Loading report..." />
      <Breadcrumb title="Double Check Report" items={[]} />

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
                Double Check Report Overview
              </h6>
              <p
                className="text-secondary mb-0"
                style={{ fontSize: 13, lineHeight: 1.6 }}
              >
                Review double check inspection history by production day, line,
                and kanban number. This report summarizes total quantity, OK
                quantity, NG quantity, NG ratio, inspector activity, device
                number, and certificate mark validation results for monitoring
                production inspection quality.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body p-3">
          <div className="row g-2 align-items-end">
            <div className="col-lg-2">
              <Input
                label="Date From"
                name="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters((current) => ({ ...current, dateFrom: e.target.value }))}
              />
            </div>
            <div className="col-lg-2">
              <Input
                label="Date To"
                name="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters((current) => ({ ...current, dateTo: e.target.value }))}
              />
            </div>
            <div className="col-lg-2">
              <DropDown
                arrData={lines}
                type="all"
                label="Line"
                forInput="lineId"
                value={filters.lineId}
                onChange={(e) => setFilters((current) => ({ ...current, lineId: e.target.value }))}
              />
            </div>
            <div className="col-lg-4">
              <Input
                label="Kanban"
                name="kanbanNo"
                type="lov"
                value={kanbanDisplay}
                lovData={kanbanLovData}
                lovColumns={[
                  { key: "No", label: "Kanban" },
                ]}
                lovValueColumn="No"
                lovDisplayColumn="No"
                onLovSelect={(row, value, display) => {
                  setKanbanDisplay(display || "");
                  setFilters((current) => ({ ...current, kanbanNo: value || "" }));
                }}
              />
            </div>
          </div>

          <div className="text-secondary mt-2" style={{ fontSize: 12 }}>
            Production day uses 08:00 to 07:59 the next day.
          </div>

          <div className="d-flex justify-content-end gap-2">
            <Button classType="secondary" iconName="arrow-clockwise" label="Reset" onClick={handleReset} />
            <Button classType="primary" iconName="funnel" label="Apply Filter" onClick={handleApply} />
            <Button classType="warning" iconName="box-arrow-up" label="Export Excel" onClick={handleExport} />
          </div>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <SummaryCard label="Total Qty" value={formatNumber(summary.totalQty)} />
        <SummaryCard label="All Line Qty" value={formatNumber(summary.allLineQty)} />
        <SummaryCard label="Total OK" value={formatNumber(summary.totalOK)} />
        <SummaryCard label="Total NG" value={formatNumber(summary.totalNG)} />
        <SummaryCard label="NG Ratio from OK" value={`${Number(summary.ngRatio || 0).toFixed(2)}%`} />
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <Table size="Small" data={tableRows} />
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
    </>
  );
}
