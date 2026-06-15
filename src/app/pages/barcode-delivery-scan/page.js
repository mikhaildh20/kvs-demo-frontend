"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Breadcrumb from "@/component/common/Breadcrumb";
import Button from "@/component/common/Button";
import Input from "@/component/common/Input";
import Loading from "@/component/common/Loading";
import SweetAlert from "@/component/common/SweetAlert";
import Table from "@/component/common/Table";
import Toast from "@/component/common/Toast";
import { createActionLog } from "@/lib/actionLog";
import { clearAuthSession } from "@/lib/auth";
import fetchData, { API_BASE_URL } from "@/lib/fetch";

const apiRoot = API_BASE_URL.replace(/\/api$/, "");

const resolveAssetUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${apiRoot}${String(path).startsWith("/") ? "" : "/"}${path}`;
};

const emptyTarget = {
  Id: "",
  PoNo: "",
  KanbanNo: "",
  CustomerCode: "",
  CustomerName: "",
  PartNumber: "",
  PartDescription: "",
  BoxQty: 0,
  ScannedQty: 0,
  RemainingQty: 0,
  Status: 0,
  LogisticGuidePath: "",
  LogisticGuideVoicePath: "",
};

const scanSteps = [
  { key: "pik", label: "PIK Barcode", field: "pikBarcode", className: "bds-scan-pik" },
  { key: "customer", label: "Customer Barcode", field: "customerBarcode", className: "bds-scan-customer" },
  { key: "oqc", label: "OQC Barcode", field: "oqcBarcode", className: "bds-scan-oqc" },
];

const emptyScanValues = { pikBarcode: "", customerBarcode: "", oqcBarcode: "" };

const today = () => new Date().toISOString().slice(0, 10);

const formatNumber = (value) => Number(value || 0).toLocaleString("en-US");
const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const escapeExcelCell = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const exportReportExcel = ({ rows, detailsByPo, summary, shipDate }) => {
  const summaryRows = `
    <tr><th>Total PO</th><th>Total Box</th><th>Scanned Box</th><th>Remaining Box</th><th>Done PO</th><th>Open PO</th></tr>
    <tr>
      <td>${escapeExcelCell(summary.totalPo)}</td>
      <td>${escapeExcelCell(summary.totalBox)}</td>
      <td>${escapeExcelCell(summary.scannedBox)}</td>
      <td>${escapeExcelCell(summary.remainingBox)}</td>
      <td>${escapeExcelCell(summary.donePo)}</td>
      <td>${escapeExcelCell(summary.openPo)}</td>
    </tr>`;

  const poRows = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeExcelCell(formatDate(row.ShipDate))}</td>
          <td>${escapeExcelCell(row.PoNo)}</td>
          <td>${escapeExcelCell(row.CustomerName)}</td>
          <td>${escapeExcelCell(row.TotalKanban)}</td>
          <td>${escapeExcelCell(row.TotalBox)}</td>
          <td>${escapeExcelCell(row.ScannedBox)}</td>
          <td>${escapeExcelCell(row.RemainingBox)}</td>
          <td>${escapeExcelCell(row.Status === 1 ? "DONE" : "OPEN")}</td>
        </tr>`
    )
    .join("");

  const detailRows = rows
    .flatMap((row) =>
      (detailsByPo[row.Id] || []).map((detail) => ({
        poNo: row.PoNo,
        ...detail,
      }))
    )
    .map(
      (row) => `
        <tr>
          <td>${escapeExcelCell(row.poNo)}</td>
          <td>${escapeExcelCell(row.KanbanNo)}</td>
          <td>${escapeExcelCell(row.PartNumber)}</td>
          <td>${escapeExcelCell(row.PartDescription)}</td>
          <td>${escapeExcelCell(row.TotalBox)}</td>
          <td>${escapeExcelCell(row.ScannedBox)}</td>
          <td>${escapeExcelCell(row.RemainingBox)}</td>
          <td>${escapeExcelCell(row.Status === 1 ? "DONE" : "OPEN")}</td>
        </tr>`
    )
    .join("");

  const html = `
    <html>
      <head><meta charset="utf-8" /></head>
      <body>
        <h3>Delivery Scan Report</h3>
        <p>Ship Date: ${escapeExcelCell(formatDate(shipDate))}</p>
        <table border="1">${summaryRows}</table>
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
          <tbody>${poRows}</tbody>
        </table>
        <br />
        <table border="1">
          <thead>
            <tr>
              <th>P/O No</th>
              <th>Kanban</th>
              <th>Part Number</th>
              <th>Part Description</th>
              <th>Initial Qty</th>
              <th>Scanned</th>
              <th>Remaining</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${detailRows}</tbody>
        </table>
      </body>
    </html>`;

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `delivery-scan-report-${shipDate || "all"}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const DocumentViewer = ({ path }) => {
  const url = resolveAssetUrl(path);
  const lowerUrl = url.toLowerCase();
  const isImage = [".jpg", ".jpeg", ".png", ".webp", ".gif"].some((ext) => lowerUrl.includes(ext));

  return (
    <div className="h-100 d-flex flex-column">
      <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2 flex-shrink-0">
        <h6 className="mb-0" style={{ fontSize: 14, fontWeight: 600 }}>Logistic Check</h6>
      </div>
      <div className="border rounded-2 bg-light flex-grow-1 d-flex align-items-center justify-content-center" style={{ minHeight: 0, overflow: "hidden" }}>
        {!url ? (
          <div className="text-secondary" style={{ fontSize: 13 }}>No document loaded</div>
        ) : isImage ? (
          <object data={url} type="image/*" aria-label="Logistic Check" style={{ width: "100%", height: "100%", objectFit: "contain" }}>
            <a href={url} target="_blank" rel="noreferrer">Logistic Check</a>
          </object>
        ) : (
          <iframe src={url} title="Logistic Check" style={{ width: "100%", height: "100%", border: 0, background: "#ffffff" }} />
        )}
      </div>
    </div>
  );
};

export default function BarcodeDeliveryScanPage() {
  const [loading, setLoading] = useState(false);
  const [shipDate, setShipDate] = useState(today());
  const [poDisplay, setPoDisplay] = useState("");
  const [selectedPo, setSelectedPo] = useState("");
  const [allPoOptions, setAllPoOptions] = useState([]);
  const [poOptions, setPoOptions] = useState([]);
  const [kanbanOptions, setKanbanOptions] = useState([]);
  const [target, setTarget] = useState(emptyTarget);
  const [scanValues, setScanValues] = useState(emptyScanValues);
  const [currentStep, setCurrentStep] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportRows, setReportRows] = useState([]);
  const [reportDetailsByPo, setReportDetailsByPo] = useState({});
  const [reportSummary, setReportSummary] = useState({ totalPo: 0, totalBox: 0, scannedBox: 0, remainingBox: 0, donePo: 0, openPo: 0 });
  const audioRef = useRef(null);
  const autoScanRef = useRef("");
  const scanValuesRef = useRef(emptyScanValues);

  const stopVoice = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }, []);

  const playVoice = useCallback((path) => {
    stopVoice();
    const url = resolveAssetUrl(path);
    if (!url) return;

    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play().catch(() => {
      Toast.error("Logistic check voice could not be played automatically.");
    });
  }, [stopVoice]);

  useEffect(() => () => stopVoice(), [stopVoice]);

  const resetTarget = useCallback(() => {
    stopVoice();
    setTarget(emptyTarget);
    scanValuesRef.current = emptyScanValues;
    setScanValues(emptyScanValues);
    setCurrentStep(0);
    autoScanRef.current = "";
  }, [stopVoice]);

  const loadPoOptions = useCallback(async (dateValue) => {
    if (!dateValue) {
      setAllPoOptions([]);
      setPoOptions([]);
      return [];
    }

    const response = await fetchData("barcode-delivery-scans/po-options", { ShipDate: dateValue }, "GET");
    if (response.error) throw new Error(response.message || "Failed to load PO list.");
    const rows = response.data || [];
    const openRows = rows.filter((item) => Number(item.ScannedKanban || 0) < Number(item.TotalKanban || 0));
    setAllPoOptions(rows);
    setPoOptions(openRows);
    return rows;
  }, []);

  const loadKanbanOptions = useCallback(async (dateValue, poNo) => {
    if (!dateValue || !poNo) {
      setKanbanOptions([]);
      return [];
    }

    const response = await fetchData("barcode-delivery-scans/kanban-options", { ShipDate: dateValue, PoNo: poNo }, "GET");
    if (response.error) throw new Error(response.message || "Failed to load kanban list.");
    const rows = response.data || [];
    setKanbanOptions(rows);
    return rows;
  }, []);

  useEffect(() => {
    queueMicrotask(async () => {
      try {
        setLoading(true);
        await loadPoOptions(today());
      } catch (error) {
        Toast.error(error.message || "Failed to load PO list.");
      } finally {
        setLoading(false);
      }
    });
  }, [loadPoOptions]);

  const handleShipDateChange = async (value) => {
    setShipDate(value);
    setSelectedPo("");
    setPoDisplay("");
    setKanbanOptions([]);
    resetTarget();

    try {
      setLoading(true);
      await loadPoOptions(value);
    } catch (error) {
      Toast.error(error.message || "Failed to load PO list.");
    } finally {
      setLoading(false);
    }
  };

  const selectPo = async (row, value, display) => {
    const poNo = value || row?.PoNo || "";
    setSelectedPo(poNo);
    setPoDisplay(display || poNo);
    resetTarget();

    try {
      setLoading(true);
      await loadKanbanOptions(shipDate, poNo);
    } catch (error) {
      Toast.error(error.message || "Failed to load kanban list.");
    } finally {
      setLoading(false);
    }
  };

  const poLovData = useMemo(
    () =>
      poOptions.map((item) => ({
        PoNo: item.PoNo,
        Customer: item.CustomerName || "-",
        Total: item.TotalKanban || 0,
      })),
    [poOptions]
  );

  const kanbanTable = useMemo(
    () =>
      kanbanOptions.map((item) => ({
        Key: item.Id || `${item.KanbanNo}-${item.PoNo || selectedPo}`,
        Kanban: item.KanbanNo,
        "Part Number": item.PartNumber,
        "Part Description": item.PartDescription,
        "Initial Qty": item.BoxQty,
        Remaining: item.RemainingQty,
        Status: item.Status === 1 ? "DONE" : "OPEN",
        Alignment: ["center", "center", "left", "right", "right", "center"],
      })),
    [kanbanOptions, selectedPo]
  );

  const dateSummary = useMemo(() => {
    const totalPo = allPoOptions.length;
    const totalKanban = allPoOptions.reduce((sum, item) => sum + Number(item.TotalKanban || 0), 0);
    const totalScanned = allPoOptions.reduce((sum, item) => sum + Number(item.ScannedKanban || 0), 0);
    const totalUnscanned = Math.max(totalKanban - totalScanned, 0);

    return { totalPo, totalKanban, totalScanned, totalUnscanned };
  }, [allPoOptions]);

  const reportTableRows = useMemo(
    () =>
      reportRows.map((row) => ({
        id: row.Id,
        "Ship Date": formatDate(row.ShipDate),
        "P/O No": row.PoNo,
        Customer: row.CustomerName,
        "Total Kanban": row.TotalKanban,
        "Total Box": row.TotalBox,
        "Scanned Box": row.ScannedBox,
        "Remaining Box": row.RemainingBox,
        Status: row.Status === 1 ? "DONE" : "OPEN",
        Alignment: ["center", "center", "left", "end", "end", "end", "end", "center"],
      })),
    [reportRows]
  );

  const reportDetailTables = useMemo(
    () =>
      reportRows.map((row) => ({
        id: row.Id,
        poNo: row.PoNo,
        customerName: row.CustomerName,
        status: row.Status === 1 ? "DONE" : "OPEN",
        data: (reportDetailsByPo[row.Id] || []).map((detail) => ({
          id: detail.Id,
          Kanban: detail.KanbanNo,
          "Part Number": detail.PartNumber,
          "Part Description": detail.PartDescription,
          "Initial Qty": detail.TotalBox,
          Scanned: detail.ScannedBox,
          Remaining: detail.RemainingBox,
          Status: detail.Status === 1 ? "DONE" : "OPEN",
          Alignment: ["center", "left", "left", "end", "end", "end", "center"],
        })),
      })),
    [reportDetailsByPo, reportRows]
  );

  const scanBaseDisabled = loading || !shipDate || !selectedPo;

  useEffect(() => {
    if (scanBaseDisabled) return;

    const field = scanSteps[currentStep]?.field;
    if (!field) return;

    const focusTimer = window.setTimeout(() => {
      document.getElementById(field)?.focus();
    }, 80);

    return () => window.clearTimeout(focusTimer);
  }, [currentStep, scanBaseDisabled]);

  const handleLockedResponse = useCallback(async (message) => {
    await SweetAlert({
      title: "Wrong Kanban",
      text: message || "Wrong kanban. Your account has been locked.",
      icon: "warning",
    });
    autoScanRef.current = "";
    clearAuthSession();
    window.location.href = "/pages/auth/unauthorized?reason=locked";
  }, []);

  const resolvePikBarcode = useCallback(async (values) => {
    try {
      setLoading(true);
      const response = await fetchData(
        "barcode-delivery-scans/resolve-pik",
        {
          ShipDate: shipDate,
          PoNo: selectedPo,
          PikBarcode: values.pikBarcode,
        },
        "POST"
      );

      if (response.error) {
        if (String(response.message || "").toLowerCase().includes("locked")) {
          await handleLockedResponse(response.message);
          return null;
        }
        throw new Error(response.message || "Failed to resolve PIK barcode.");
      }

      const resolvedTarget = response.data || emptyTarget;
      setTarget(resolvedTarget);
      playVoice(resolvedTarget.LogisticGuideVoicePath);
      return resolvedTarget;
    } catch (error) {
      Toast.error(error.message || "Failed to resolve PIK barcode.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleLockedResponse, playVoice, selectedPo, shipDate]);

  const submitScan = useCallback(async (submittedValues) => {
    const values =
      submittedValues && Object.prototype.hasOwnProperty.call(submittedValues, "pikBarcode")
        ? submittedValues
        : scanValuesRef.current;

    if (!target.Id) {
      Toast.error("Choose kanban first.");
      return;
    }

    for (const step of scanSteps) {
      const value = String(values[step.field] || "").trim();
      if (!value) {
        Toast.error(`Scan ${step.label} first`);
        return;
      }

    }

    try {
      setLoading(true);
      const response = await fetchData(
        "barcode-delivery-scans/scan",
        {
          Id: target.Id,
          PikBarcode: values.pikBarcode,
          CustomerBarcode: values.customerBarcode,
          OqcBarcode: values.oqcBarcode,
        },
        "POST"
      );

      if (response.error) {
        if (String(response.message || "").toLowerCase().includes("locked")) {
          await handleLockedResponse(response.message);
          return;
        }
        throw new Error(response.message || "Wrong kanban");
      }

      const logResponse = await createActionLog({
        action: "SCAN",
        oldValue: null,
        newValue: `BDS scan PO ${target.PoNo || "-"}, Kanban ${target.KanbanNo || "-"}, Remaining ${response.data?.RemainingQty ?? "-"}`,
        menuPath: "/pages/barcode-delivery-scan",
      });

      if (logResponse.error) throw new Error("Scan was saved successfully. Action log could not be saved.");

      Toast.success("Barcode delivery scan saved successfully.");
      setTarget(emptyTarget);
      scanValuesRef.current = emptyScanValues;
      setScanValues(emptyScanValues);
      setCurrentStep(0);
      autoScanRef.current = "";
      stopVoice();
      const [, nextKanbanRows] = await Promise.all([loadPoOptions(shipDate), loadKanbanOptions(shipDate, selectedPo)]);
      const poCompleted =
        nextKanbanRows.length > 0 &&
        nextKanbanRows.every((item) => Number(item.RemainingQty || 0) <= 0 || Number(item.Status || 0) === 1);

      if (poCompleted) {
        Toast.success(`PO ${selectedPo} has been fully scanned.`);
        setSelectedPo("");
        setPoDisplay("");
        setKanbanOptions([]);
        resetTarget();
      }
    } catch (error) {
      Toast.error(error.message || "Failed to save barcode delivery scan.");
    } finally {
      setLoading(false);
    }
  }, [handleLockedResponse, loadKanbanOptions, loadPoOptions, resetTarget, selectedPo, shipDate, stopVoice, target]);

  const advanceScanStep = useCallback(async (stepIndex, values) => {
    if (scanBaseDisabled) return;

    const step = scanSteps[stepIndex];
    const value = String(values[step.field] || "").trim();
    if (!value) return;

    const actionKey = `${stepIndex}:${value}`;
    if (autoScanRef.current === actionKey) return;
    autoScanRef.current = actionKey;

    window.setTimeout(async () => {
      if (stepIndex === 0) {
        const resolvedTarget = await resolvePikBarcode(values);
        if (!resolvedTarget) return;
        setCurrentStep(1);
        return;
      }

      if (stepIndex < scanSteps.length - 1) {
        const nextStep = stepIndex + 1;
        setCurrentStep(nextStep);
        return;
      }

      submitScan(values);
    }, 50);
  }, [resolvePikBarcode, scanBaseDisabled, submitScan]);

  const handleScanChange = (field, value) => {
    const stepIndex = scanSteps.findIndex((step) => step.field === field);
    if (stepIndex !== currentStep) {
      Toast.error(`Scan ${scanSteps[currentStep].label} first`);
      return;
    }

    const nextValue = String(value || "").trim();
    const nextScanValues = { ...scanValuesRef.current, [field]: nextValue };

    scanValuesRef.current = nextScanValues;
    setScanValues(nextScanValues);
  };

  const handleStepEnter = (event, stepIndex) => {
    if (event.key !== "Enter") return;
    event.preventDefault();

    const step = scanSteps[stepIndex];
    if (stepIndex !== currentStep) {
      Toast.error(`Scan ${scanSteps[currentStep].label} first`);
      return;
    }

    const value = String(event.currentTarget.value || "").trim();
    if (!value) {
      Toast.error(`Scan ${scanSteps[stepIndex].label} first`);
      return;
    }

    const nextScanValues = { ...scanValuesRef.current, [step.field]: value };
    scanValuesRef.current = nextScanValues;
    setScanValues(nextScanValues);
    advanceScanStep(stepIndex, nextScanValues);
  };

  const handleOpenReport = async () => {
    if (!shipDate) {
      Toast.error("Choose ship date first.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetchData(
        "barcode-delivery-scans/report",
        {
          DateFrom: shipDate,
          DateTo: shipDate,
          PageNumber: 1,
          PageSize: 1000,
        },
        "GET"
      );

      if (response.error) throw new Error(response.message || "Failed to load report.");

      const rows = response.data?.data || [];
      const detailPairs = await Promise.all(
        rows.map(async (row) => {
          const detailResponse = await fetchData(
            `barcode-delivery-scans/report/${encodeURIComponent(row.Id)}`,
            {},
            "GET"
          );

          if (detailResponse.error) {
            throw new Error(detailResponse.message || `Failed to load detail for PO ${row.PoNo || "-"}`);
          }

          return [row.Id, detailResponse.data?.data || []];
        })
      );

      setReportRows(rows);
      setReportDetailsByPo(Object.fromEntries(detailPairs));
      setReportSummary(response.data?.summary || { totalPo: 0, totalBox: 0, scannedBox: 0, remainingBox: 0, donePo: 0, openPo: 0 });
      setReportOpen(true);
    } catch (error) {
      Toast.error(error.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    if (reportRows.length === 0) {
      Toast.error("No data to export.");
      return;
    }

    try {
      const logResponse = await createActionLog({
        action: "EXPORT",
        oldValue: null,
        newValue: `Delivery Scan Report from scan page: ${shipDate}, PO ${reportRows.length}`,
        menuPath: "/pages/barcode-delivery-scan",
      });

      if (logResponse.error) throw new Error(logResponse.message || "Export log failed");

      exportReportExcel({
        rows: reportRows,
        detailsByPo: reportDetailsByPo,
        summary: reportSummary,
        shipDate,
      });
    } catch (error) {
      Toast.error(error.message || "Failed to export report.");
    }
  };

  return (
    <>
      <Loading loading={loading} message="Loading barcode delivery scan..." />
      <Breadcrumb title="Barcode Delivery Scan" items={[]} />

      <div className="barcode-delivery-page d-flex flex-column" style={{ height: "calc(100vh - 112px)", minHeight: 0, overflow: "hidden" }}>
        <style>{`
          .barcode-delivery-page .mb-3 { margin-bottom: 0.45rem !important; }
          .barcode-delivery-page .form-label { margin-bottom: 2px !important; }
          .barcode-delivery-page .form-text { display: none; }
          .barcode-delivery-page .bds-scan-pik input {
            background: #fff8e6 !important;
            border-color: #d99b1f !important;
            box-shadow: inset 4px 0 0 #d99b1f;
          }
          .barcode-delivery-page .bds-scan-customer input {
            background: #eef7ff !important;
            border-color: #2f7bbd !important;
            box-shadow: inset 4px 0 0 #2f7bbd;
          }
          .barcode-delivery-page .bds-scan-oqc input {
            background: #f1fbf2 !important;
            border-color: #2f8f46 !important;
            box-shadow: inset 4px 0 0 #2f8f46;
          }
          .barcode-delivery-page .bds-scan-pik input:disabled,
          .barcode-delivery-page .bds-scan-customer input:disabled,
          .barcode-delivery-page .bds-scan-oqc input:disabled {
            opacity: 0.72;
          }
          @media (max-width: 1199.98px) {
            .barcode-delivery-page { height: auto !important; overflow: visible !important; }
          }
        `}</style>

        <div className="row g-2 flex-grow-1" style={{ minHeight: 0 }}>
          <div className="col-xl-5 h-100" style={{ minHeight: 0, overflow: "auto" }}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-3">
                <div className="row g-2 align-items-end">
                  <div className="col-lg-4">
                    <Input label="Ship Date" name="shipDate" type="date" value={shipDate} onChange={(e) => handleShipDateChange(e.target.value)} />
                  </div>
                  <div className="col-lg-8">
                    <Input
                      label="PO No"
                      name="poNo"
                      type="lov"
                      value={poDisplay}
                      lovData={poLovData}
                      lovColumns={[
                        { key: "PoNo", label: "PO No" },
                        { key: "Customer", label: "Customer" },
                        { key: "Total", label: "Total" },
                      ]}
                      lovValueColumn="PoNo"
                      lovDisplayColumn="PoNo"
                      onLovSelect={selectPo}
                    />
                  </div>
                </div>

                <div className="row g-2 mt-1">
                  <div className="col-lg-6"><Input label="Kanban No" name="kanbanNo" value={target.KanbanNo} disabled /></div>
                  <div className="col-lg-6"><Input label="Remaining" name="remaining" value={target.RemainingQty} disabled /></div>
                </div>

                <div className="row g-2">
                  {scanSteps.map((step, index) => (
                    <div className="col-lg-4" key={step.key}>
                      <Input
                        label={step.label}
                        name={step.field}
                        id={step.field}
                        className={step.className}
                        value={scanValues[step.field]}
                        disabled={scanBaseDisabled || (index > 0 && !target.Id) || index !== currentStep}
                        onChange={(e) => handleScanChange(step.field, e.target.value)}
                        onKeyDown={(e) => handleStepEnter(e, index)}
                        placeholder={index === currentStep ? `Scan ${step.label}` : "Waiting previous scan"}
                      />
                    </div>
                  ))}
                </div>

                <div className="row g-2 mt-2">
                  <div className="col-12">
                    <div className="border rounded-2">
                      <div className="px-2 pt-2 fw-semibold" style={{ fontSize: 13 }}>Kanban List</div>
                      <div style={{ maxHeight: 394, overflowY: "auto", overflowX: "hidden" }}>
                        <Table size="Small" data={kanbanTable} />
                      </div>
                      <div className="px-2 py-2 border-top">
                        <div className="row g-2">
                          <div className="col-6 col-md-3">
                            <div className="border rounded-2 bg-white p-2 h-100">
                              <div className="text-secondary" style={{ fontSize: 11 }}>Total PO</div>
                              <div className="fw-semibold" style={{ fontSize: 16 }}>{dateSummary.totalPo}</div>
                            </div>
                          </div>
                          <div className="col-6 col-md-3">
                            <div className="border rounded-2 bg-white p-2 h-100">
                              <div className="text-secondary" style={{ fontSize: 11 }}>Total Kanban</div>
                              <div className="fw-semibold" style={{ fontSize: 16 }}>{dateSummary.totalKanban}</div>
                            </div>
                          </div>
                          <div className="col-6 col-md-3">
                            <div className="border rounded-2 bg-white p-2 h-100">
                              <div className="text-secondary" style={{ fontSize: 11 }}>Scanned</div>
                              <div className="fw-semibold text-success" style={{ fontSize: 16 }}>{dateSummary.totalScanned}</div>
                            </div>
                          </div>
                          <div className="col-6 col-md-3">
                            <div className="border rounded-2 bg-white p-2 h-100">
                              <div className="text-secondary" style={{ fontSize: 11 }}>Not Scanned</div>
                              <div className="fw-semibold text-danger" style={{ fontSize: 16 }}>{dateSummary.totalUnscanned}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="px-2 pb-2 d-flex justify-content-end">
                        <Button
                          classType="primary"
                          iconName="bar-chart-line"
                          label="Report"
                          onClick={handleOpenReport}
                          isDisabled={!shipDate}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-7 h-100" style={{ minHeight: 0 }}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-2 h-100" style={{ minHeight: 0 }}>
                <DocumentViewer path={target.LogisticGuidePath} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {reportOpen && (
        <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(26, 26, 26, 0.35)", overflow: "hidden" }}>
          <div className="modal-dialog modal-xl" style={{ maxHeight: "calc(100vh - 3.5rem)" }}>
            <div className="modal-content border-0 shadow" style={{ maxHeight: "calc(100vh - 3.5rem)", overflow: "hidden" }}>
              <div className="modal-header">
                <div>
                  <h5 className="modal-title" style={{ fontSize: 16 }}>Delivery Scan Report</h5>
                  <p className="text-secondary mb-0" style={{ fontSize: 13 }}>
                    Ship Date: {formatDate(shipDate)}
                  </p>
                </div>
                <button type="button" className="btn-close" onClick={() => setReportOpen(false)} />
              </div>
              <div className="modal-body" style={{ background: "#f6f8fb", overflowY: "auto", overflowX: "hidden" }}>
                <div className="row g-3 mb-3">
                  <div className="col-xl-2 col-lg-4 col-md-6">
                    <div className="border rounded-2 bg-white p-3 h-100">
                      <div className="text-secondary" style={{ fontSize: 12 }}>Total PO</div>
                      <div className="fw-semibold mt-1" style={{ fontSize: 22 }}>{formatNumber(reportSummary.totalPo)}</div>
                    </div>
                  </div>
                  <div className="col-xl-2 col-lg-4 col-md-6">
                    <div className="border rounded-2 bg-white p-3 h-100">
                      <div className="text-secondary" style={{ fontSize: 12 }}>Total Box</div>
                      <div className="fw-semibold mt-1" style={{ fontSize: 22 }}>{formatNumber(reportSummary.totalBox)}</div>
                    </div>
                  </div>
                  <div className="col-xl-2 col-lg-4 col-md-6">
                    <div className="border rounded-2 bg-white p-3 h-100">
                      <div className="text-secondary" style={{ fontSize: 12 }}>Scanned Box</div>
                      <div className="fw-semibold mt-1" style={{ fontSize: 22 }}>{formatNumber(reportSummary.scannedBox)}</div>
                    </div>
                  </div>
                  <div className="col-xl-2 col-lg-4 col-md-6">
                    <div className="border rounded-2 bg-white p-3 h-100">
                      <div className="text-secondary" style={{ fontSize: 12 }}>Remaining Box</div>
                      <div className="fw-semibold mt-1" style={{ fontSize: 22 }}>{formatNumber(reportSummary.remainingBox)}</div>
                    </div>
                  </div>
                  <div className="col-xl-2 col-lg-4 col-md-6">
                    <div className="border rounded-2 bg-white p-3 h-100">
                      <div className="text-secondary" style={{ fontSize: 12 }}>Done PO</div>
                      <div className="fw-semibold mt-1" style={{ fontSize: 22 }}>{formatNumber(reportSummary.donePo)}</div>
                    </div>
                  </div>
                  <div className="col-xl-2 col-lg-4 col-md-6">
                    <div className="border rounded-2 bg-white p-3 h-100">
                      <div className="text-secondary" style={{ fontSize: 12 }}>Open PO</div>
                      <div className="fw-semibold mt-1" style={{ fontSize: 22 }}>{formatNumber(reportSummary.openPo)}</div>
                    </div>
                  </div>
                </div>
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-0">
                    <Table size="Small" data={reportTableRows} />
                  </div>
                </div>
                <div className="mt-3">
                  <h6 className="mb-2" style={{ fontSize: 14 }}>Kanban Detail by PO</h6>
                  <div className="d-flex flex-column gap-3">
                    {reportDetailTables.map((detail) => (
                      <div className="card border-0 shadow-sm" key={detail.id}>
                        <div className="card-body p-0">
                          <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
                            <div>
                              <div className="fw-semibold" style={{ fontSize: 13 }}>PO {detail.poNo}</div>
                              <div className="text-secondary" style={{ fontSize: 12 }}>{detail.customerName || "-"}</div>
                            </div>
                            <span className={`badge ${detail.status === "DONE" ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"}`}>
                              {detail.status}
                            </span>
                          </div>
                          <Table size="Small" data={detail.data} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <Button classType="warning" iconName="box-arrow-up" label="Export Excel" onClick={handleExportReport} />
                <Button classType="secondary" iconName="x" label="Close" onClick={() => setReportOpen(false)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
