"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Breadcrumb from "@/component/common/Breadcrumb";
import Button from "@/component/common/Button";
import Input from "@/component/common/Input";
import Loading from "@/component/common/Loading";
import Paging from "@/component/common/Paging";
import Table from "@/component/common/Table";
import Toast from "@/component/common/Toast";
import { createActionLog } from "@/lib/actionLog";
import fetchData from "@/lib/fetch";

const InfoItem = ({ label, value }) => (
  <div className="col-md-3 col-sm-6 mb-3">
    <div className="text-secondary mb-1" style={{ fontSize: 12 }}>
      {label}
    </div>
    <div className="fw-semibold" style={{ fontSize: 13 }}>
      {value || "-"}
    </div>
  </div>
);

export default function DetailSupplierPage() {
  const router = useRouter();
  const params = useParams();
  const encryptedId = params?.id;

  const [supplier, setSupplier] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => {
    if (!encryptedId) {
      router.replace("/pages/supplier");
      return;
    }

    let isActive = true;

    const loadData = async () => {
      setLoading(true);

      const response = await fetchData(`suppliers/${encryptedId}/detail`, {}, "GET");

      if (!isActive) return;

      setLoading(false);

      if (response.error) {
        Toast.error(response.message || "Supplier not found");
        router.replace("/pages/supplier");
        return;
      }

      const detail = response.data || {};
      setSupplier(detail.supplier || null);
      setSelectedCustomers(Array.isArray(detail.assignedCustomerIds) ? detail.assignedCustomerIds : []);
      setCustomers(
        (detail.customers || []).map((item, index) => ({
          No: index + 1,
          id: item.Id,
          Code: item.Code || "-",
          Name: item.Name || "-",
          Status: item.Status === 1 ? "Active" : "Inactive",
          Alignment: ["center", "center", "left", "center"],
        }))
      );
      setCurrentPage(1);
    };

    loadData();

    return () => {
      isActive = false;
    };
  }, [encryptedId, router]);

  const filteredCustomers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return customers;

    return customers.filter((item) =>
      [item.Code, item.Name, item.Status].some((value) =>
        String(value || "").toLowerCase().includes(keyword)
      )
    );
  }, [customers, search]);

  const pagedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize).map((item, index) => ({
      ...item,
      No: start + index + 1,
    }));
  }, [currentPage, filteredCustomers, pageSize]);

  const handleSearch = (event) => {
    setSearch(event.target.value);
    setCurrentPage(1);
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetchData(`suppliers/${encryptedId}/assign-customers`, { customerIds: selectedCustomers }, "POST");

      if (response.error) {
        throw new Error(response.message);
      }

      const logResponse = await createActionLog({
        action: "UPDATE",
        oldValue: null,
        newValue: `Supplier: ${supplier?.Code || "-"}, Customer assigned: ${selectedCustomers.join(", ") || "-"}`,
      });

      if (logResponse.error) {
        throw new Error(logResponse.message || "Supplier customer saved, but action log failed");
      }

      Toast.success(response.message || "Supplier customer data saved successfully");
      router.push("/pages/supplier");
    } catch (error) {
      Toast.error(error.message || "Failed to save supplier customer data");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Loading loading={loading || saving} message={saving ? "Saving data..." : "Loading data..."} />
      <Breadcrumb
        title="Detail Supplier"
        items={[
          { label: "Suppliers Management", href: "/pages/supplier" },
          { label: "Detail" },
        ]}
      />
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body p-4">
          <div className="row">
            <InfoItem label="Supplier Code" value={supplier?.Code} />
            <InfoItem label="Status" value={supplier?.Status === 1 ? "Active" : "Inactive"} />
            <div className="col-md-6 col-sm-12 mb-3 d-flex justify-content-end align-items-start">
              <Button classType="secondary" iconName="arrow-left" label="Back" onClick={() => router.push("/pages/supplier")} />
            </div>
          </div>
        </div>
      </div>
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom gap-2">
            <div>
              <h6 className="mb-1" style={{ fontSize: 14 }}>
                Customer Assignment
              </h6>
              <p className="text-secondary mb-0" style={{ fontSize: 13 }}>
                Pilih customer untuk supplier ini.
              </p>
            </div>
            <Button classType="primary" iconName="save" label={saving ? "Menyimpan..." : "Simpan"} isDisabled={saving} onClick={handleSave} />
          </div>
          <div className="p-3 border-bottom">
            <div style={{ maxWidth: 360 }}>
              <Input
                label="Search Customer"
                name="searchCustomer"
                type="search"
                value={search}
                onChange={handleSearch}
                placeholder="Search by code, name, or status"
              />
            </div>
          </div>
          <Table
            size="Small"
            data={pagedCustomers}
            enableCheckbox
            initialSelectedIds={selectedCustomers}
            onSelectionChange={setSelectedCustomers}
          />
          {filteredCustomers.length > 0 && (
            <div className="p-3 border-top">
              <Paging
                pageSize={pageSize}
                pageCurrent={currentPage}
                totalData={filteredCustomers.length}
                navigation={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
