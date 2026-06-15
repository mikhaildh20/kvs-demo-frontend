"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/component/common/Breadcrumb";
import DropDown from "@/component/common/Dropdown";
import Formsearch from "@/component/common/Formsearch";
import Loading from "@/component/common/Loading";
import Paging from "@/component/common/Paging";
import Table from "@/component/common/Table";
import Toast from "@/component/common/Toast";
import { encryptIdUrl } from "@/lib/encryptor";
import fetchData from "@/lib/fetch";
import { formatDateTime } from "@/lib/dateFormater";
import * as FaIcons from "react-icons/fa";

const dataFilterSort = [
  { Value: "acl_creadate DESC", Text: "Newest" },
  { Value: "acl_creadate ASC", Text: "Oldest" },
  { Value: "acl_action ASC", Text: "Action [ASC]" },
  { Value: "acl_action DESC", Text: "Action [DESC]" },
  { Value: "acl_creaby ASC", Text: "Created By [ASC]" },
  { Value: "acl_creaby DESC", Text: "Created By [DESC]" },
];

export default function LogPage() {
  const router = useRouter();
  const sortRef = useRef();
  const [dataLog, setDataLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(dataFilterSort[0].Value);
  const [menuIcon, setMenuIcon] = useState("FaRegCircle");

  useEffect(() => {
    let isActive = true;

    fetchData("/auth/session", {}, "GET").then((response) => {
      if (!isActive || response.error) return;

      const logMenu = (response.data?.menus || []).find(
        (menu) => menu.path === "/pages/log"
      );

      setMenuIcon(logMenu?.icon || "FaRegCircle");
    });

    return () => {
      isActive = false;
    };
  }, []);

  const loadData = useCallback(
    async (page, sort, keyword) => {
      try {
        setLoading(true);

        const response = await fetchData(
          "action-logs",
          {
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
        setDataLog(
          data.map((item, index) => ({
            No: (page - 1) * pageSize + index + 1,
            id: item.Id,
            Menu: item.MenuName,
            Path: item.MenuPath,
            Activity: item.Action || "-",
            "Created By": item.CreatedBy || "-",
            "Created Date": formatDateTime(item.CreatedDate),
            Action: ["Detail"],
            Alignment: [
              "center",
              "center",
              "center",
              "center",
              "center",
              "center",
              "center",
            ],
          }))
        );
        setTotalData(total);
        setCurrentPage(page);
      } catch (err) {
        Toast.error(err.message || "Failed to load action logs.");
        setDataLog([]);
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
      loadData(1, sortBy, query);
    },
    [loadData, sortBy]
  );

  const handleFilterApply = useCallback(() => {
    const newSortBy = sortRef.current.value;
    setSortBy(newSortBy);
    setCurrentPage(1);
    loadData(1, newSortBy, search);
  }, [loadData, search]);

  const handleNavigation = useCallback(
    (page) => {
      loadData(page, sortBy, search);
    },
    [loadData, search, sortBy]
  );

  const handleDetail = useCallback(
    (id) => {
      router.push(`/pages/log/detail/${encryptIdUrl(id)}`);
    },
    [router]
  );

  useEffect(() => {
    queueMicrotask(() => {
      loadData(1, sortBy, search);
    });
  }, [loadData, search, sortBy]);

  const filterContent = useMemo(
    () => (
      <DropDown
        ref={sortRef}
        arrData={dataFilterSort}
        type="choose"
        label="Sorting"
        forInput="sortBy"
        defaultValue={sortBy}
      />
    ),
    [sortBy]
  );

  const LogMenuIcon = FaIcons[menuIcon] || FaIcons.FaRegCircle;

  return (
    <>
      <Loading loading={loading} message="Loading logs..." />
      <Breadcrumb title="Action Logs" items={[]} />
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
              <LogMenuIcon size={16} />
            </div>
            <div>
              <h6 className="mb-1" style={{ fontSize: 14 }}>
                Action Logs Overview
              </h6>
              <p
                className="text-secondary mb-0"
                style={{ fontSize: 13, lineHeight: 1.6 }}
              >
                Review recorded system activities such as master data changes,
                imports, exports, scan submissions, status updates, and account
                lock events. Use this page to trace who performed an action,
                when it happened, and open the detail page to compare old and
                new values.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Formsearch
        onSearch={handleSearch}
        onFilter={handleFilterApply}
        searchPlaceholder="Search logs"
        showAddButton={false}
        showExportButton={false}
        filterContent={filterContent}
      />
      <div className="col-12">
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <Table size="Small" data={dataLog} onDetail={handleDetail} />
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
