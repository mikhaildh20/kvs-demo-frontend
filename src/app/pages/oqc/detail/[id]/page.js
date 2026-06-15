"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Breadcrumb from "@/component/common/Breadcrumb";
import Button from "@/component/common/Button";
import Loading from "@/component/common/Loading";
import Toast from "@/component/common/Toast";
import fetchData from "@/lib/fetch";

const Info = ({ label, value }) => (
  <div className="col-lg-4 col-md-6 mb-3">
    <div className="text-secondary" style={{ fontSize: 12 }}>{label}</div>
    <div className="fw-semibold">{value ?? "-"}</div>
  </div>
);

export default function OQCDetailPage() {
  const router = useRouter();
  const params = useParams();
  const encryptedId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const seqStart = Number(detail?.seqStart || detail?.labels?.[0]?.seq || 1);
  const seqEnd = Number(detail?.labels?.[detail?.labels?.length - 1]?.seq || seqStart);

  useEffect(() => {
    const load = async () => {
      if (!encryptedId) {
        router.replace("/pages/oqc");
        return;
      }

      try {
        setLoading(true);
        const response = await fetchData(`oqcs/${encryptedId}/preview`, {}, "GET");
        if (response.error) throw new Error(response.message || "Failed to load OQC detail.");
        setDetail(response.data || null);
      } catch (error) {
        Toast.error(error.message || "Failed to load OQC detail.");
        router.replace("/pages/oqc");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [encryptedId, router]);

  return (
    <>
      <Loading loading={loading} message="Loading detail..." />
      <Breadcrumb title="Ongoing Quality Control Label Detail" items={[{ label: "Ongoing Quality Control Labels", href: "/pages/oqc" }, { label: "Detail" }]} />

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="row">
            <Info label="Kanban Number" value={detail?.no} />
            <Info label="Lot Number" value={detail?.lotNo} />
            <Info label="Part Name" value={detail?.partName} />
            <Info label="Part Number" value={detail?.partNumber} />
            <Info label="Qty / Box" value={detail?.qtyBox} />
            <Info label="Qty Plan" value={detail?.qtyPlan} />
            <Info label="Total Label" value={detail?.totalLabel} />
            <Info label="Total A4" value={detail?.totalA4} />
            <Info label="Sequence Start" value={seqStart} />
            <Info label="Sequence End" value={seqEnd} />
            <Info label="Sequence Range" value={`${seqStart}-${seqEnd}`} />
          </div>

          <div className="d-flex justify-content-end gap-2 mt-2">
            <Button classType="secondary" iconName="arrow-left" label="Back" onClick={() => router.push("/pages/oqc")} />
            <Button classType="primary" iconName="printer" label="Print" onClick={() => router.push(`/pages/oqc/print/${encryptedId}`)} />
          </div>
        </div>
      </div>
    </>
  );
}
