"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/component/common/Breadcrumb";
import Button from "@/component/common/Button";
import Input from "@/component/common/Input";
import Loading from "@/component/common/Loading";
import Toast from "@/component/common/Toast";
import OqcLabelCanvas from "@/component/oqc/OqcLabelCanvas";
import { createActionLog } from "@/lib/actionLog";
import fetchData from "@/lib/fetch";
import { encryptIdUrl } from "@/lib/encryptor";

const chunk = (items, size) => {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

const emptyForm = {
  no: "",
  lotNo: "",
  qtyBox: 0,
  qtyPlan: 0,
  totalLabel: 0,
  totalA4: 1,
  partNumber: "",
};

export default function AddOQCPage() {
  const router = useRouter();
  const [dataKanban, setDataKanban] = useState([]);
  const [kanbanDisplay, setKanbanDisplay] = useState("");
  const [colorDisplay, setColorDisplay] = useState("-");
  const [dataPartNumber, setDataPartNumber] = useState([]);
  const [partNumberDisplay, setPartNumberDisplay] = useState("");
  const [isSpecialKanban, setIsSpecialKanban] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const resetLinkedFields = useCallback((keepLot = true) => {
    setColorDisplay("-");
    setKanbanDisplay("");
    setDataPartNumber([]);
    setPartNumberDisplay("");
    setIsSpecialKanban(false);
    setPreviewData(null);
    setForm((prev) => ({
      ...emptyForm,
      lotNo: keepLot ? prev.lotNo : "",
    }));
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const lotResponse = await fetchData("matrix/generate-lot", {}, "GET");
      if (lotResponse.error) throw new Error(lotResponse.message || "Failed to generate lot.");

      const kanbanResponse = await fetchData("/kanbans/dropdown-list", {}, "GET");
      if (kanbanResponse.error) throw new Error(kanbanResponse.message || "Failed to load kanban.");

      setDataKanban(kanbanResponse.data || []);
      setForm((prev) => ({ ...prev, lotNo: lotResponse.data?.Lot || "" }));
    } catch (error) {
      Toast.error(error.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPartNumber = useCallback(async (kanbanNo) => {
    if (!kanbanNo) {
      setDataPartNumber([]);
      return [];
    }

    const response = await fetchData("/kanbans/dropdown-list-part-number", { Id: kanbanNo }, "POST");
    if (response.error) throw new Error(response.message || "Failed to load part number.");

    const rows = response.data || [];
    setDataPartNumber(rows);
    return rows;
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      loadData();
    });
  }, [loadData]);

  const handleGeneratePreview = async () => {
    if (!form.no) {
      Toast.error("Select a kanban first.");
      return;
    }

    if (!form.partNumber) {
      Toast.error("Part number is required.");
      return;
    }

    if (!Number(form.qtyPlan) || Number(form.qtyPlan) <= 0) {
      Toast.error("Quantity must be greater than 0.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetchData("oqcs/preview", form, "POST");
      if (response.error) throw new Error(response.message || "Failed to preview OQC label.");

      setPreviewData(response.data);
      setForm((prev) => ({
        ...prev,
        qtyBox: response.data.qtyBox,
        totalLabel: response.data.totalLabel,
        totalA4: response.data.totalA4,
        partNumber: response.data.partNumber || prev.partNumber,
      }));
      setPreviewOpen(true);
    } catch (error) {
      Toast.error(error.message || "Failed to preview OQC.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmGenerate = async () => {
    if (!previewData) return;

    try {
      setSaving(true);
      const response = await fetchData("oqcs", form, "POST");
      if (response.error) throw new Error(response.message || "Failed to create oqc label.");

      const logResponse = await createActionLog({
        action: "CREATE",
        oldValue: null,
        newValue: `OQC: ${response.data?.No || form.no}, Total Label: ${previewData.totalLabel}`,
      });

      if (logResponse.error) throw new Error("OQC created successfully. Action log could not be saved.");

      Toast.success("OQC created successfully.");
      router.push(`/pages/oqc/print/${encryptIdUrl(response.data?.Id)}`);
    } catch (error) {
      Toast.error(error.message || "Failed to create OQC.");
    } finally {
      setSaving(false);
    }
  };

  const labelPages = useMemo(() => chunk(previewData?.labels || [], 16), [previewData]);

  return (
    <>
      <Loading loading={loading || saving} message={saving ? "Saving data..." : "Loading data..."} />

      <Breadcrumb
        title="Generate Ongoing Quality Control Labels"
        items={[
          { label: "Ongoing Quality Control Labels", href: "/pages/oqc" },
          { label: "Generate" },
        ]}
      />

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3">
            <h6 className="mb-0" style={{ fontSize: 14, fontWeight: 600 }}>Production Data</h6>
          </div>

          <div className="row">
            <div className="col-lg-3">
              <Input label="Production Date" value={new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" })} disabled />
            </div>
            <div className="col-lg-3">
              <Input label="LOT" value={form.lotNo} disabled />
            </div>
            <div className="col-lg-3">
              <Input
                label="Kanban"
                type="lov"
                value={kanbanDisplay}
                lovData={dataKanban}
                lovColumns={[
                  { key: "No", label: "No." },
                  { key: "CustomerName", label: "Customer" },
                  { key: "QtyBox", label: "Qty/box" },
                  { key: "ColorName", label: "Color" },
                ]}
                lovValueColumn="No"
                lovDisplayColumn="No"
                helperText="To appear in this LoV, the kanban must be active, have Customer, Color, Qty/Box greater than 0, and the Customer must have Supplier and QR Format."
                onLovSelect={async (row, value, display) => {
                  if (!value) {
                    resetLinkedFields(true);
                    return;
                  }

                  const selectedIsSpecial = Number(row?.IsSpecial || 0) === 1;
                  setIsSpecialKanban(selectedIsSpecial);
                  setColorDisplay(row.ColorName || "-");
                  setKanbanDisplay(display || value);

                  setForm((prev) => ({
                    ...prev,
                    no: value || "",
                    qtyBox: Number(row?.QtyBox || 0),
                    qtyPlan: 0,
                    totalLabel: 0,
                    totalA4: 1,
                    partNumber: "",
                  }));

                  setPartNumberDisplay("");
                  setPreviewData(null);

                  try {
                    const partRows = await loadPartNumber(value);

                    if (!selectedIsSpecial) {
                      const latest = partRows?.[0];
                      if (latest) {
                        setPartNumberDisplay(latest.PartNumber || "");
                        setForm((prev) => ({ ...prev, partNumber: latest.PartNumber || "" }));
                      }
                    }
                  } catch (error) {
                    Toast.error(error.message || "Failed to load part number.");
                  }
                }}
              />
            </div>
            <div className="col-lg-3">
              <Input label="Color" value={colorDisplay} disabled />
            </div>
          </div>

          <div className="row">
            <div className="col-lg-6">
              <Input
                label="Part Number"
                type="lov"
                value={partNumberDisplay}
                lovData={dataPartNumber}
                lovColumns={[
                  { key: "PartNumber", label: "Part Number" },
                  { key: "PartDesc", label: "Description" },
                  { key: "LatestDate", label: "Latest Date" },
                ]}
                lovValueColumn="PartNumber"
                lovDisplayColumn="PartNumber"
                disabled={!form.no || !isSpecialKanban}
                helperText={!form.no ? "Select a kanban first" : isSpecialKanban ? "Special kanban: part number can be selected" : "Non-special kanban: latest part number is selected automatically"}
                onLovSelect={(row, value, display) => {
                  setPartNumberDisplay(display || "");
                  setForm((prev) => ({ ...prev, partNumber: value || "" }));
                  setPreviewData(null);
                }}
              />
            </div>
            <div className="col-lg-3">
              <Input label="Qty / Box" value={form.qtyBox} disabled />
            </div>
            <div className="col-lg-3">
              <Input
                label="Quantity"
                type="number"
                value={form.qtyPlan}
                onChange={(e) => {
                  const qty = Number(e.target.value || 0);
                  const qtyBox = Number(form.qtyBox || 1);
                  const totalLabel = qty > 0 ? Math.ceil(qty / qtyBox) : 0;
                  const totalA4 = totalLabel > 0 ? Math.ceil(totalLabel / 16) : 1;

                  setForm((prev) => ({ ...prev, qtyPlan: e.target.value, totalLabel, totalA4 }));
                  setPreviewData(null);
                }}
              />
            </div>
          </div>

          <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3 mt-2">
            <h6 className="mb-0" style={{ fontSize: 14, fontWeight: 600 }}>Calculation Result</h6>
          </div>

          <div className="row">
            <div className="col-lg-3">
              <Input label="Total Label" value={form.totalLabel} disabled />
            </div>
            <div className="col-lg-3">
              <Input label="Lembar Kertas A4" value={form.totalA4} disabled />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-3">
            <Button classType="secondary" iconName="arrow-left" label="Back" onClick={() => router.push("/pages/oqc")} />
            <Button classType="primary" iconName="qr-code" label="Generate Preview" onClick={handleGeneratePreview} />
          </div>
        </div>
      </div>

      {previewOpen && previewData && (
        <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(26, 26, 26, 0.35)" }}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title" style={{ fontSize: 16 }}>Preview OQC Label</h5>
                  <p className="text-secondary mb-0" style={{ fontSize: 13 }}>
                    Preview before generating. Total label: {previewData.totalLabel}, A4: {previewData.totalA4}
                  </p>
                </div>
                <button type="button" className="btn-close" onClick={() => setPreviewOpen(false)} />
              </div>
              <div className="modal-body" style={{ background: "#f5f5f5" }}>
                <div className="alert alert-warning border-0 shadow-sm mb-3" style={{ fontSize: 13 }}>
                  <div className="fw-semibold mb-1">Prepare the correct paper color before printing.</div>
                  <div>
                    Use <span className="fw-semibold">{colorDisplay || "-"}</span> paper according to the selected kanban color data.
                  </div>
                </div>
                {labelPages.map((page, pageIndex) => (
                  <div key={`page-${pageIndex}`} className="mb-4 p-3 bg-white border rounded-3">
                    <div className="mb-2 fw-semibold" style={{ fontSize: 13 }}>Page {pageIndex + 1}</div>
                    <div className="d-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                      {page.map((label) => (
                        <div key={label.seq} className="border p-1" style={{ background: "transparent", aspectRatio: "69 / 48" }}>
                          <OqcLabelCanvas label={label} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <Button classType="secondary" iconName="x" label="Close" onClick={() => setPreviewOpen(false)} />
                <Button classType="primary" iconName="check" label={saving ? "Processing..." : "Confirm Generate"} isDisabled={saving} onClick={handleConfirmGenerate} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}





