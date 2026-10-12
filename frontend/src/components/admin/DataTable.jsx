import { FiEdit2, FiTrash2, FiCheck, FiX, FiImage } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { formatLocaleDate } from "@/utils/formatDate";
import AdminTable from "./AdminTable";

function formatCell(value, type, t) {
  if (type === "boolean") {
    // Boolean values use semantic success and muted colors.
    return value ? (
      <span role="img" aria-label={t("common.yes")} title={t("common.yes")} className="grid h-5 w-full place-items-center">
        <FiCheck aria-hidden="true" className="text-[var(--color-success)]" size={15} />
      </span>
    ) : (
      <span role="img" aria-label={t("common.no")} title={t("common.no")} className="grid h-5 w-full place-items-center">
        <FiX aria-hidden="true" className="text-[var(--color-text-muted)]" size={15} />
      </span>
    );
  }
  if (type === "date") {
    return value ? formatLocaleDate(value) : "â€”";
  }
  if (type === "image") {
    const imageUrl = typeof value === "string" ? value : value?.url;
    return (
      <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-background)]" title={imageUrl || undefined}>
        <FiImage aria-hidden="true" className="text-[var(--color-text-muted)]" size={15} />
        {imageUrl && (
          <img
            src={imageUrl}
            alt=""
            onError={(event) => { event.currentTarget.style.display = "none"; }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </span>
    );
  }
  if (Array.isArray(value)) return value.join(", ");
  return value ?? "â€”";
}

export default function DataTable({ columns, rows, idKey = "_id", onEdit, onDelete, canDelete = true, minWidth = "600px", emptyMessage }) {
  const { t } = useTranslation();
  if (!rows.length) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-10 text-center text-sm text-[var(--color-text-muted)]">
        {emptyMessage || t("admin.noRecordsYet")}
      </div>
    );
  }

  const tableColumns = [
    ...columns.map((column) => ({
      ...column,
      align: column.align || (column.type === "number" ? "end" : column.type === "boolean" ? "center" : "start"),
      render: (row) => {
        const value = formatCell(row[column.key], column.type, t);
        if (column.type === "image" || column.type === "boolean") return value;
        return (
          <span className="block truncate" title={Array.isArray(row[column.key]) ? row[column.key].join(", ") : String(row[column.key] ?? "â€”")}>
            {value}
          </span>
        );
      },
    })),
    {
      key: "actions",
      label: "",
      width: "6.5rem",
      align: "end",
      render: (row) => (
        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
          <button
            type="button"
            onClick={() => onEdit(row)}
            aria-label={t("common.edit")}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
          >
            <FiEdit2 size={14} />
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(row)}
              aria-label={t("common.delete")}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
            >
              <FiTrash2 size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminTable columns={tableColumns} rows={rows} idKey={idKey} minWidth={minWidth} />
  );
}

