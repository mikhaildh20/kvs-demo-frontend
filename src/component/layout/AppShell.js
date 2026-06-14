"use client";

import { useCallback, useState } from "react";
import Sidebar from "@/component/layout/Sidebar";

export default function AppShell({ children, session }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  return (
    <div className={`app-shell ${isSidebarOpen ? "sidebar-open" : ""}`}>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        session={session}
      />

      <main className="app-content">
        <header className="content-header">
          <div className="content-toolbar d-flex align-items-center justify-content-between gap-3">
            <button
              type="button"
              className="sidebar-toggle-btn"
              onClick={openSidebar}
              aria-label="Open sidebar"
              aria-expanded={isSidebarOpen}
            >
              <i className="bi bi-list" />
              <span>Menu</span>
            </button>

            <div className="content-brand d-flex align-items-center ms-auto">
              <img
                src="/images/logoNLA.png"
                alt="Kanban Verification System"
                className="content-brand-logo"
                style={{
                  width: 88,
                  height: 28,
                  objectFit: "contain",
                }}
              />
            </div>
          </div>
        </header>

        <section className="content-children">{children}</section>

        <footer className="content-footer d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-2">
          <div className="text-muted small">
            &copy; {new Date().getFullYear()} <strong>PT Indonesia Koito</strong>. All rights reserved.
          </div>

          <div className="text-muted small text-md-end">
            Version <strong>3.0</strong> &middot; Kanban Verification System
          </div>
        </footer>
      </main>
    </div>
  );
}
