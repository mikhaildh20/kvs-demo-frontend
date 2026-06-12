"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Breadcrumb from "@/component/common/Breadcrumb";
import Button from "@/component/common/Button";
import Loading from "@/component/common/Loading";
import Toast from "@/component/common/Toast";
import { formatDateTime } from "@/lib/dateFormater";
import { decryptIdUrl } from "@/lib/encryptor";
import fetchData from "@/lib/fetch";

const InfoItem = ({ label, value }) => (
  <div className="col-lg-3 col-md-6">
    <div className="text-secondary mb-1" style={{ fontSize: 12 }}>
      {label}
    </div>
    <div className="fw-semibold" style={{ fontSize: 13 }}>
      {value || "-"}
    </div>
  </div>
);

const ValuePanel = ({ title, value }) => (
  <div className="col-lg-6">
    <div className="border rounded-2 h-100 bg-white">
      <div className="border-bottom px-3 py-2 fw-semibold" style={{ fontSize: 13 }}>
        {title}
      </div>
      <pre
        className="mb-0 p-3 text-secondary"
        style={{
          minHeight: 180,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontFamily: "inherit",
          fontSize: 13,
          background: "#f8fafc",
        }}
      >
        {value || "-"}
      </pre>
    </div>
  </div>
);

export default function LogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState(null);

  const loadDetail = useCallback(async () => {
    try {
      setLoading(true);
      const id = decryptIdUrl(params.id);
      if (!id) throw new Error("Action log id is invalid");

      const response = await fetchData(`action-logs/${encodeURIComponent(id)}`, {}, "GET");
      if (response.error) throw new Error(response.message || "Failed to load action log detail");

      setLog(response.data || null);
    } catch (error) {
      Toast.error(error.message || "Failed to load action log detail");
      router.replace("/pages/log");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    queueMicrotask(() => {
      loadDetail();
    });
  }, [loadDetail]);

  return (
    <>
      <Loading loading={loading} message="Loading log detail..." />
      <Breadcrumb title="Action Log Detail" items={[]} />

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body p-3">
          <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
            <div>
              <h5 className="mb-1" style={{ fontSize: 16 }}>
                {log?.Action || "-"}
              </h5>
              <p className="text-secondary mb-0" style={{ fontSize: 13 }}>
                {log?.MenuName || "-"} · {log?.MenuPath || "-"}
              </p>
            </div>
            <Button classType="secondary" iconName="arrow-left" label="Back" onClick={() => router.push("/pages/log")} />
          </div>

          <div className="row g-3">
            <InfoItem label="Log ID" value={log?.Id} />
            <InfoItem label="Menu" value={log?.MenuName} />
            <InfoItem label="Created By" value={log?.CreatedBy} />
            <InfoItem label="Created Date" value={formatDateTime(log?.CreatedDate)} />
          </div>
        </div>
      </div>

      <div className="row g-3">
        <ValuePanel title="Old Value" value={log?.OldValue} />
        <ValuePanel title="New Value" value={log?.NewValue} />
      </div>
    </>
  );
}
