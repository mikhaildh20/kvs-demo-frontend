"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import fetchData from "@/lib/fetch";

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState(null);

  useEffect(() => {
    let isActive = true;
    fetchData("/auth/session", {}, "GET").then((response) => {
      if (!isActive) return;
      setSession(response.error ? { user: null, menus: [], accessPaths: [] } : response.data || {});
    });

    return () => {
      isActive = false;
    };
  }, []);

  const user = session?.user;
  const menus = session?.menus || [];
  const accessPaths = session?.accessPaths || [];
  const menuCount = menus.length;
  const accessCount = accessPaths.length;

  return (
    <div className="dashboard-page">
      <section className="content-card w-100" style={{ maxWidth: "none", marginLeft: 0, marginRight: 0 }}>
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div>
            <Image
              src="/images/logoKoito.png"
              alt="Kanban Verification System"
              width={118}
              height={38}
              style={{
                objectFit: "contain",
                objectPosition: "left center",
                marginBottom: 14,
              }}
            />
            <p className="section-tag">Kanban Verification System</p>
            <h1 className="page-title">Kanban Verification Control Center</h1>
            <p className="page-description" style={{ maxWidth: 760 }}>
              This system supports kanban verification activities across production and delivery workflows, including
              master data maintenance, OQC processing, double check inspection, barcode delivery scanning, reporting,
              and operational audit logs.
            </p>
          </div>
        </div>

        <div className="row g-3 mt-2">
          <div className="col-lg-4 col-md-6">
            <div className="border rounded-2 p-3 h-100 bg-white">
              <div className="text-secondary" style={{ fontSize: 12 }}>Signed-in User</div>
              <div className="fw-semibold mt-1" style={{ fontSize: 18 }}>{user?.fullname || user?.name || "-"}</div>
              <div className="text-secondary mt-1" style={{ fontSize: 13 }}>{user?.username || "-"}</div>
            </div>
          </div>
          <div className="col-lg-4 col-md-6">
            <div className="border rounded-2 p-3 h-100 bg-white">
              <div className="text-secondary" style={{ fontSize: 12 }}>Current Authority</div>
              <div className="fw-semibold mt-1" style={{ fontSize: 18 }}>{user?.role_name || "-"}</div>
              <div className="text-secondary mt-1" style={{ fontSize: 13 }}>
                Your available menus and pages are determined by this role.
              </div>
            </div>
          </div>
          <div className="col-lg-4 col-md-12">
            <div className="border rounded-2 p-3 h-100 bg-white">
              <div className="text-secondary" style={{ fontSize: 12 }}>Access Scope</div>
              <div className="fw-semibold mt-1" style={{ fontSize: 18 }}>{menuCount} menus · {accessCount} pages</div>
              <div className="text-secondary mt-1" style={{ fontSize: 13 }}>
                Restricted pages are hidden or blocked automatically.
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3 mt-1">
          <div className="col-lg-7">
            <div className="border rounded-2 p-3 h-100 bg-white">
              <h6 className="mb-2" style={{ fontSize: 14 }}>What This System Handles</h6>
              <ul className="text-secondary mb-0 ps-3" style={{ fontSize: 13, lineHeight: 1.8 }}>
                <li>Kanban master data control for customers, suppliers, lines, colors, QR formats, and document references.</li>
                <li>Verification transactions for OQC, double check inspection, and barcode delivery scan validation.</li>
                <li>Reports and exports for kanban inspection quality, delivery scan progress, and production monitoring.</li>
                <li>Action logs for important user activities, imports, exports, updates, scans, and lock events.</li>
              </ul>
            </div>
          </div>
          <div className="col-lg-5">
            <div className="border rounded-2 p-3 h-100 bg-white">
              <h6 className="mb-2" style={{ fontSize: 14 }}>Your Authorized Menus</h6>
              {menus.length === 0 ? (
                <div className="alert alert-warning mb-0" style={{ fontSize: 13 }}>
                  No menu is available for your role, or the assigned menu is currently under maintenance.
                </div>
              ) : (
                <div className="d-flex flex-wrap gap-2">
                  {menus.slice(0, 8).map((menu) => (
                    <button
                      key={menu.path || menu.name}
                      type="button"
                      className="btn btn-light border"
                      style={{ fontSize: 12 }}
                      onClick={() => router.push(menu.path)}
                    >
                      {menu.name}
                    </button>
                  ))}
                  {menus.length > 8 && (
                    <span className="badge text-bg-light border align-self-center" style={{ fontSize: 12 }}>
                      +{menus.length - 8} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
