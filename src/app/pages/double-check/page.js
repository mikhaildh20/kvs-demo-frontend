"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Breadcrumb from "@/component/common/Breadcrumb";
import Button from "@/component/common/Button";
import Input from "@/component/common/Input";
import Loading from "@/component/common/Loading";
import SweetAlert from "@/component/common/SweetAlert";
import Toast from "@/component/common/Toast";
import { createActionLog } from "@/lib/actionLog";
import fetchData, { API_BASE_URL } from "@/lib/fetch";

const emptyScan = {
  qrText: "",
  kanbanNo: "",
  sequence: "",
  totalLabel: 0,
  checkedCount: 0,
  qtyBox: 0,
  qtyNg: 0,
  qtyOk: 0,
  deviceNo: "",
  certMark: "",
  expectedDeviceNo: "",
  expectedCertMark: "",
  instructionWorkPath: "",
  sequenceCheckPath: "",
  sequenceCheckVoicePath: "",
};

const apiRoot = API_BASE_URL.replace(/\/api$/, "");

const resolveAssetUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${apiRoot}${String(path).startsWith("/") ? "" : "/"}${path}`;
};

const formatNumber = (value) => Number(value || 0).toLocaleString("en-US");

const defaultDailySummary = {
  lineCode: "-",
  lineQty: 0,
  allLineQty: 0,
};

const DocumentViewer = ({ title, path }) => {
  const url = resolveAssetUrl(path);
  const lowerUrl = url.toLowerCase();
  const isImage = [".jpg", ".jpeg", ".png", ".webp", ".gif"].some((ext) => lowerUrl.includes(ext));

  return (
    <div className="h-100 d-flex flex-column">
      <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2 flex-shrink-0">
        <h6 className="mb-0" style={{ fontSize: 14, fontWeight: 600 }}>{title}</h6>
      </div>
      <div
        className="border rounded-2 bg-light flex-grow-1 d-flex align-items-center justify-content-center"
        style={{ minHeight: 0, overflow: "hidden" }}
      >
        {!url ? (
          <div className="text-secondary" style={{ fontSize: 13 }}>No document loaded</div>
        ) : isImage ? (
          <object
            data={url}
            type="image/*"
            aria-label={title}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          >
            <a href={url} target="_blank" rel="noreferrer">{title}</a>
          </object>
        ) : (
          <iframe
            src={url}
            title={title}
            style={{ width: "100%", height: "100%", border: 0, background: "#ffffff" }}
          />
        )}
      </div>
    </div>
  );
};

export default function DoubleCheckPage() {
  const [allowed, setAllowed] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scanText, setScanText] = useState("");
  const [scan, setScan] = useState(emptyScan);
  const [dailySummary, setDailySummary] = useState(defaultDailySummary);
  const audioRef = useRef(null);
  const lastScannedRef = useRef("");

  const focusScanInput = useCallback(() => {
    window.setTimeout(() => document.getElementById("scanQr")?.focus(), 50);
    window.setTimeout(() => document.getElementById("scanQr")?.focus(), 200);
  }, []);

  const stopVoice = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }, []);

  const resetForNextScan = useCallback(() => {
    stopVoice();
    lastScannedRef.current = "";
    setScan(emptyScan);
    setScanText("");
    focusScanInput();
  }, [focusScanInput, stopVoice]);

  const playVoice = useCallback((path) => {
    stopVoice();
    const url = resolveAssetUrl(path);
    if (!url) return;

    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play().catch(() => {
      Toast.error("Sequence check voice could not be played automatically.");
    });
  }, [stopVoice]);

  const loadDailySummary = useCallback(async () => {
    const response = await fetchData("double-check/summary", {}, "GET");
    if (response.error) throw new Error(response.message || "Failed to load double check summary");
    setDailySummary(response.data || defaultDailySummary);
  }, []);

  useEffect(() => {
    let active = true;

    const checkAccess = async () => {
      setLoading(true);
      try {
        const response = await fetchData("double-check/access", {}, "GET");
        if (response.error) throw new Error(response.message || "Failed to check access");

        const isAllowed = Boolean(response.data?.allowed);
        if (!active) return;

        setAllowed(isAllowed);
        setAccessChecked(true);
        setDailySummary((current) => ({
          ...current,
          lineCode: response.data?.lineCode || current.lineCode || "-",
        }));

        if (!isAllowed) {
          SweetAlert({
            title: "Process Access Denied",
            text: "You are not registered for this process.",
            icon: "warning",
          });
        } else {
          loadDailySummary().catch((summaryError) => {
            Toast.error(summaryError.message || "Failed to load double check summary");
          });
          focusScanInput();
        }
      } catch (error) {
        if (!active) return;
        setAllowed(false);
        setAccessChecked(true);
        Toast.error(error.message || "Failed to check process access");
      } finally {
        if (active) setLoading(false);
      }
    };

    checkAccess();

    return () => {
      active = false;
      stopVoice();
    };
  }, [focusScanInput, loadDailySummary, stopVoice]);

  const qtyOk = useMemo(
    () => Math.max(Number(scan.qtyBox || 0) - Number(scan.qtyNg || 0), 0),
    [scan.qtyBox, scan.qtyNg]
  );

  const updateThreeDigitField = (field, value) => {
    const nextValue = String(value || "").replace(/\D/g, "").slice(0, 3);
    const expectedField = field === "deviceNo" ? "expectedDeviceNo" : "expectedCertMark";
    const label = field === "deviceNo" ? "Device Number" : "Certificate Mark";
    const expectedValue = String(scan[expectedField] || "000");

    if (nextValue.length === 3 && nextValue !== expectedValue) {
      Toast.error(`${label} does not match kanban master (${expectedValue})`);
    }

    setScan((current) => ({ ...current, [field]: nextValue }));
  };

  const updateQtyNg = (value) => {
    const qtyBox = Number(scan.qtyBox || 0);
    const nextQty = Math.max(0, Number(value || 0));

    if (nextQty > qtyBox) {
      Toast.error("NG quantity cannot be greater than Qty");
      setScan((current) => ({ ...current, qtyNg: qtyBox }));
      return;
    }

    setScan((current) => ({ ...current, qtyNg: value }));
  };

  const updateQty = (value) => {
    const nextQty = Math.max(0, Number(value || 0));
    const currentNg = Number(scan.qtyNg || 0);

    setScan((current) => ({
      ...current,
      qtyBox: value,
      qtyNg: currentNg > nextQty ? nextQty : current.qtyNg,
    }));
  };

  const validateBeforeSubmit = () => {
    if (!Number.isFinite(Number(scan.qtyBox)) || Number(scan.qtyBox) <= 0) {
      Toast.error("Qty must be greater than 0");
      return false;
    }

    if (Number(scan.qtyNg || 0) > Number(scan.qtyBox || 0)) {
      Toast.error("NG quantity cannot be greater than Qty");
      return false;
    }

    if (!/^\d{3}$/.test(String(scan.deviceNo || ""))) {
      Toast.error("Device Number must be 3 digits");
      return false;
    }

    if (String(scan.deviceNo || "") !== String(scan.expectedDeviceNo || "000")) {
      Toast.error(`Device Number does not match kanban master (${scan.expectedDeviceNo || "000"})`);
      return false;
    }

    if (!/^\d{3}$/.test(String(scan.certMark || ""))) {
      Toast.error("Certificate Mark must be 3 digits");
      return false;
    }

    if (String(scan.certMark || "") !== String(scan.expectedCertMark || "000")) {
      Toast.error(`Certificate Mark does not match kanban master (${scan.expectedCertMark || "000"})`);
      return false;
    }

    return true;
  };

  const performScan = useCallback(async (qrText) => {
    if (!allowed) return;
    const cleanedQr = String(qrText || "").trim();
    if (!cleanedQr) {
      Toast.error("Scan QR first");
      return;
    }

    try {
      setLoading(true);
      stopVoice();
      const response = await fetchData("double-check/scan", { qrText: cleanedQr }, "POST");
      if (response.error) throw new Error(response.message || "Kanban not found");

      const data = response.data || {};
      setScan({
        ...emptyScan,
        ...data,
        expectedDeviceNo: data.deviceNo || "000",
        expectedCertMark: data.certMark || "000",
        deviceNo: "",
        certMark: "",
        qtyNg: 0,
        qtyOk: data.qtyBox || 0,
      });
      setScanText(data.qrText || cleanedQr);
      playVoice(data.sequenceCheckVoicePath);
    } catch (error) {
      setScan(emptyScan);
      lastScannedRef.current = "";
      setScanText("");
      focusScanInput();
      Toast.error(error.message || "Kanban not found");
    } finally {
      setLoading(false);
    }
  }, [allowed, focusScanInput, playVoice, stopVoice]);

  useEffect(() => {
    const cleanedQr = scanText.trim();
    if (!allowed || loading || saving || cleanedQr.length !== 13 || lastScannedRef.current === cleanedQr) return;

    lastScannedRef.current = cleanedQr;
    performScan(cleanedQr);
  }, [allowed, loading, performScan, saving, scanText]);

  useEffect(() => {
    if (allowed && accessChecked && !loading && !saving && !scan.kanbanNo) {
      focusScanInput();
    }
  }, [accessChecked, allowed, focusScanInput, loading, saving, scan.kanbanNo]);

  const handleSubmit = async () => {
    if (!allowed || !scan.kanbanNo) {
      Toast.error("Scan QR first");
      return;
    }

    if (!validateBeforeSubmit()) return;

    try {
      setSaving(true);
      stopVoice();
      const response = await fetchData(
        "double-check/submit",
        {
          ...scan,
          qtyOk,
          qrText: scan.qrText || scanText,
        },
        "POST"
      );
      if (response.error) throw new Error(response.message || "Failed to save double check");

      const logResponse = await createActionLog({
        action: "CREATE",
        oldValue: null,
        newValue: `Double Check: Kanban ${scan.kanbanNo}, Total ${scan.qtyBox}, OK ${qtyOk}, NG ${scan.qtyNg}`,
      });

      if (logResponse.error) {
        throw new Error(logResponse.message || "Double check saved, but action log failed");
      }

      Toast.success(response.message || "Double check saved");
      await loadDailySummary();
      resetForNextScan();
    } catch (error) {
      Toast.error(error.message || "Failed to save double check");
    } finally {
      setSaving(false);
    }
  };

  const formDisabled = !allowed || !accessChecked || loading || saving;

  return (
    <>
      <Loading loading={loading || saving} message={saving ? "Saving double check..." : "Loading data..."} />
      <Breadcrumb title="Double Check" items={[]} />

      <div
        className="double-check-page d-flex flex-column"
        style={{ height: "calc(100vh - 112px)", minHeight: 0, overflow: "hidden" }}
      >
        <style>{`
          .double-check-page .mb-3 { margin-bottom: 0.45rem !important; }
          .double-check-page .form-label { margin-bottom: 2px !important; }
          .double-check-page .form-text { display: none; }
          @media (max-width: 1199.98px) {
            .double-check-page { height: auto !important; overflow: visible !important; }
          }
        `}</style>

        <div className="card border-0 shadow-sm flex-shrink-0">
          <div className="card-body p-3">
            <div className="row g-3 align-items-stretch">
              <div className="col-xl-9 col-lg-8">
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="row align-items-end g-2">
                    <div className="col-xl-5 col-lg-12">
                      <Input
                        label="Scan Barcode"
                        name="scanQr"
                        id="scanQr"
                        value={scanText}
                        onChange={(e) => setScanText(e.target.value)}
                        placeholder="Scan Barcode here"
                        disabled={formDisabled || Boolean(scan.kanbanNo)}
                        autoComplete="off"
                        size="lg"
                      />
                    </div>
                    <div className="col-xl-3 col-lg-4">
                      <Input label="Kanban No" name="kanbanNo" value={scan.kanbanNo} disabled />
                    </div>
                    <div className="col-xl-2 col-lg-4">
                      <Input
                        label="Qty"
                        name="qtyBox"
                        type="number"
                        value={scan.qtyBox}
                        disabled={formDisabled || !scan.kanbanNo}
                        onChange={(e) => updateQty(e.target.value)}
                      />
                    </div>
                    <div className="col-xl-2 col-lg-4">
                      <Input
                        label="Qty NG"
                        name="qtyNg"
                        type="number"
                        value={scan.qtyNg}
                        disabled={formDisabled || !scan.kanbanNo}
                        onChange={(e) => updateQtyNg(e.target.value)}
                      />
                    </div>
                  </div>
                </form>

                <div className="row g-2 align-items-end">
                  <div className="col-xl-2 col-lg-4">
                    <Input label="Qty OK" name="qtyOk" value={qtyOk} disabled />
                  </div>
                  <div className="col-xl-3 col-lg-4">
                    <Input
                      label="Device Number"
                      name="deviceNo"
                      value={scan.deviceNo}
                      disabled={formDisabled || !scan.kanbanNo}
                      maxLength={3}
                      onChange={(e) => updateThreeDigitField("deviceNo", e.target.value)}
                    />
                  </div>
                  <div className="col-xl-3 col-lg-4">
                    <Input
                      label="Certificate Mark"
                      name="certMark"
                      value={scan.certMark}
                      disabled={formDisabled || !scan.kanbanNo}
                      maxLength={3}
                      onChange={(e) => updateThreeDigitField("certMark", e.target.value)}
                    />
                  </div>
                  <div className="col-xl-4 col-lg-12 d-flex justify-content-end gap-2 mb-2">
                    <Button
                      classType="primary"
                      iconName="check"
                      label={saving ? "Saving..." : "Submit Double Check"}
                      onClick={handleSubmit}
                      isDisabled={formDisabled || !scan.kanbanNo}
                    />
                    <Button
                      classType="secondary"
                      iconName="arrow-clockwise"
                      label="Reset"
                      onClick={resetForNextScan}
                      isDisabled={!allowed || saving}
                    />
                  </div>
                </div>
              </div>

              <div className="col-xl-3 col-lg-4">
                <div className="row g-2 h-100">
                  <div className="col-12">
                    <div className="border rounded-2 px-3 py-2 h-100">
                      <div className="text-secondary" style={{ fontSize: 11 }}>Current Line</div>
                      <div className="fw-semibold" style={{ fontSize: 17 }}>{dailySummary.lineCode || "-"}</div>
                    </div>
                  </div>
                  <div className="col-6 col-lg-12">
                    <div className="border rounded-2 px-3 py-2 h-100">
                      <div className="text-secondary" style={{ fontSize: 11 }}>Today Line Qty</div>
                      <div className="fw-semibold" style={{ fontSize: 17 }}>{formatNumber(dailySummary.lineQty)}</div>
                    </div>
                  </div>
                  <div className="col-6 col-lg-12">
                    <div className="border rounded-2 px-3 py-2 h-100">
                      <div className="text-secondary" style={{ fontSize: 11 }}>Today All Line Qty</div>
                      <div className="fw-semibold" style={{ fontSize: 17 }}>{formatNumber(dailySummary.allLineQty)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-2 g-2 flex-grow-1" style={{ minHeight: 0 }}>
          <div className="col-xl-6 h-100" style={{ minHeight: 0 }}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-2 h-100" style={{ minHeight: 0 }}>
                <DocumentViewer title="Instruction Work" path={scan.instructionWorkPath} />
              </div>
            </div>
          </div>
          <div className="col-xl-6 h-100" style={{ minHeight: 0 }}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-2 h-100" style={{ minHeight: 0 }}>
                <DocumentViewer title="Sequence Check" path={scan.sequenceCheckPath} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
