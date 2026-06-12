"use client";

import { useEffect, useRef } from "react";

const W = 300;
const H = 280;

const text = (ctx, value, x, y, w, h, size = 12, bold = false, align = "center") => {
  ctx.font = `${bold ? "700" : "400"} ${size}px Arial`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  const tx = align === "left" ? x + 4 : align === "right" ? x + w - 4 : x + w / 2;
  ctx.fillText(String(value || ""), tx, y + h / 2);
};

const textWithOffset = (ctx, value, x, y, w, h, size = 12, bold = false, offsetX = 0) => {
  ctx.font = `${bold ? "700" : "400"} ${size}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(value || ""), x + w / 2 + offsetX, y + h / 2);
};

export default function OqcLabelCanvas({ label }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "#000";
    ctx.fillStyle = "#000";
    ctx.lineWidth = 1;

    ctx.strokeRect(1, 1, W - 2, H - 2);
    ctx.beginPath();
    ctx.moveTo(0, 24); ctx.lineTo(W, 24);
    ctx.moveTo(0, 50); ctx.lineTo(206, 50);
    ctx.moveTo(0, 110); ctx.lineTo(W, 110);
    ctx.moveTo(0, 138); ctx.lineTo(W, 138);
    ctx.moveTo(0, 166); ctx.lineTo(W, 166);
    ctx.moveTo(0, 210); ctx.lineTo(W, 210);
    ctx.moveTo(0, 246); ctx.lineTo(222, 246);
    ctx.moveTo(0, 280); ctx.lineTo(W, 280);

    ctx.moveTo(68, 24); ctx.lineTo(68, 50);
    ctx.moveTo(129, 24); ctx.lineTo(129, 50);
    ctx.moveTo(206, 0); ctx.lineTo(206, 110);
    ctx.moveTo(76, 50); ctx.lineTo(76, 110);
    ctx.moveTo(74, 138); ctx.lineTo(74, 280);
    ctx.moveTo(148, 138); ctx.lineTo(148, 280);
    ctx.moveTo(222, 138); ctx.lineTo(222, 280);
    ctx.stroke();

    textWithOffset(ctx, "PT INDONESIA KOITO", 0, 2, W, 20, 7, true, -45);
    text(ctx, "OQC", 0, 24, 68, 26, 10, true);
    text(ctx, "Shift 1", 68, 24, 61, 26, 10, true);
    text(ctx, "Shift 2", 129, 24, 77, 26, 10, true);

    text(ctx, "PART", 0, 50, 76, 30, 10, true);
    text(ctx, "NAME", 0, 80, 76, 30, 10, true);
    text(ctx, label?.partName || "-", 76, 50, 130, 60, 9, false, "left");

    text(ctx, "PART NUMBER", 0, 110, 120, 28, 9, true, "left");
    text(ctx, label?.partNumber || "-", 120, 110, 180, 28, 9, true, "center");

    text(ctx, "LOT", 0, 138, 74, 14, 8, true);
    text(ctx, "No.", 0, 152, 74, 14, 8, true);
    text(ctx, "INSPECTOR", 74, 138, 74, 28, 8, true);
    text(ctx, "KANBAN", 148, 138, 74, 14, 8, true);
    text(ctx, "No.", 148, 152, 74, 14, 8, true);
    text(ctx, "JUDGE", 222, 138, 78, 28, 8, true);

    text(ctx, label?.lotNo || "-", 0, 166, 74, 44, 16, false);
    text(ctx, label?.inspector || "-", 74, 166, 74, 44, 10, false);
    text(ctx, label?.kanbanNo || "-", 148, 166, 74, 44, 22, true);
    text(ctx, label?.judge || "KOITO", 222, 166, 78, 44, 10, false);

    text(ctx, label?.lotDate || "-", 0, 210, 74, 36, 9, false);
    text(ctx, "JOB No.", 74, 210, 74, 36, 9, true);
    text(ctx, label?.jobNo || "", 148, 210, 74, 36, 11, false);
    text(ctx, "QC PASSED", 222, 210, 78, 70, 9, true);

    text(ctx, "QTY.", 0, 246, 74, 34, 10, true);
    text(ctx, String(label?.qty ?? "-"), 74, 246, 74, 34, 12, false);
    text(ctx, `SEQ ${label?.seq || ""}`, 148, 246, 74, 34, 11, true);

    const qr = new Image();
    qr.crossOrigin = "anonymous";
    qr.onload = () => ctx.drawImage(qr, 210, 6, 84, 98);
    qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(label?.qrText || "")}`;
  }, [label]);

  return <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%", display: "block", background: "transparent" }} />;
}
