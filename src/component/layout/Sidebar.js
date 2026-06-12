"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import * as FaIcons from "react-icons/fa";
import {
  clearAuthSession,
} from "@/lib/auth";
import SweetAlert from "@/component/common/SweetAlert";

const SIDEBAR_GROUP_STORAGE_KEY = "wms:sidebar-open-groups";

const readStoredOpenGroups = () => {
  if (typeof window === "undefined") return {};

  try {
    return JSON.parse(window.sessionStorage.getItem(SIDEBAR_GROUP_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

const storeOpenGroups = (value) => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SIDEBAR_GROUP_STORAGE_KEY, JSON.stringify(value || {}));
};

export default function Sidebar({
  isOpen,
  onClose,
  session,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const parsedUser = session?.user;
  const authorizedMenus = useMemo(
    () =>
      (session?.menus || [])
        .filter((menu) => menu?.path)
        .map((menu) => ({
          id: menu.id,
          href: menu.path,
          label: menu.name,
          icon: menu.icon,
          groupName: menu.groupName || "Ungrouped",
        })),
    [session?.menus]
  );
  const groupedMenus = useMemo(() => {
    const grouped = authorizedMenus.reduce((acc, menu) => {
      const key = menu.groupName || "Ungrouped";
      if (!acc[key]) acc[key] = [];
      acc[key].push(menu);
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([groupName, items]) => ({
        groupName,
        items: items.sort((a, b) => String(a.label || "").localeCompare(String(b.label || ""))),
      }));
  }, [authorizedMenus]);
  const [openGroups, setOpenGroups] = useState(readStoredOpenGroups);

  const userInitial = useMemo(
    () => parsedUser?.fullname?.charAt(0)?.toUpperCase() || "W",
    [parsedUser]
  );

  const handleLogout = async () => {
    const result = await SweetAlert({
      title: "Logout",
      text: "Are you sure you want to log out?",
      icon: "info",
      confirmText: "Yes, log out",
    });

    if (!result) return;

    clearAuthSession();
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(SIDEBAR_GROUP_STORAGE_KEY);
    }
    onClose();
    router.push("/pages/auth/login");
    router.refresh();
  };

  const handleNavigate = (href) => {
    onClose();
    router.push(href);
  };

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);
  const NavItem = ({ item }) => {
    const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
    const MenuIcon = FaIcons[item.icon] || FaIcons.FaRegCircle;

    return (
      <button
        type="button"
        title={item.label}
        onClick={() => handleNavigate(item.href)}
        className={`wms-nav-item ${isActive ? "active" : ""}`}
      >
        <span className="wms-nav-icon">
          <MenuIcon />
        </span>
        <span className="wms-nav-label">{item.label}</span>
      </button>
    );
  };

  const toggleGroup = (groupName) => {
    setOpenGroups((current) => {
      const nextState = { ...current, [groupName]: !current[groupName] };
      storeOpenGroups(nextState);
      return nextState;
    });
  };

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside className={`sidebar-panel wms-sidebar ${isOpen ? "open" : ""}`}>
        <div className="wms-sidebar-brand">
          <button
            type="button"
            className="wms-sidebar-mark"
            onClick={() => handleNavigate("/")}
            title="Kanban Verification System"
          >
            <img src="/images/logoKoito.png" alt="Kanban Verification System" />
          </button>

          <div className="wms-sidebar-title">
            <strong>Kanban Verification</strong>
            <span>System</span>
          </div>

          <button
            type="button"
            className="wms-icon-button"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {parsedUser && (
          <button
            type="button"
            className="wms-user-panel wms-user-panel-button"
            onClick={() => handleNavigate("/pages/profile")}
          >
            <div className="wms-user-avatar">{userInitial}</div>
            <div className="wms-user-copy">
              <span>{parsedUser?.fullname ?? "User"}</span>
              <small>{parsedUser?.role_name || "Role not available"}</small>
            </div>
          </button>
        )}

        <nav className="wms-nav">
          {authorizedMenus.length > 0 && (
            <>
              <p className="wms-nav-heading">Menu</p>
              {groupedMenus.map((group) => (
                <div key={group.groupName} className="wms-nav-group">
                  <button
                    type="button"
                    className="wms-nav-group-toggle"
                    onClick={() => toggleGroup(group.groupName)}
                  >
                    <span>{group.groupName}</span>
                    <i className={`bi ${openGroups[group.groupName] ? "bi-chevron-up" : "bi-chevron-down"}`} />
                  </button>
                  {openGroups[group.groupName] && (
                    <div className="wms-nav-group-items">
                      {group.items.map((item, index) => (
                        <NavItem key={`${item.id || item.href}-${index}`} item={item} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {authorizedMenus.length === 0 && (
            <div className="wms-empty-menu">
              <i className="bi bi-inboxes" />
              <strong>Menu not available</strong>
              <span>
                This role has not been assigned any menu yet or the menu is
                currently under maintenance.
              </span>
            </div>
          )}

        </nav>

        <div className="wms-sidebar-footer">
          {parsedUser ? (
            <button
              type="button"
              title="Logout"
              onClick={handleLogout}
              className="wms-footer-action danger"
            >
              <i className="bi bi-box-arrow-right" />
              <span>Logout</span>
            </button>
          ) : null}
        </div>
      </aside>
    </>
  );
}
