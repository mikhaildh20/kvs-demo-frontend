"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Breadcrumb from "@/component/common/Breadcrumb";
import Button from "@/component/common/Button";
import Input from "@/component/common/Input";
import Loading from "@/component/common/Loading";
import Toast from "@/component/common/Toast";
import { createActionLog } from "@/lib/actionLog";
import fetchData from "@/lib/fetch";
import { QR_PLACEHOLDERS, QR_PLACEHOLDER_GUIDE } from "@/lib/qr/qr-placeholders";
import QrService from "@/lib/qr/qr.service";

const SAMPLE_VALUES = {
  PART_NUMBER: "AB-123-CD",
  SUPPLIER: "Y20",
  QTY: "8",
  LOT_NO: "657",
  LOT_DATE: "20260509",
  KBN: "0042",
  SEQ: "9",
};

export default function EditQrFormatPage() {
  const router = useRouter();
  const params = useParams();
  const encryptedId = params?.id;

  const [form, setForm] = useState({ name: "", pattern: "", seqLength: "4" });
  const [original, setOriginal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const preview = useMemo(() => {
    try {
      return QrService.generate({
        pattern: form.pattern,
        seqLength: Number(form.seqLength || 4),
        values: SAMPLE_VALUES,
      });
    } catch {
      return "-";
    }
  }, [form.pattern, form.seqLength]);

  useEffect(() => {
    if (!encryptedId) {
      router.replace("/pages/qr-format");
      return;
    }

    let isActive = true;

    fetchData(`qr-formats/${encryptedId}`, {}, "GET").then((response) => {
      if (!isActive) return;

      setLoading(false);

      if (response.error) {
        Toast.error(response.message || "QR format not found.");
        router.replace("/pages/qr-format");
        return;
      }

      setForm({
        name: response.data?.Name || "",
        pattern: response.data?.Pattern || "",
        seqLength: String(response.data?.SeqLength || 4),
      });
      setOriginal(response.data);
    });

    return () => {
      isActive = false;
    };
  }, [encryptedId, router]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      QrService.validatePattern(form.pattern);
    } catch (error) {
      Toast.error(error.message || "Invalid QR pattern");
      return;
    }

    setSaving(true);

    const response = await fetchData(`qr-formats/${encryptedId}`, {
      name: form.name,
      pattern: form.pattern,
      seqLength: Number(form.seqLength || 4),
    }, "PUT");

    if (response.error) {
      setSaving(false);
      Toast.error(response.message || "Failed to update QR format.");
      return;
    }

    const logResponse = await createActionLog({
      action: "UPDATE",
      oldValue: `QR Format: ${original?.Name || ""}`,
      newValue: `QR Format: ${form.name}`,
    });

    setSaving(false);

    if (logResponse.error) {
      Toast.error("QR format updated successfully. Action log could not be saved.");
      return;
    }

    Toast.success("QR format updated successfully.");
    router.push("/pages/qr-format");
  };

  return (
    <>
      <Loading loading={loading || saving} message={saving ? "Saving data..." : "Loading data..."} />
      <Breadcrumb title="Edit QR Format" items={[{ label: "QR Formats Management", href: "/pages/qr-format" }, { label: "Edit" }]} />
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-lg-4">
                <Input label="Format Name" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={55} />
              </div>
              <div className="col-lg-3">
                <Input label="Seq Length" type="number" name="seqLength" value={form.seqLength} onChange={(e) => setForm({ ...form, seqLength: e.target.value })} required />
              </div>
              <div className="col-lg-12">
                <label className="form-label" style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Pattern</label>
                <textarea
                  className="form-control rounded-2"
                  rows={3}
                  value={form.pattern}
                  onChange={(e) => setForm({ ...form, pattern: e.target.value })}
                  placeholder="Example: {SUPPLIER:7}-{PART_NUMBER:LOWER:NODASH}-{QTY:3}-{SEQ}"
                  required
                  style={{ fontSize: 13 }}
                />
              </div>
            </div>

            <div className="mt-3 border rounded-3 p-3" style={{ background: "#f8fafc" }}>
              <h6 className="mb-2" style={{ fontSize: 14 }}>Placeholder Guide</h6>
              <ul className="mb-2" style={{ fontSize: 12 }}>
                {QR_PLACEHOLDER_GUIDE.map((text) => <li key={text}>{text}</li>)}
              </ul>
              <div className="d-flex flex-wrap gap-2">
                {QR_PLACEHOLDERS.map((item) => (
                  <span key={item.token} className="badge text-bg-light border" title={item.description} style={{ fontSize: 11 }}>{item.token}</span>
                ))}
              </div>
              <div className="mt-2" style={{ fontSize: 12 }}>
                <span className="fw-semibold">Preview sample:</span> {preview}
              </div>
            </div>

            <div className="row mt-4">
              <div className="col-12">
                <div className="d-flex justify-content-end gap-2">
                  <Button classType="secondary" iconName="arrow-left" label="Back" onClick={() => router.push("/pages/qr-format")} />
                  <Button type="submit" classType="primary" iconName={saving ? "" : "save"} label={saving ? "Saving..." : "Save"} isDisabled={saving} />
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
