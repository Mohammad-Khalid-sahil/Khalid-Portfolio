import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FiPlus, FiSearch } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { resourceConfigs } from "@/config/adminResources";
import api from "@/services/api";
import { usePermissions } from "@/hooks/usePermissions";
import { useAdminResource } from "@/hooks/queries/useAdminResource";
import DataTable from "@/components/admin/DataTable";
import ResourceForm from "@/components/admin/ResourceForm";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { SectionLoader } from "@/components/loaders/SectionLoader";
import { ErrorState } from "@/components/loaders/ErrorState";

const PAGE_SIZES = [10, 25, 50];
const SORT_LABELS = {
  default: "defaultSort",
  newest: "newest",
  oldest: "oldest",
  alpha: "alphaAsc",
  alphaDesc: "alphaDesc",
  order: "customOrder",
};

export default function ResourceManager({ resourceKey: propKey }) {
  const { t } = useTranslation();
  const { resource: paramKey } = useParams();
  const resourceKey = propKey || paramKey;
  const config = resourceConfigs[resourceKey];
  const { can } = usePermissions();
  const canDelete = can("content:delete");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("default");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingRecord, setDeletingRecord] = useState(null);

  useEffect(() => {
    const timer = window.setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);


  const queryParams = {
    page,
    limit: pageSize,
    sort,
    ...(search ? { search } : {}),
  };
  const { items, pagination, isLoading, isError, refetch, create, update, remove, isSaving, isDeleting } =
    useAdminResource(config, queryParams);

  useEffect(() => {
    if (pagination.pages > 0 && page > pagination.pages) setPage(pagination.pages);
    if (pagination.pages === 0 && page !== 1) setPage(1);
  }, [page, pagination.pages]);

  if (!config) return <p className="text-[var(--color-text-muted)]">{t("admin.unknownResource")}</p>;

  async function handleSubmit(payload) {
    if (editingRecord?.[config.idKey]) {
      await update(editingRecord[config.idKey], payload);
    } else {
      await create(payload);
    }
    setEditingRecord(null);
  }

  async function handleEditRecord(record) {
    try {
      const response = await api.get(`/cms-translations/${resourceKey}/${record[config.idKey]}`);
      setEditingRecord({ ...record, translations: response.data?.translations || {} });
    } catch {
      setEditingRecord(record);
    }
  }

  async function handleDelete() {
    await remove(deletingRecord[config.idKey]);
    setDeletingRecord(null);
  }

  const total = Number(pagination.total ?? pagination.count ?? items.length);
  const pages = Math.max(1, Number(pagination.pages || 1));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={() => setEditingRecord({})}
          className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 font-mono text-sm font-medium text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)]"
        >
          <FiPlus size={15} /> {t("common.new")}
        </button>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(180px,220px)_minmax(150px,180px)]">
        <label className="relative block">
          <span className="sr-only">{t("admin.resourceList.search")}</span>
          <FiSearch className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={14} />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent py-2 ps-9 pe-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
            placeholder={t("admin.resourceList.searchPlaceholder")}
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <span className="shrink-0">{t("admin.resourceList.sort")}</span>
          <select
            value={sort}
            onChange={(event) => { setSort(event.target.value); setPage(1); }}
            className="min-w-0 flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
          >
            {config.listSortOptions.map((option) => (
              <option key={option} value={option}>{t(`admin.resourceList.${SORT_LABELS[option]}`)}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <span className="shrink-0">{t("admin.resourceList.pageSize")}</span>
          <select
            value={pageSize}
            onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}
            className="min-w-0 flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
          >
            {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
      </div>

      {isLoading && <SectionLoader label={t("common.loading")} />}
      {isError && <ErrorState message={t("common.loadError")} onRetry={refetch} />}

      {!isLoading && !isError && (
        <>
          <DataTable
            columns={config.columns.map((column) => ({ ...column, label: t(column.labelKey, { defaultValue: column.label }) }))}
            rows={items}
            idKey={config.idKey}
            onEdit={handleEditRecord}
            onDelete={setDeletingRecord}
            canDelete={canDelete}
            minWidth={config.tableMinWidth || "600px"}
            emptyMessage={search ? t("admin.resourceList.noResults") : undefined}
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-text-muted)]">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>{t("admin.resourceList.showing", { start: rangeStart, end: rangeEnd, total })}</span>
              <span>{t("admin.resourceList.pageLabel", { page: Math.min(page, pages), pages })}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-1.5 hover:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50"
              >{t("admin.resourceList.previous")}</button>
              <button
                type="button"
                disabled={page >= pages || isLoading}
                onClick={() => setPage((current) => Math.min(pages, current + 1))}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-1.5 hover:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50"
              >{t("admin.resourceList.next")}</button>
            </div>
          </div>
        </>
      )}

      {editingRecord !== null && (
        <ResourceForm
          title={t(config.singularKey, { defaultValue: config.title.replace(/s$/, "") })}
          fields={config.fields}
          record={editingRecord[config.idKey] ? editingRecord : null}
          onSubmit={handleSubmit}
          onClose={() => setEditingRecord(null)}
          isSaving={isSaving}
        />
      )}

      {deletingRecord && (
        <ConfirmDialog
          title={t("admin.deleteRecordTitle", { resource: t(config.singularKey, { defaultValue: config.title.replace(/s$/, "") }) })}
          message={t("common.deleteConfirmMessage")}
          onConfirm={handleDelete}
          onCancel={() => setDeletingRecord(null)}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}


