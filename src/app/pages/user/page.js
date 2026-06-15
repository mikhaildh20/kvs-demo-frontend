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
import SweetAlert from "@/component/common/SweetAlert";
import { createActionLog } from "@/lib/actionLog";
import swal from "sweetalert";
import * as FaIcons from "react-icons/fa";

const dataFilterSort = [
  { Value: "usr_fullname ASC", Text: "Full Name [?]" },
  { Value: "usr_fullname DESC", Text: "Full Name [?]" },
  { Value: "usr_username ASC", Text: "Username [?]" },
  { Value: "usr_username DESC", Text: "Username [?]" },
];

const dataFilterStatus = [
  { Value: "1", Text: "Active" },
  { Value: "0", Text: "Inactive" },
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const showGeneratedPasswordAlert = async (password) => {
  swal({
    title: "Generated Password",
    text: `Password: ${password}\n\nSave this password. The OK button will appear in 5 seconds...`,
    icon: "warning",
    buttons: false,
    closeOnClickOutside: false,
    closeOnEsc: false,
  });
  await wait(5000);
  swal.close();
  await swal({
    title: "Generated Password",
    text: `Password: ${password}`,
    icon: "success",
    button: "OK",
    closeOnClickOutside: false,
    closeOnEsc: false,
  });
};

export default function UserPage() {
  const router = useRouter();
  const sortRef = useRef();
  const statusRef = useRef();

  const [dataUser, setDataUser] = useState([]);
  const [dataUserRaw, setDataUserRaw] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(dataFilterSort[0].Value);
  const [sortStatus, setSortStatus] = useState(dataFilterStatus[0].Value);
  const [menuIcon, setMenuIcon] = useState("FaRegCircle");

  useEffect(() => {
    let isActive = true;

    fetchData("/auth/session", {}, "GET").then((response) => {
      if (!isActive || response.error) return;

      const userMenu = (response.data?.menus || []).find(
        (menu) => menu.path === "/pages/user"
      );

      setMenuIcon(userMenu?.icon || "FaRegCircle");
    });

    return () => {
      isActive = false;
    };
  }, []);

  const loadData = useCallback(async (page, sort, cari, status) => {
    try {
      setLoading(true);
      const response = await fetchData("users", {
        Status: status,
        ...(cari === "" ? {} : { Keyword: cari }),
        Urut: sort,
        PageNumber: page,
        PageSize: pageSize,
      }, "GET");

      if (response.error) throw new Error(response.message);

      const { data = [], totalData: total = 0 } = response.data || {};
      setDataUserRaw(data);
      setDataUser(data.map((item, index) => ({
        Key: item.Id,
        No: (page - 1) * pageSize + index + 1,
        id: item.Id,
        Fullname: item.Fullname,
        Username: item.Username,
        Role: item.RoleName,
        Forced: Number(item.IsForced || 0) === 1 ? "Yes" : "No",
        Locked: Number(item.IsLocked || 0) === 1 ? "Yes" : "No",
        Status: item.Status === 1 ? "Active" : "Inactive",
        Action: [
          "Detail",
          "Edit",
          ...(Number(item.IsLocked || 0) === 1 ? ["Unlock"] : []),
          "Reset",
          "Toggle",
        ],
        Alignment: ["center", "left", "left", "left", "center", "center", "center", "center"],
      })));
      setTotalData(total);
      setCurrentPage(page);
    } catch (error) {
      Toast.error(error.message || "Failed to load data");
      setDataUser([]);
      setTotalData(0);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  const handleSearch = useCallback((query) => {
    setSearch(query);
    loadData(1, sortBy, query, sortStatus);
  }, [sortBy, sortStatus, loadData]);

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

  const handleAdd = useCallback(() => router.push("/pages/user/add"), [router]);
  const handleEdit = useCallback((id) => router.push(`/pages/user/edit/${encryptIdUrl(id)}`), [router]);
  const handleDetail = useCallback((id) => router.push(`/pages/user/detail/${encryptIdUrl(id)}`), [router]);

  const handleToggle = useCallback(async (id) => {
    const row = dataUserRaw.find((item) => item.Id === id);
    const isActive = row?.Status === 1;

    const result = await SweetAlert({
      title: isActive ? "Disable User" : "Enable User",
      text: isActive ? "Are you sure you want to disable this user?" : "Are you sure you want to enable this user?",
      icon: isActive ? "warning" : "info",
      confirmText: isActive ? "Yes, disable it!" : "Yes, enable it!",
    });
    if (!result) return;

    setLoading(true);
    try {
      const response = await fetchData("users/toggle-status", { id }, "POST");
      if (response.error) throw new Error(response.message);

      await createActionLog({ action: "UPDATE", oldValue: `User: ${row?.Username}`, newValue: `User: ${row?.Username}` });
      Toast.success(response.message || "User status updated successfully");
      await loadData(currentPage, sortBy, search, sortStatus);
    } catch (error) {
      Toast.error(error.message || "Failed to update user status");
    } finally {
      setLoading(false);
    }
  }, [currentPage, dataUserRaw, loadData, search, sortBy, sortStatus]);

  const handleReset = useCallback(async (id) => {
    const row = dataUserRaw.find((item) => item.Id === id);
    const result = await SweetAlert({
      title: "Reset Password",
      text: `Reset password for user ${row?.Username}?`,
      icon: "warning",
      confirmText: "Yes, reset",
    });
    if (!result) return;

    setLoading(true);
    try {
      const response = await fetchData("users/reset-password", { id }, "POST");
      if (response.error) throw new Error(response.message);

      await createActionLog({ action: "UPDATE", oldValue: `Reset Password User: ${row?.Username}`, newValue: `Reset Password User: ${row?.Username}` });
      await showGeneratedPasswordAlert(response.data?.generatedPassword || "-");
      Toast.success(response.message || "Password reset successfully");
      await loadData(currentPage, sortBy, search, sortStatus);
    } catch (error) {
      Toast.error(error.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }, [currentPage, dataUserRaw, loadData, search, sortBy, sortStatus]);

  const handleUnlock = useCallback(async (id) => {
    const row = dataUserRaw.find((item) => item.Id === id);
    const result = await SweetAlert({
      title: "Unlock User",
      text: `Unlock account for ${row?.Username || "this user"}?`,
      icon: "info",
      confirmText: "Yes, unlock",
    });
    if (!result) return;

    setLoading(true);
    try {
      const response = await fetchData("users/unlock", { id }, "POST");
      if (response.error) throw new Error(response.message);

      await createActionLog({
        action: "UPDATE",
        oldValue: `User: ${row?.Username}, Locked: Yes`,
        newValue: `User: ${row?.Username}, Locked: No`,
      });
      Toast.success(response.message || "User unlocked successfully");
      await loadData(currentPage, sortBy, search, sortStatus);
    } catch (error) {
      Toast.error(error.message || "Failed to unlock user");
    } finally {
      setLoading(false);
    }
  }, [currentPage, dataUserRaw, loadData, search, sortBy, sortStatus]);

  useEffect(() => {
    queueMicrotask(() => loadData(1, sortBy, search, sortStatus));
  }, [loadData, sortBy, search, sortStatus]);

  const filterContent = useMemo(() => (
    <>
      <DropDown ref={sortRef} arrData={dataFilterSort} type="choose" label="Sorting" forInput="sortBy" defaultValue={sortBy} />
      <DropDown ref={statusRef} arrData={dataFilterStatus} type="choose" label="Status" forInput="sortStatus" defaultValue={sortStatus} />
    </>
  ), [sortBy, sortStatus]);

  const UserMenuIcon = FaIcons[menuIcon] || FaIcons.FaRegCircle;

  return (
    <>
      <Loading loading={loading} message="loading data..." />
      <Breadcrumb title="User Management" items={[]} />
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
              <UserMenuIcon size={16} />
            </div>
            <div>
              <h6 className="mb-1" style={{ fontSize: 14 }}>
                User Master Overview
              </h6>
              <p
                className="text-secondary mb-0"
                style={{ fontSize: 13, lineHeight: 1.6 }}
              >
                Manage system users, role assignments, account status, password
                resets, and locked account recovery. Usernames are unique
                account identifiers, while role assignment controls which menus
                and pages each user can access.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div>
        <Formsearch onSearch={handleSearch} onAdd={handleAdd} onFilter={handleFilterApply} searchPlaceholder="Search user data" addButtonText="Add" showExportButton={false} filterContent={filterContent} />
      </div>
      <div className="col-12">
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <Table size="Small" data={dataUser} onDetail={handleDetail} onEdit={handleEdit} onReset={handleReset} onToggle={handleToggle} onUnlock={handleUnlock} />
            {totalData > 0 && (
              <div className="p-3 border-top">
                <Paging pageSize={pageSize} pageCurrent={currentPage} totalData={totalData} navigation={handleNavigation} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

