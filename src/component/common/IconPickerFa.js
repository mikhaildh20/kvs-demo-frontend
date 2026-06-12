"use client";

import { useMemo, useState } from "react";
import * as FaIcons from "react-icons/fa";

export default function IconPickerFa({ value = "", onChange = () => {} }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const iconNames = useMemo(
    () => Object.keys(FaIcons).filter((name) => /^Fa[A-Z]/.test(name)),
    []
  );

  const filteredNames = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return iconNames.slice(0, 150);
    return iconNames.filter((name) => name.toLowerCase().includes(keyword)).slice(0, 150);
  }, [iconNames, search]);

  const selectedName = value?.trim();
  const SelectedIcon = selectedName ? FaIcons[selectedName] : null;

  return (
    <div>
      <label className="form-label" style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
        Icon (Optional)
      </label>

      <div className="d-flex gap-2">
        <button
          type="button"
          className="btn btn-light border d-flex align-items-center gap-2"
          style={{ height: 38, fontSize: 13 }}
          onClick={() => setOpen((prev) => !prev)}
        >
          {SelectedIcon ? <SelectedIcon size={14} /> : <span className="text-secondary">-</span>}
          <span>{selectedName || "Pilih icon"}</span>
        </button>

        <button
          type="button"
          className="btn btn-outline-secondary"
          style={{ height: 38, fontSize: 13 }}
          onClick={() => onChange("")}
        >
          Clear
        </button>
      </div>

      {open && (
        <div className="border rounded-3 p-2 mt-2" style={{ background: "#fff", maxHeight: 320, overflow: "auto" }}>
          <input
            className="form-control form-control-sm"
            placeholder="Cari icon... contoh: FaUser"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ fontSize: 12 }}
          />

          <div className="d-flex flex-wrap gap-2 mt-2">
            {filteredNames.map((iconName) => {
              const IconComp = FaIcons[iconName];
              const active = selectedName === iconName;

              return (
                <button
                  key={iconName}
                  type="button"
                  className={`btn btn-sm ${active ? "btn-primary" : "btn-light border"}`}
                  title={iconName}
                  onClick={() => {
                    onChange(iconName);
                    setOpen(false);
                  }}
                  style={{ fontSize: 11 }}
                >
                  <span className="d-inline-flex align-items-center gap-1">
                    {IconComp ? <IconComp size={12} /> : null}
                    {iconName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="form-text" style={{ fontSize: 12 }}>
        Referensi icon: <a href="https://react-icons.github.io/react-icons/icons/fa/" target="_blank" rel="noopener noreferrer">React Icons - Font Awesome</a>
      </div>
    </div>
  );
}
