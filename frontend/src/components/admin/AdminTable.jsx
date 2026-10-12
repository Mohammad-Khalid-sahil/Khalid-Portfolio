function getGridTemplate(columns) {
  return columns.map((column) => {
    if (column.width?.endsWith("%")) {
      const weight = Number.parseFloat(column.width);
      return `minmax(0, ${Number.isFinite(weight) && weight > 0 ? weight : 1}fr)`;
    }
    if (column.width) return column.width;
    return "minmax(0, 1fr)";
  }).join(" ");
}

/** One shared grid definition keeps every header and row on identical tracks. */
export default function AdminTable({ columns, rows, idKey = "_id", minWidth = "600px" }) {
  const gridTemplateColumns = getGridTemplate(columns);

  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg shadow-black/5">
      <div role="table" className="text-sm" style={{ minWidth }}>
        <div role="rowgroup">
          <div
            role="row"
            className="grid min-h-12 items-center border-b border-[var(--color-border)] bg-[var(--color-surface)]/80"
            style={{ gridTemplateColumns }}
          >
            {columns.map((column) => (
              <div
                key={column.key}
                role="columnheader"
                className={`min-w-0 overflow-hidden px-4 py-3 font-sans text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] ${column.headerClassName || ""} ${column.align === "end" ? "text-end" : column.align === "center" ? "text-center" : "text-start"}`}
              >
                {column.label}
              </div>
            ))}
          </div>
        </div>
        <div role="rowgroup">
          {rows.map((row) => (
            <div
              key={row[idKey]}
              role="row"
              className="grid min-h-[3.75rem] items-center border-b border-[var(--color-border-subtle)] transition-colors last:border-b-0 hover:bg-[var(--color-primary)]/[0.035]"
              style={{ gridTemplateColumns }}
            >
              {columns.map((column) => (
                <div
                  key={column.key}
                  role="cell"
                  className={`min-w-0 overflow-hidden px-4 py-3 text-[13px] text-[var(--color-text-primary)] ${column.align === "end" ? "text-end" : column.align === "center" ? "text-center" : "text-start"} ${column.cellClassName || ""}`}
                >
                  {column.render ? column.render(row) : (
                    <span className="block truncate" title={String(row[column.key] ?? "")}>
                      {row[column.key] ?? "â€”"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
