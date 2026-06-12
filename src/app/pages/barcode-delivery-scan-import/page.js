"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as FaIcons from "react-icons/fa";
import Breadcrumb from "@/component/common/Breadcrumb";
import Button from "@/component/common/Button";
import DropDown from "@/component/common/Dropdown";
import Formsearch from "@/component/common/Formsearch";
import Loading from "@/component/common/Loading";
import Paging from "@/component/common/Paging";
import Table from "@/component/common/Table";
import Toast from "@/component/common/Toast";
import { createActionLog } from "@/lib/actionLog";
import fetchData from "@/lib/fetch";

const sortOptions = [
  { Value: "bds_ship_date DESC", Text: "Ship Date [↓]" },
  { Value: "bds_ship_date ASC", Text: "Ship Date [↑]" },
  { Value: "bds_po_no ASC", Text: "PO No [↑]" },
  { Value: "bds_po_no DESC", Text: "PO No [↓]" },
  { Value: "kbn_no ASC", Text: "Kanban [↑]" },
  { Value: "kbn_no DESC", Text: "Kanban [↓]" },
];

const statusOptions = [
  { Value: "0", Text: "Open" },
  { Value: "1", Text: "Done" },
];

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function BarcodeDeliveryScanImportPage() {
  const sortRef = useRef();
  const statusRef = useRef();
  const shipDateRef = useRef();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(sortOptions[0].Value);
  const [status, setStatus] = useState("");
  const [shipDate, setShipDate] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [menuIcon, setMenuIcon] = useState("FaRegCircle");

  const loadData = useCallback(async (page, sort, keyword, statusValue, shipDateValue) => {
    try {
      setLoading(true);
      const response = await fetchData(
        "barcode-delivery-scans",
        {
          Keyword: keyword,
          Status: statusValue,
          ShipDate: shipDateValue,
          Urut: sort,
          PageNumber: page,
          PageSize: pageSize,
        },
        "GET"
      );

      if (response.error) throw new Error(response.message || "Failed to load barcode delivery scan data");

      const data = response.data?.data || [];
      setRows(
        data.map((item, index) => ({
          No: (page - 1) * pageSize + index + 1,
          id: item.Id,
          "Ship Date": formatDate(item.ShipDate),
          "Ship No": item.ShipNo,
          "S/O No": item.SoNo,
          "P/O No": item.PoNo,
          Kanban: item.KanbanNo,
          Customer: item.CustomerName || item.CustomerCode,
          "Qty/Box": item.QtyPerBox,
          "Box Qty": item.BoxQty,
          Status: item.Status === 1 ? "DONE" : "OPEN",
          "Created By": item.CreatedBy,
          Alignment: ["center", "center", "center", "center", "center", "center", "left", "end", "end", "center", "left"],
        }))
      );
      setTotalData(response.data?.totalData || 0);
      setCurrentPage(page);
    } catch (error) {
      Toast.error(error.message || "Failed to load barcode delivery scan data");
      setRows([]);
      setTotalData(0);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    queueMicrotask(() => {
      loadData(1, sortBy, search, status, shipDate);
    });
  }, [loadData, search, shipDate, sortBy, status]);

  useEffect(() => {
    let isActive = true;

    fetchData("/auth/session", {}, "GET").then((response) => {
      if (!isActive || response.error) return;

      const menu = (response.data?.menus || []).find((item) => item.path === "/pages/barcode-delivery-scan-import");
      setMenuIcon(menu?.icon || "FaRegCircle");
    });

    return () => {
      isActive = false;
    };
  }, []);

  const handleSearch = (query) => {
    setSearch(query);
    loadData(1, sortBy, query, status, shipDate);
  };

  const handleFilterApply = () => {
    const nextSort = sortRef.current.value;
    const nextStatus = statusRef.current.value;
    const nextShipDate = shipDateRef.current.value;

    setSortBy(nextSort);
    setStatus(nextStatus);
    setShipDate(nextShipDate);
    loadData(1, nextSort, search, nextStatus, nextShipDate);
  };

  const handleNavigation = (page) => {
    loadData(page, sortBy, search, status, shipDate);
  };

  const handleOpenImport = () => {
    setImportFile(null);
    setShowImportModal(true);
  };

  const handleCloseImport = () => {
    setShowImportModal(false);
    setImportFile(null);
  };

  const handleImport = async () => {
    if (!importFile) {
      Toast.error("Choose an Excel file first");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", importFile);

      const response = await fetchData("barcode-delivery-scans/import", formData, "POST", true);
      if (response.error) throw new Error(response.message || "Failed to import barcode delivery scan");

      const logResponse = await createActionLog({
        action: "IMPORT",
        oldValue: null,
        newValue: `BDS import ${importFile.name}: ${response.data?.imported || 0} rows`,
        menuPath: "/pages/barcode-delivery-scan-import",
      });

      if (logResponse.error) throw new Error(logResponse.message || "Import saved, but action log failed");

      Toast.success(response.message || "Barcode delivery scan imported successfully");
      handleCloseImport();
      await loadData(1, sortBy, search, status, shipDate);
    } catch (error) {
      Toast.error(error.message || "Failed to import barcode delivery scan");
    } finally {
      setLoading(false);
    }
  };

  const filterContent = useMemo(
    () => (
      <>
        <DropDown ref={sortRef} arrData={sortOptions} type="choose" label="Sorting" forInput="sortBy" defaultValue={sortBy} />
        <DropDown ref={statusRef} arrData={statusOptions} type="all" label="Status" forInput="status" defaultValue={status} />
        <div>
          <label className="form-label" style={{ fontSize: 13 }}>Ship Date</label>
          <input
            ref={shipDateRef}
            className="form-control rounded-2"
            type="date"
            defaultValue={shipDate}
            style={{ fontSize: 13, height: 38 }}
          />
        </div>
      </>
    ),
    [shipDate, sortBy, status]
  );

  const PageMenuIcon = FaIcons[menuIcon] || FaIcons.FaRegCircle;

  return (
    <>
      <Loading loading={loading} message="Loading barcode delivery scan..." />
      <Breadcrumb title="Delivery" items={[]} />

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
              <PageMenuIcon size={16} />
            </div>
            <div>
              <h6 className="mb-1" style={{ fontSize: 14 }}>
                Delivery Overview
              </h6>
              <p className="text-secondary mb-0" style={{ fontSize: 13, lineHeight: 1.6 }}>
                Import daily delivery scan plans from Excel into the barcode delivery scan transaction table.
                Imported rows become the scan targets used by logistics inspectors to validate PIK, customer,
                and OQC barcodes against the selected shipment date, purchase order, and kanban.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Formsearch
        onSearch={handleSearch}
        onFilter={handleFilterApply}
        searchPlaceholder="Search delivery scan data"
        showAddButton={false}
        showExportButton={false}
        showImportButton
        importButtonText="Import"
        onImport={handleOpenImport}
        filterContent={filterContent}
      />

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <Table size="Small" data={rows} />
          {totalData > 0 && (
            <div className="p-3 border-top">
              <Paging pageSize={pageSize} pageCurrent={currentPage} totalData={totalData} navigation={handleNavigation} />
            </div>
          )}
        </div>
      </div>

      {showImportModal && (
        <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(26, 26, 26, 0.35)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title" style={{ fontSize: 16 }}>Import Barcode Delivery Scan</h5>
                  <p className="text-secondary mb-0" style={{ fontSize: 13 }}>Import daily delivery scan plan from Excel.</p>
                </div>
                <button type="button" className="btn-close" aria-label="Close" onClick={handleCloseImport} />
              </div>
              <div className="modal-body">
                <div
                  className="border rounded-3 p-3 mt-3"
                  style={{
                    background: "#f8fafc",
                  }}
                >
                  <div className="row g-3 align-items-start">
                    <div className="col-lg-5">
                      <label className="form-label" style={{ fontSize: 13 }}>
                        Excel - Barcode Delivery Scan
                      </label>

                      <input
                        className="form-control rounded-2"
                        name="file"
                        type="file"
                        accept=".xlsx"
                        onChange={(event) => setImportFile(event.target.files?.[0] || null)}
                        style={{ fontSize: 13, height: 38 }}
                      />

                      {importFile && (
                        <div className="form-text" style={{ fontSize: 12 }}>
                          {importFile.name}
                        </div>
                      )}
                    </div>

                    <div className="col-lg-7">
                      <div className="fw-semibold mb-2" style={{ fontSize: 13 }}>
                        Import Guide
                      </div>

                      <div
                        className="text-secondary"
                        style={{
                          fontSize: 12,
                          lineHeight: 1.6,
                        }}
                      >
                        Daily plan Excel must contain the required delivery columns in the first row.
                        Draw No is formatted to{" "}
                        <span className="fw-semibold text-dark">0000</span>{" "}
                        before saving as kanban number, and each import inserts new daily plan rows.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <Button classType="secondary" iconName="x" label="Cancel" onClick={handleCloseImport} />
                <Button classType="primary" iconName="cloud-arrow-up" label="Import" onClick={handleImport} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
