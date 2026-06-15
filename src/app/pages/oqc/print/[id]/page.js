"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Breadcrumb from "@/component/common/Breadcrumb";
import Button from "@/component/common/Button";
import Toast from "@/component/common/Toast";
import Loading from "@/component/common/Loading";
import OqcLabelCanvas from "@/component/oqc/OqcLabelCanvas";
import fetchData from "@/lib/fetch";

const chunk = (items, size) => {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

export default function OqcPrintPage() {
  const router = useRouter();
  const params = useParams();
  const encryptedId = params?.id;
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!encryptedId) {
      router.replace("/pages/oqc");
      return;
    }

    let isActive = true;
    const load = async () => {
      try {
        setLoading(true);
        const response = await fetchData(`oqcs/${encryptedId}/preview`, {}, "GET");
        if (!isActive) return;

        if (response.error) {
          Toast.error(response.message || "Preview data was not found");
          router.replace("/pages/oqc");
          return;
        }

        setPreviewData(response.data);
      } catch {
        if (!isActive) return;
        Toast.error("Failed to load print data.");
        router.replace("/pages/oqc");
      } finally {
        if (isActive) setLoading(false);
      }
    };

    load();
    return () => {
      isActive = false;
    };
  }, [encryptedId, router]);

  const labelPages = useMemo(() => chunk(previewData?.labels || [], 16), [previewData]);

  return (
    <>
      <Loading loading={loading} message="Loading print data..." />
      <div className="no-print">
        <Breadcrumb title="Print Ongoing Quality Control Labels" items={[{ label: "Ongoing Quality Control Labels", href: "/pages/oqc" }, { label: "Print" }]} />
        <div className="d-flex justify-content-end gap-2 mb-3">
          <Button classType="secondary" iconName="arrow-left" label="Back" onClick={() => router.push("/pages/oqc")} />
          <Button classType="primary" iconName="printer" label="Print" onClick={() => window.print()} />
        </div>
      </div>

      <style>{`
        @page { size: A4 landscape; margin: 6mm; }
        html, body { margin: 0; padding: 0; }
        .print-sheet { width: 285mm; min-height: 198mm; margin: 0 auto; page-break-after: always; overflow: hidden; }
        .label-grid { display: grid; grid-template-columns: repeat(4, 69mm); grid-auto-rows: 48mm; column-gap: 2mm; row-gap: 2mm; justify-content: center; }
        .label-item { width: 69mm; height: 48mm; box-sizing: border-box; background: transparent; }
        #oqc-print-root { position: relative; z-index: 10; }
        @media print {
          body * { visibility: hidden !important; }
          #oqc-print-root, #oqc-print-root * { visibility: visible !important; }
          #oqc-print-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: transparent;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div id="oqc-print-root">
        {!loading && labelPages.map((page, pageIndex) => (
          <div key={`print-page-${pageIndex}`} className="print-sheet">
            <div className="label-grid">
              {page.map((label) => (
                <div key={label.seq} className="label-item">
                  <OqcLabelCanvas label={label} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
