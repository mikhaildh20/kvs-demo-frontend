"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as FaIcons from "react-icons/fa";
import Breadcrumb from "@/component/common/Breadcrumb";
import DropDown from "@/component/common/Dropdown";
import Formsearch from "@/component/common/Formsearch";
import Loading from "@/component/common/Loading";
import Paging from "@/component/common/Paging";
import SweetAlert from "@/component/common/SweetAlert";
import Table from "@/component/common/Table";
import Toast from "@/component/common/Toast";
import fetchData from "@/lib/fetch";
import { createActionLog } from "@/lib/actionLog";
import { encryptIdUrl } from "@/lib/encryptor";

const dataFilterSort = [
  { Value: "mnu_name ASC", Text: "Menu Name [ASC]" },
  { Value: "mnu_name DESC", Text: "Menu Name [DESC]" },
  { Value: "mnu_path ASC", Text: "Path [ASC]" },
  { Value: "mnu_path DESC", Text: "Path [DESC]" },
];

const dataFilterStatus = [
  { Value: "1", Text: "Active" },
  { Value: "0", Text: "Inactive" },
];

export default function MenuPage() {
  const router = useRouter();
  const sortRef = useRef();
  const statusRef = useRef();

  const [dataMenu, setDataMenu] = useState([]);
  const [dataMenuRaw, setDataMenuRaw] = useState([]);
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

      const masterMenu = (response.data?.menus || []).find(
        (menu) => menu.path === "/pages/menu"
      );

      setMenuIcon(masterMenu?.icon || "FaRegCircle");
    });

    return () => {
      isActive = false;
    };
  }, []);

  const loadData = useCallback(
    async (page, sort, keyword, status) => {
      try {
        setLoading(true);

        const response = await fetchData(
          "menus",
          {
            Status: status,
            ...(keyword === "" ? {} : { Keyword: keyword }),
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
        setDataMenuRaw(data);
        setDataMenu(
          data.map((item, index) => ({
            No: (page - 1) * pageSize + index + 1,
            id: item.Id,
            Name: item.Name,
            Path: item.Path,
            Icon: (
              <span className="d-inline-flex align-items-center gap-2">
                {(() => {
                  const IconComp = FaIcons[item.Icon] || FaIcons.FaRegCircle;
                  return <IconComp size={14} />;
                })()}
                <span>{item.Icon || "-"}</span>
              </span>
            ),
            Status: item.Status === 1 ? "Active" : "Inactive",
            Action: ["Edit", "Toggle"],
            Alignment: ["center", "left", "left", "center", "center", "center"],
          }))
        );
        setTotalData(total);
        setCurrentPage(page);
      } catch (err) {
        Toast.error(err.message || "Failed to load menu data.");
        setDataMenu([]);
        setTotalData(0);
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  const handleSearch = useCallback(
    (query) => {
      setSearch(query);
      loadData(1, sortBy, query, sortStatus);
    },
    [loadData, sortBy, sortStatus]
  );

  const handleFilterApply = useCallback(() => {
    const newSortBy = sortRef.current.value;
    const newStatus = statusRef.current.value;

    setSortBy(newSortBy);
    setSortStatus(newStatus);
    setCurrentPage(1);
    loadData(1, newSortBy, search, newStatus);
  }, [loadData, search]);

  const handleNavigation = useCallback(
    (page) => {
      loadData(page, sortBy, search, sortStatus);
    },
    [loadData, search, sortBy, sortStatus]
  );

  const handleAdd = useCallback(() => {
    router.push("/pages/menu/add");
  }, [router]);

  const handleEdit = useCallback(
    (id) => router.push(`/pages/menu/edit/${encryptIdUrl(id)}`),
    [router]
  );

  const handleToggle = useCallback(
    async (id) => {
      const menu = dataMenuRaw.find((item) => item.Id === id);
      const isActive = menu?.Status === 1;
      const result = await SweetAlert({
        title: isActive ? "Disable Menu" : "Enable Menu",
        text: isActive
          ? "Are you sure you want to disable this menu?"
          : "Are you sure you want to enable this menu?",
        icon: isActive ? "warning" : "info",
        confirmText: isActive ? "Yes, disable it!" : "Yes, enable it!",
      });

      if (!result) return;

      setLoading(true);

      try {
        const response = await fetchData("menus/toggle-status", { id }, "POST");

        if (response.error) {
          throw new Error(response.message);
        }

        const logResponse = await createActionLog({
          action: "UPDATE",
          oldValue: `Menu: ${menu?.Name || id} ${isActive ? "Active" : "Inactive"}`,
          newValue: `Menu: ${menu?.Name || id} ${isActive ? "Inactive" : "Active"}`,
        });

        if (logResponse.error) {
          throw new Error("Menu status updated successfully. Action log could not be saved.");
        }

        Toast.success("Menu status updated successfully.");
        await loadData(currentPage, sortBy, search, sortStatus);
      } catch (err) {
        Toast.error(err.message || "Failed to update menu status.");
      } finally {
        setLoading(false);
      }
    },
    [currentPage, dataMenuRaw, loadData, search, sortBy, sortStatus]
  );

  useEffect(() => {
    queueMicrotask(() => {
      loadData(1, sortBy, search, sortStatus);
    });
  }, [loadData, search, sortBy, sortStatus]);

  const filterContent = useMemo(
    () => (
      <>
        <DropDown
          ref={sortRef}
          arrData={dataFilterSort}
          type="choose"
          label="Sorting"
          forInput="sortBy"
          defaultValue={sortBy}
        />
        <DropDown
          ref={statusRef}
          arrData={dataFilterStatus}
          type="choose"
          label="Status"
          forInput="sortStatus"
          defaultValue={sortStatus}
        />
      </>
    ),
    [sortBy, sortStatus]
  );

  const MasterMenuIcon = FaIcons[menuIcon] || FaIcons.FaRegCircle;

  return (
    <>
      <Loading loading={loading} message="Loading data..." />
      <Breadcrumb title="Menu Management" items={[]} />
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
              <MasterMenuIcon size={16} />
            </div>
            <div>
              <h6 className="mb-1" style={{ fontSize: 14 }}>
                Master Menu Overview
              </h6>
              <p
                className="text-secondary mb-0"
                style={{ fontSize: 13, lineHeight: 1.6 }}
              >
                Manage application menu records that define navigation paths,
                icons, and page availability across the warehouse system. Active
                menus can be assigned to roles and displayed in the sidebar,
                while inactive menus are hidden from operational access.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Formsearch
        onSearch={handleSearch}
        onAdd={handleAdd}
        onFilter={handleFilterApply}
        searchPlaceholder="Search menu data"
        addButtonText="Add"
        showExportButton={false}
        filterContent={filterContent}
      />
      <div className="col-12">
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <Table
              size="Small"
              data={dataMenu}
              onEdit={handleEdit}
              onToggle={handleToggle}
            />
            {totalData > 0 && (
              <div className="p-3 border-top">
                <Paging
                  pageSize={pageSize}
                  pageCurrent={currentPage}
                  totalData={totalData}
                  navigation={handleNavigation}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
