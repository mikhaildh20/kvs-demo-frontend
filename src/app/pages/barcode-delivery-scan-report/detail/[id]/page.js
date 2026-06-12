"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Breadcrumb from "@/component/common/Breadcrumb";
import Button from "@/component/common/Button";
import Input from "@/component/common/Input";
import Loading from "@/component/common/Loading";
import Paging from "@/component/common/Paging";
import Table from "@/component/common/Table";
import Toast from "@/component/common/Toast";
import { decryptIdUrl } from "@/lib/encryptor";
import fetchData from "@/lib/fetch";

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatNumber = (value) => Number(value || 0).toLocaleString("en-US");

const SummaryCard = ({ label, value }) => (
  <div className="col-lg-3 col-md-6">
    <div className="border rounded-2 bg-white p-3 h-100">
      <div className="text-secondary" style={{ fontSize: 12 }}>{label}</div>
      <div className="fw-semibold mt-1" style={{ fontSize: 24 }}>{value}</div>
    </div>
  </div>
);

export default function BarcodeDeliveryScanReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [header, setHeader] = useState({ shipDate: "", poNo: "" });
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const loadDetail = useCallback(async () => {
    try {
      setLoading(true);
      const detailId = decryptIdUrl(params.id);
      if (!detailId) throw new Error("Report detail id is invalid");

      const response = await fetchData(`barcode-delivery-scans/report/${encodeURIComponent(detailId)}`, {}, "GET");
      if (response.error) throw new Error(response.message || "Failed to load report detail");

      setHeader({ shipDate: response.data?.shipDate || "", poNo: response.data?.poNo || "" });
      setRows(response.data?.data || []);
      setCurrentPage(1);
    } catch (error) {
      Toast.error(error.message || "Failed to load report detail");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    queueMicrotask(() => {
      loadDetail();
    });
  }, [loadDetail]);

  const summary = useMemo(() => {
    const totalKanban = rows.length;
    const totalBox = rows.reduce((sum, row) => sum + Number(row.TotalBox || 0), 0);
    const scannedBox = rows.reduce((sum, row) => sum + Number(row.ScannedBox || 0), 0);
    const remainingBox = rows.reduce((sum, row) => sum + Number(row.RemainingBox || 0), 0);

    return { totalKanban, totalBox, scannedBox, remainingBox };
  }, [rows]);

  const tableRows = useMemo(
    () =>
      rows.map((row) => ({
        id: row.Id,
        "Ship Date": formatDate(row.ShipDate),
        "Ship No": row.ShipNo,
        "S/O No": row.SoNo,
        "P/O No": row.PoNo,
        Kanban: row.KanbanNo,
        "Initial Qty": row.TotalBox,
        "Part Number": row.PartNumber,
        "Part Description": row.PartDescription,
        Customer: row.CustomerName,
        "Total Box": row.TotalBox,
        "Scanned Box": row.ScannedBox,
        "Remaining Box": row.RemainingBox,
        Status: row.Status === 1 ? "DONE" : "OPEN",
        Alignment: ["center", "center", "center", "center", "center", "end", "left", "left", "left", "end", "end", "end", "center"],
      })),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return tableRows;

    return tableRows.filter((row) =>
      [
        row["Ship Date"],
        row["Ship No"],
        row["S/O No"],
        row["P/O No"],
        row.Kanban,
        row["Part Description"],
        row["Part Number"],
        row.Customer,
        row.Status,
      ].some((value) => String(value || "").toLowerCase().includes(keyword))
    );
  }, [search, tableRows]);

  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [currentPage, filteredRows, pageSize]);

  const handleSearch = (event) => {
    setSearch(event.target.value);
    setCurrentPage(1);
  };

  return (
    <>
      <Loading loading={loading} message="Loading barcode delivery scan detail..." />
      <Breadcrumb title="Barcode Delivery Scan Detail" items={[]} />

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body p-3 d-flex justify-content-between align-items-center">
          <div>
            <div className="text-secondary" style={{ fontSize: 12 }}>P/O No</div>
            <div className="fw-semibold" style={{ fontSize: 18 }}>{header.poNo || "-"}</div>
            <div className="text-secondary" style={{ fontSize: 13 }}>Ship Date: {formatDate(header.shipDate)}</div>
          </div>
          <Button classType="secondary" iconName="arrow-left" label="Back" onClick={() => router.push("/pages/barcode-delivery-scan-report")} />
        </div>
      </div>

      <div className="row g-3 mb-3">
        <SummaryCard label="Total Kanban" value={formatNumber(summary.totalKanban)} />
        <SummaryCard label="Total Box" value={formatNumber(summary.totalBox)} />
        <SummaryCard label="Scanned Box" value={formatNumber(summary.scannedBox)} />
        <SummaryCard label="Remaining Box" value={formatNumber(summary.remainingBox)} />
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="p-3 border-bottom">
            <div style={{ maxWidth: 360 }}>
              <Input
                label="Search Detail"
                name="searchDetail"
                type="search"
                value={search}
                onChange={handleSearch}
                placeholder="Search kanban, part, customer, or status"
              />
            </div>
          </div>
          <Table size="Small" data={pagedRows} />
          {filteredRows.length > 0 && (
            <div className="p-3 border-top">
              <Paging
                pageSize={pageSize}
                pageCurrent={currentPage}
                totalData={filteredRows.length}
                navigation={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
