"use client";

import { useCallback, useEffect, useState } from "react";
import fetchData from "@/lib/fetch";
import Loading from "@/component/common/Loading";
import Breadcrumb from "@/component/common/Breadcrumb";
import Table from "@/component/common/Table";
import Toast from "@/component/common/Toast";

export default function MatrixPage() {
    const [dataMatrix, setDataMatrix] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);

            const response = await fetchData("matrix", {}, "GET");

            if (response.error) {
                throw new Error(response.message);
            }

            const data = response.data || [];
            setDataMatrix(
                data.map((item) => ({
                    id: item.mtx_id,
                    "Actual Date": item.mtx_actual_date,
                    Date: item.mtx_date,
                    "Actual Month": item.mtx_actual_month,
                    Month: item.mtx_month,
                    "Actual Year": item.mtx_actual_year,
                    Year: item.mtx_year,
                    Alignment: ["center","center","center","center","center","center"],
                }))
            );
        } catch (error) {
            Toast.error(error.message || "Failed to load matrix data.");
            setDataMatrix([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return(
        <>
            <Loading show={loading} message="Loading matrix..."/>
            <Breadcrumb title="Lot Code Matrix" items={[]}/>
            <div className="col-12 mb-3">
                <div className="card border-0 shadow-sm">
                    <div className="card-body p-4">
                        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start gap-3">
                            <div>
                                <h6 className="mb-2" style={{ fontSize: 16, fontWeight: 700 }}>Lot Code Reference Guide</h6>
                                <p className="text-secondary mb-0" style={{ fontSize: 13, maxWidth: 760 }}>
                                    This page is the reference matrix used to convert actual production date values
                                    (date, month, and year) into lot code format used by the system.
                                </p>
                            </div>
                            <div className="px-3 py-2 rounded-3" style={{ background: "#f8fafc", border: "1px solid #e5e7eb", fontSize: 12 }}>
                                <div className="fw-semibold mb-1">Lot Code Pattern</div>
                                <div>Year + Month + Date</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-12">
                <div className="card border-0 shadow-sm">
                    <div className="card-body p-0">
                        <Table size="Small" data={dataMatrix} />
                    </div>
                </div>
            </div>
            <div className="col-12 mt-3">
                <div className="card border-0 shadow-sm">
                    <div className="card-body p-3">
                        <div className="row g-3">
                            <div className="col-md-4">
                                <div className="rounded-3 p-3 h-100" style={{ background: "#f8fafc", border: "1px solid #e5e7eb" }}>
                                    <div className="fw-semibold mb-1" style={{ fontSize: 13 }}>Actual Date</div>
                                    <div className="text-secondary" style={{ fontSize: 12 }}>Calendar date value before conversion.</div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="rounded-3 p-3 h-100" style={{ background: "#f8fafc", border: "1px solid #e5e7eb" }}>
                                    <div className="fw-semibold mb-1" style={{ fontSize: 13 }}>Matrix Code</div>
                                    <div className="text-secondary" style={{ fontSize: 12 }}>Mapped code used in lot number generation.</div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="rounded-3 p-3 h-100" style={{ background: "#f8fafc", border: "1px solid #e5e7eb" }}>
                                    <div className="fw-semibold mb-1" style={{ fontSize: 13 }}>Usage</div>
                                    <div className="text-secondary" style={{ fontSize: 12 }}>Used by OQC and label generation workflow.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
