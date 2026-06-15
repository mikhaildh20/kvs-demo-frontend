"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Paging from "@/component/common/Paging";
import Table from "@/component/common/Table";
import Toast from "@/component/common/Toast";
import DropDown from "@/component/common/Dropdown";
import Formsearch from "@/component/common/Formsearch";
import { useRouter } from "next/navigation";
import fetchData from "@/lib/fetch";
import { encryptIdUrl } from "@/lib/encryptor";
import Breadcrumb from "@/component/common/Breadcrumb";
import Loading from "@/component/common/Loading";
import Button from "@/component/common/Button";
import OqcLabelCanvas from "@/component/oqc/OqcLabelCanvas";
import { createActionLog } from "@/lib/actionLog";

const chunk = (items, size) => {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

const dataFilterSort = [
  { Value: "kbn_no ASC", Text: "Kanban Number [?]" },
  { Value: "kbn_no DESC", Text: "Kanban Number [?]" },
  { Value: "oqc_lot_no ASC", Text: "Lot Number [?]" },
  { Value: "oqc_lot_no DESC", Text: "Lot Number [?]" },
  { Value: "oqc_creadate ASC", Text: "Production Date [?]" },
  { Value: "oqc_creadate DESC", Text: "Production Date [?]" },
];

const dataFilterStatus = [
  { Value: "0", Text: "Ongoing" },
  { Value: "1", Text: "Double Check" },
  { Value: "2", Text: "Verified" },
];

const statusText = (value) => {
  if (Number(value) === 0) return "Ongoing";
  if (Number(value) === 1) return "Double Check";
  if (Number(value) === 2) return "Verified";
  return "-";
};

export default function OQCPage() {
  const router = useRouter();
  const sortRef = useRef();
  const statusRef = useRef();

  const [dataOQC, setDataOQC] = useState([]);
  const [dataOQCRaw, setDataOQCRaw] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(dataFilterSort[0].Value);
  const [sortStatus, setSortStatus] = useState(dataFilterStatus[0].Value);

  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const [printPreviewData, setPrintPreviewData] = useState(null);
  const [selectedPrintRow, setSelectedPrintRow] = useState(null);

  const loadData = useCallback(async (page, sort, cari, status) => {
    try {
      setLoading(true);
      const response = await fetchData(
        "oqcs",
        {
          Status: status,
          ...(cari === "" ? {} : { Keyword: cari }),
          Urut: sort,
          PageNumber: page,
          PageSize: pageSize,
        },
        "GET"
      );

      if (response.error) {
        throw new Error(response.message);
      }

      const { data = [], totalData: total = 0 } = response.data || {};
      setDataOQCRaw(data);
      setDataOQC(
        data.map((item, index) => ({
          No: (page - 1) * pageSize + index + 1,
          id: item.Id,
          "Kanban Number": item.No,
          "Lot Number": item.LotNo,
          "Sequence Range": item.SeqRange || "-",
          "Production Date": item.Creadate ? new Date(item.Creadate).toLocaleDateString("id-ID") : "-",
          Status: statusText(item.Status),
          Action: ["Detail", "Print"],
          Alignment: ["center", "center", "center", "center", "center", "center", "center"],
        }))
      );
      setTotalData(total);
      setCurrentPage(page);
    } catch (error) {
      Toast.error(error.message || "Failed to load data.");
      setDataOQC([]);
      setTotalData(0);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  const handleSearch = useCallback((query) => {
    setSearch(query);
    loadData(1, sortBy, query, sortStatus);
  }, [loadData, sortBy, sortStatus]);

  const handleFilterApply = useCallback(() => {
    const newSortBy = sortRef.current.value;
    const newStatus = statusRef.current.value;

    setSortBy(newSortBy);
    setSortStatus(newStatus);
    setCurrentPage(1);
    loadData(1, newSortBy, search, newStatus);
  }, [search, loadData]);

  const handleNavigation = useCallback((page) => {
    loadData(page, sortBy, search, sortStatus);
  }, [sortBy, search, sortStatus, loadData]);

  const handleAdd = useCallback(() => {
    router.push("/pages/oqc/add");
  }, [router]);

  const handleDetail = useCallback((id) => router.push(`/pages/oqc/detail/${encryptIdUrl(id)}`), [router]);

  const handlePrint = useCallback(async (id) => {
    const row = dataOQCRaw.find((item) => item.Id === id);
    setSelectedPrintRow(row || null);

    try {
      setLoading(true);
      const response = await fetchData(`oqcs/${encryptIdUrl(id)}/preview`, {}, "GET");
      if (response.error) throw new Error(response.message || "Failed to load print preview.");

      setPrintPreviewData(response.data);
      setPrintPreviewOpen(true);
    } catch (error) {
      Toast.error(error.message || "Failed to load print preview.");
    } finally {
      setLoading(false);
    }
  }, [dataOQCRaw]);

  const handleConfirmPrint = useCallback(async () => {
    if (!printPreviewData) return;

    try {
      setLoading(true);
      const logResponse = await createActionLog({
        action: "PRINT",
        oldValue: null,
        newValue: `OQC Print: ${selectedPrintRow?.No || printPreviewData?.no || "-"}, Total Label: ${printPreviewData?.totalLabel || 0}`,
      });

      if (logResponse.error) throw new Error(logResponse.message || "Print log failed");

      setPrintPreviewOpen(false);
      router.push(`/pages/oqc/print/${encryptIdUrl(selectedPrintRow?.Id || selectedPrintRow?.id)}`);
    } catch (error) {
      Toast.error(error.message || "Failed to save print log.");
    } finally {
      setLoading(false);
    }
  }, [printPreviewData, router, selectedPrintRow]);

  useEffect(() => {
    queueMicrotask(() => {
      loadData(1, sortBy, search, sortStatus);
    });
  }, [loadData, sortBy, search, sortStatus]);

  const filterContent = useMemo(() => (
    <>
      <DropDown ref={sortRef} arrData={dataFilterSort} type="choose" label="Sorting" forInput="sortBy" defaultValue={sortBy} />
      <DropDown ref={statusRef} arrData={dataFilterStatus} type="choose" label="Status" forInput="sortStatus" defaultValue={sortStatus} />
    </>
  ), [sortBy, sortStatus]);

  const labelPages = useMemo(() => chunk(printPreviewData?.labels || [], 16), [printPreviewData]);

  return (
    <>
      <Loading loading={loading} message="loading data..." />
      <Breadcrumb title="Ongoing Quality Control Labels" items={[]} />
      <div>
        <Formsearch
          onSearch={handleSearch}
          onAdd={handleAdd}
          onFilter={handleFilterApply}
          searchPlaceholder="Search OQC data"
          addButtonText="Generate"
          showExportButton={false}
          filterContent={filterContent}
        />
      </div>
      <div className="col-12">
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <Table size="Small" data={dataOQC} onDetail={handleDetail} onPrint={handlePrint} />
            {totalData > 0 && (
              <div className="p-3 border-top">
                <Paging pageSize={pageSize} pageCurrent={currentPage} totalData={totalData} navigation={handleNavigation} />
              </div>
            )}
          </div>
        </div>
      </div>

      {printPreviewOpen && printPreviewData && (
        <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(26, 26, 26, 0.35)" }}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title" style={{ fontSize: 16 }}>Preview Print OQC Label</h5>
                  <p className="text-secondary mb-0" style={{ fontSize: 13 }}>
                    Total label: {printPreviewData.totalLabel}, A4: {printPreviewData.totalA4}
                  </p>
                </div>
                <button type="button" className="btn-close" onClick={() => setPrintPreviewOpen(false)} />
              </div>
              <div className="modal-body" style={{ background: "#f5f5f5" }}>
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
                <Button classType="secondary" iconName="x" label="Close" onClick={() => setPrintPreviewOpen(false)} />
                <Button classType="primary" iconName="printer" label="Confirm Print" onClick={handleConfirmPrint} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


