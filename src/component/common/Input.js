import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";

function Label({ htmlFor, text, required }) {
  return (
    <label
      htmlFor={htmlFor}
      className="form-label"
      style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: "block" }}
    >
      {text}
      {required && <span style={{ color: "#a32d2d", marginLeft: 3 }}>*</span>}
    </label>
  );
}

function LovTable({ data, columns, valueColumn, onSelect, search, activeIndex, onActiveIndexChange, page, onPageChange, pageSize = 6 }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const filtered = useMemo(() =>
    data.filter((row) =>
      columns.some((col) =>
        String(row[col.key] ?? "").toLowerCase().includes(search.toLowerCase())
      )
    ), [data, columns, search]);

  const sorted = useMemo(() =>
    sortKey
      ? [...filtered].sort((a, b) => {
          const av = String(a[sortKey] ?? "");
          const bv = String(b[sortKey] ?? "");
          return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
        })
      : filtered,
    [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (key) => {
    setSortKey((prev) => {
      if (prev === key) { setSortDir((d) => (d === "asc" ? "desc" : "asc")); return key; }
      setSortDir("asc"); return key;
    });
    onPageChange(1);
  };

  const SortIcon = ({ colKey }) => {
      const active = sortKey === colKey;

      return (
          <svg
              width="7"
              height="9"
              viewBox="0 0 7 9"
              fill="none"
              style={{
                  marginLeft: 3,
                  flexShrink: 0,
                  color: "#6c757d",
              }}
          >
              <path
                  d="M3.5 1L6 3.5H1L3.5 1Z"
                  fill={
                      active && sortDir === "asc"
                          ? "#495057"
                          : "currentColor"
                  }
                  opacity={
                      active && sortDir === "asc"
                          ? 1
                          : 0.3
                  }
              />

              <path
                  d="M3.5 8L1 5.5H6L3.5 8Z"
                  fill={
                      active && sortDir === "desc"
                          ? "#495057"
                          : "currentColor"
                  }
                  opacity={
                      active && sortDir === "desc"
                          ? 1
                          : 0.3
                  }
              />
          </svg>
      );
  };

  return (
    <>
      {/* Table scroll area */}
      <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: 224 }}>
        {paged.length === 0 ? (
          <div style={{ padding: "16px", textAlign: "center", color: "#9ca3af", fontSize: 12 }}>
            No records found
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f8f9fa", borderBottom: "1px solid #dee2e6", position: "sticky", top: 0 }}>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{
                      padding: "5px 10px",
                      textAlign: "left",
                      fontWeight: 600,
                      fontSize: 10,
                      color: sortKey === col.key ? "#212529" : "#6c757d",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                      borderRight: "1px solid #eef0f8",
                      cursor: "pointer",
                      userSelect: "none",
                      background: "#f4f6ff",
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center" }}>
                      {col.label}
                      <SortIcon colKey={col.key} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((row, i) => {
                const globalIdx = (currentPage - 1) * pageSize + i;
                const isActive = activeIndex === globalIdx;
                return (
                  <tr
                    key={i}
                    style={{
                      borderBottom: "1px solid #f4f5fb",
                      background: isActive ? "#e9ecef" : i % 2 === 0 ? "#fff" : "#f8f9fa",
                      cursor: "pointer",
                      transition: "background 0.08s",
                    }}
                    onClick={() => onSelect(row)}
                    onMouseEnter={() => onActiveIndexChange(globalIdx)}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        style={{
                          padding: "6px 10px",
                          color: col.key === valueColumn ? "#212529" : isActive ? "#212529" : "#374151",
                          fontWeight: col.key === valueColumn ? 600 : 400,
                          borderRight: "1px solid #f4f5fb",
                          maxWidth: 160,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "4px 10px",
        borderTop: "1px solid #dee2e6",
        background: "#f8f9fa",
        minHeight: 28,
      }}>
        <span style={{ fontSize: 10, color: "#6c757d" }}>
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          {search ? ` · "${search}"` : ""}
        </span>
        {totalPages > 1 && (
          <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{ border: "1px solid #e2e4ea", background: "none", borderRadius: 4, width: 18, height: 18, cursor: currentPage === 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: currentPage === 1 ? 0.3 : 1, padding: 0 }}
            >
              <svg width="5" height="7" viewBox="0 0 5 7" fill="none"><path d="M4 1L1 3.5L4 6" stroke="#555" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            {(() => {
              const startP = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
              return Array.from({ length: Math.min(5, totalPages) }, (_, i) => startP + i).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onPageChange(n)}
                  style={{
                    border: `1px solid ${n === currentPage ? "#6c757d" : "#e2e4ea"}`,
                    background: n === currentPage ? "#6c757d" : "#fff",
                    color: n === currentPage ? "#fff" : "#555",
                    borderRadius: 4,
                    width: 18,
                    height: 18,
                    cursor: "pointer",
                    fontSize: 10,
                    fontWeight: n === currentPage ? 600 : 400,
                    padding: 0,
                    lineHeight: 1,
                  }}
                >
                  {n}
                </button>
              ));
            })()}
            <button
              type="button"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{ border: "1px solid #e2e4ea", background: "none", borderRadius: 4, width: 18, height: 18, cursor: currentPage === totalPages ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: currentPage === totalPages ? 0.3 : 1, padding: 0 }}
            >
              <svg width="5" height="7" viewBox="0 0 5 7" fill="none"><path d="M1 1L4 3.5L1 6" stroke="#555" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default function Input({
  label,
  type = "text",
  value,
  onChange,
  onKeyDown,
  placeholder = "",
  name,
  id,
  disabled = false,
  required = false,
  className = "",
  error = "",
  helperText = "",
  size = "md",
  readOnly = false,
  autoComplete = "off",
  maxLength,
  lovData = [],
  lovColumns = [],
  lovValueColumn,
  lovDisplayColumn,
  onLovSelect,
}) {
  const [lovOpen, setLovOpen] = useState(false);
  const [lovSearch, setLovSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [lovPage, setLovPage] = useState(1);
  const wrapperRef = useRef(null);
  const searchRef = useRef(null);

  const isLov = type === "lov";
  const pageSize = 6;

  const sizeStyles = {
    sm: { height: 32, fontSize: 12 },
    md: { height: 38, fontSize: 13 },
    lg: { height: 44, fontSize: 14 },
  };
  const sizeStyle = sizeStyles[size] || sizeStyles.md;

  // Close on outside click
  useEffect(() => {
    if (!isLov) return;
    const handle = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setLovOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [isLov]);

  // Auto-focus search when open
  useEffect(() => {
    if (lovOpen) {
      setActiveIndex(-1);
      setLovPage(1);
      setTimeout(() => searchRef.current?.focus(), 40);
    } else {
      setLovSearch("");
    }
  }, [lovOpen]);

  // Reset page on search change
  useEffect(() => { setLovPage(1); }, [lovSearch]);

  const filteredData = useMemo(() =>
    lovData.filter((row) =>
      lovColumns.some((col) =>
        String(row[col.key] ?? "").toLowerCase().includes(lovSearch.toLowerCase())
      )
    ), [lovData, lovColumns, lovSearch]);

  const handleLovSelect = useCallback((row) => {
    if (!row) {
      onChange?.({ target: { name, value: "" } });
      onLovSelect?.(null, "", "");
      return;
    }
    const selectedValue = row[lovValueColumn ?? lovColumns[0]?.key ?? ""];
    const displayValue = lovDisplayColumn ? row[lovDisplayColumn] : selectedValue;
    if (onLovSelect) {
      onLovSelect(row, selectedValue, displayValue);
    } else {
      onChange?.({ target: { name, value: String(displayValue ?? "") } });
    }
    setLovOpen(false);
  }, [lovValueColumn, lovDisplayColumn, lovColumns, onLovSelect, onChange, name]);

  const handleKeyDown = (e) => {
    if (!isLov || !lovOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filteredData.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0 && filteredData[activeIndex]) {
      e.preventDefault();
      handleLovSelect(filteredData[activeIndex]);
    } else if (e.key === "Escape" || e.key === "Tab") {
      setLovOpen(false);
    }
  };

  const inputEl = isLov ? (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      {/* Trigger row */}
      <div
        role="combobox"
        aria-expanded={lovOpen}
        aria-haspopup="listbox"
        aria-label={label}
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setLovOpen((o) => !o)}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " " || e.key === "ArrowDown") && !lovOpen) {
            e.preventDefault();
            if (!disabled) setLovOpen(true);
          }
          handleKeyDown(e);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          border: error
            ? "1px solid #dc3545"
            : lovOpen
            ? "1px solid #adb5bd"
            : "1px solid #ced4da",
          borderRadius: 6,
          background: disabled ? "#e9ecef" : "#fff",
          transition:
            "border-color .15s ease-in-out, box-shadow .15s ease-in-out",
          boxShadow: lovOpen
            ? "0 0 0 0.15rem rgba(0,0,0,.08)"
            : "none",
          cursor: disabled ? "not-allowed" : "pointer",
          height: sizeStyle.height,
          overflow: "hidden",
          outline: "none",
        }}
      >
        <span style={{
          flex: 1,
          padding: "0 10px",
          fontSize: sizeStyle.fontSize,
          color: value ? "#212529" : "#6c757d",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          userSelect: "none",
        }}>
          {value || placeholder || "Select…"}
        </span>

        {/* Clear btn */}
        {value && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => { e.stopPropagation(); handleLovSelect(null); }}
            aria-label="Clear"
            style={{ border: "none", background: "none", cursor: "pointer", padding: "0 6px", color: "#adb5bd", display: "flex", alignItems: "center", flexShrink: 0, transition: "color 0.1s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#6b7280")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#adb5bd")}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        )}

        {/* Chevron */}
        <div style={{
          width: sizeStyle.height - 2,
          height: "100%",
          background: disabled ? "#e9ecef" : "#fff",
          borderLeft: "1px solid #ced4da",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "background 0.12s",
        }}>
          <svg
            width={sizeStyle.fontSize - 1}
            height={sizeStyle.fontSize - 1}
            viewBox="0 0 12 12"
            fill="none"
            style={{ transition: "transform 0.15s", transform: lovOpen ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Dropdown panel */}
      {lovOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 1050,
            border: "1px solid rgba(0,0,0,.15)",
            background: "#fff",
            borderRadius: 6,
            boxShadow: "0 .5rem 1rem rgba(0,0,0,.15)",
            overflow: "hidden",
            transformOrigin: "top",
            animation: "lovDrop 0.14s cubic-bezier(.22,.9,.4,1)",
          }}
        >
          <style>{`
            @keyframes lovDrop {
              from { opacity: 0; transform: translateY(-5px) scaleY(0.97); }
              to   { opacity: 1; transform: translateY(0) scaleY(1); }
            }
          `}</style>

          {/* Search bar */}
          <div style={{ padding: "7px 8px 6px", borderBottom: "1px solid #eef0f8" }}>
            <div style={{ position: "relative" }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"
                style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }}>
                <circle cx="4.5" cy="4.5" r="3.2" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M7.2 7.2L9.5 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <input
                ref={searchRef}
                type="text"
                value={lovSearch}
                onChange={(e) => setLovSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search…"
                autoComplete="off"
                style={{
                  width: "100%",
                  border: "1px solid #ced4da",
                  borderRadius: 6,
                  padding: "5px 24px 5px 24px",
                  fontSize: 12,
                  outline: "none",
                  background: "#fff",
                  color: "#212529",
                  boxSizing: "border-box",
                  transition: "border-color 0.12s",
                }}
              />
              {lovSearch && (
                <button type="button" tabIndex={-1} onClick={() => setLovSearch("")}
                  style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", padding: 0, lineHeight: 1 }}>
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1 1L8 8M8 1L1 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Table + pagination */}
          <LovTable
            data={lovData}
            columns={lovColumns}
            valueColumn={lovValueColumn ?? lovColumns[0]?.key}
            onSelect={handleLovSelect}
            search={lovSearch}
            activeIndex={activeIndex}
            onActiveIndexChange={setActiveIndex}
            page={lovPage}
            onPageChange={setLovPage}
            pageSize={pageSize}
          />
        </div>
      )}
    </div>
  ) : (
    <input
      type={type}
      className={`form-control rounded-2 ${error ? "is-invalid" : ""}`}
      id={id || name}
      name={name}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      readOnly={readOnly}
      autoComplete={autoComplete}
      maxLength={maxLength}
      style={sizeStyle}
    />
  );

  return (
    <div className={`mb-3 ${className}`}>
      {label && <Label htmlFor={id || name} text={label} required={required} />}
      {inputEl}
      {helperText && !error && (
        <div className="form-text" style={{ fontSize: 12 }}>{helperText}</div>
      )}
      {error && (
        <span className="d-flex align-items-center gap-1 mt-1" style={{ fontSize: 12, color: "#a32d2d" }}>
          <i className="bi bi-exclamation-circle-fill" style={{ fontSize: 12 }} />
          {error}
        </span>
      )}
    </div>
  );
}

Input.propTypes = {
  label: PropTypes.string,
  type: PropTypes.oneOf(["text", "password", "email", "number", "tel", "url", "search", "date", "time", "datetime-local", "lov"]),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func,
  onKeyDown: PropTypes.func,
  placeholder: PropTypes.string,
  name: PropTypes.string.isRequired,
  id: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  readOnly: PropTypes.bool,
  autoComplete: PropTypes.string,
  maxLength: PropTypes.number,
  lovData: PropTypes.arrayOf(PropTypes.object),
  lovColumns: PropTypes.arrayOf(PropTypes.shape({ key: PropTypes.string.isRequired, label: PropTypes.string.isRequired })),
  lovValueColumn: PropTypes.string,
  lovDisplayColumn: PropTypes.string,
  lovTitle: PropTypes.string,
  onLovSelect: PropTypes.func,
};
