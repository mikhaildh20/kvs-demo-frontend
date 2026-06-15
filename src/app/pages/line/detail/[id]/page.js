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
    <div className="text-secondary mb-1" style={{ fontSize: 12 }}>{label}</div>
    <div className="fw-semibold" style={{ fontSize: 13 }}>{value || "-"}</div>
  </div>
);

export default function DetailLinePage() {
  const router = useRouter();
  const params = useParams();
  const encryptedId = params?.id;

  const [line, setLine] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => {
    if (!encryptedId) {
      router.replace("/pages/line");
      return;
    }

    let isActive = true;

    const loadData = async () => {
      setLoading(true);
      const response = await fetchData(`lines/${encryptedId}/detail`, {}, "GET");

      if (!isActive) return;
      setLoading(false);

      if (response.error) {
        Toast.error(response.message || "Line not found.");
        router.replace("/pages/line");
        return;
      }

      const detail = response.data || {};
      setLine(detail.line || null);
      setSelectedUsers(Array.isArray(detail.assignedUserIds) ? detail.assignedUserIds : []);

      const mappedUsers = (detail.users || []).map((item, index) => ({
        No: index + 1,
        id: item.Id,
        Fullname: item.Fullname || "-",
        Username: item.Username || "-",
        Status: item.Status === 1 ? "Active" : "Inactive",
        Alignment: ["center", "left", "left", "center"],
      }));

      setUsers(mappedUsers);
      setCurrentPage(1);
    };

    loadData();

    return () => {
      isActive = false;
    };
  }, [encryptedId, router]);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return users;

    return users.filter((item) =>
      [item.Fullname, item.Username, item.Status].some((value) =>
        String(value || "").toLowerCase().includes(keyword)
      )
    );
  }, [search, users]);

  const pagedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize).map((item, index) => ({
      ...item,
      No: start + index + 1,
    }));
  }, [currentPage, filteredUsers, pageSize]);

  const handleSearch = (event) => {
    setSearch(event.target.value);
    setCurrentPage(1);
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetchData(`lines/${encryptedId}/assign-users`, { userIds: selectedUsers }, "POST");
      if (response.error) throw new Error(response.message);

      const logResponse = await createActionLog({
        action: "UPDATE",
        oldValue: null,
        newValue: `Line: ${line?.Code || "-"}, User assigned: ${selectedUsers.join(", ") || "-"}`,
      });

      if (logResponse.error) {
        throw new Error("Line user assignment was saved successfully. Action log could not be saved.");
      }

      Toast.success("Line user assignment saved successfully.");
      router.push("/pages/line");
    } catch (error) {
      Toast.error(error.message || "Failed to save line user assignment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Loading loading={loading || saving} message={saving ? "Saving data..." : "Loading data..."} />
      <Breadcrumb title="Detail Line" items={[{ label: "Lines Management", href: "/pages/line" }, { label: "Detail" }]} />

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body p-4">
          <div className="row">
            <InfoItem label="Line Code" value={line?.Code} />
            <InfoItem label="Status" value={line?.Status === 1 ? "Active" : "Inactive"} />
            <div className="col-md-6 col-sm-12 mb-3 d-flex justify-content-end align-items-start">
              <Button classType="secondary" iconName="arrow-left" label="Back" onClick={() => router.push("/pages/line")} />
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom gap-2">
            <div>
              <h6 className="mb-1" style={{ fontSize: 14 }}>User Assignment</h6>
              <p className="text-secondary mb-0" style={{ fontSize: 13 }}>Select users assigned to this line.</p>
            </div>
            <Button classType="primary" iconName="save" label={saving ? "Saving..." : "Save"} isDisabled={saving} onClick={handleSave} />
          </div>
          <div className="p-3 border-bottom">
            <div style={{ maxWidth: 360 }}>
              <Input
                label="Search User"
                name="searchUser"
                type="search"
                value={search}
                onChange={handleSearch}
                placeholder="Search by fullname, username, or status"
              />
            </div>
          </div>
          <Table size="Small" data={pagedUsers} enableCheckbox initialSelectedIds={selectedUsers} onSelectionChange={setSelectedUsers} />
          {filteredUsers.length > 0 && (
            <div className="p-3 border-top">
              <Paging
                pageSize={pageSize}
                pageCurrent={currentPage}
                totalData={filteredUsers.length}
                navigation={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
