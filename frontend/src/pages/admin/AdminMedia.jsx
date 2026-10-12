import { useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiUpload, FiSearch, FiTrash2, FiFileText, FiExternalLink } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { listMedia, uploadMedia, deleteMedia, getMediaUsage } from "@/services/mediaService";
import { formatLocaleDate } from "@/utils/formatDate";
import { SectionLoader } from "@/components/loaders/SectionLoader";
import { ErrorState } from "@/components/loaders/ErrorState";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { usePermissions } from "@/hooks/usePermissions";

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export default function AdminMedia() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const canDeleteMedia = can("media:delete");
  const CATEGORY_TABS = [
    { id: "", label: t("admin.allFiles") },
    { id: "image", label: t("admin.images") },
    { id: "document", label: t("admin.documents") },
  ];
  const queryClient = useQueryClient();
  const inputRef = useRef(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState(null);
  const [usage, setUsage] = useState(null); // null = not checked yet, [] = checked & unused
  const [usageError, setUsageError] = useState(false);
  const [checkingUsage, setCheckingUsage] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "media", { search, category, page }],
    queryFn: () => listMedia({ search: search || undefined, category: category || undefined, page, limit: 24 }),
  });

  const items = response?.data || [];
  const meta = response?.meta;

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteMedia(id),
    onSuccess: (res) => {
      const cleared = res?.data?.clearedReferences ?? 0;
      toast.success(cleared > 0 ? `${t("admin.fileDeleted")} (${cleared})` : t("admin.fileDeleted"));
      queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
      // Deleting a media entry clears URL references in these persisted resources.
      // Refresh public caches so the UI doesn't keep showing deleted assets.
      ["projects", "project", "certifications", "profile", "posts", "post", "settings", "users"].forEach((key) =>
        queryClient.invalidateQueries({ queryKey: [key] })
      );
      setDeleting(null);
      setUsage(null);
      setUsageError(false);
    },
    onError: (err) => toast.error(err.message || t("common.deleteFailed")),
  });

  async function startDelete(item) {
    setDeleting(item);
    setUsage(null);
    setUsageError(false);
    setCheckingUsage(true);
    try {
      const result = await getMediaUsage(item._id);
      setUsage(result);
    } catch {
      setUsageError(true);
      toast.error(t("phase4.misc.mediaUsageError"));
    } finally {
      setCheckingUsage(false);
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (!allowed.includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast.error(t("common.uploadFailed"));
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      await uploadMedia(file, "other");
      toast.success(t("admin.fileUploaded"));
      queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
    } catch (err) {
      toast.error(err.message || t("common.uploadFailed"));
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--color-text-muted)]">
            {t("admin.mediaLibrarySubtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 font-mono text-sm font-medium text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
        >
          <FiUpload size={15} /> {isUploading ? t("common.uploading") : t("admin.uploadFile")}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setCategory(tab.id);
                setPage(1);
              }}
              className={`rounded-full border px-4 py-2 font-mono text-xs transition-colors ${
                category === tab.id
                  ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 sm:w-64">
          <FiSearch className="text-[var(--color-text-muted)]" size={15} />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("admin.searchByFilename")}
            className="w-full bg-transparent font-mono text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
          />
        </div>
      </div>

      {isLoading && (
        <div className="mt-8">
          <SectionLoader label={t("common.loading")} />
        </div>
      )}
      {isError && (
        <div className="mt-8">
          <ErrorState message={t("admin.couldntLoadMedia")} onRetry={refetch} />
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className="mt-10 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-10 text-center text-sm text-[var(--color-text-muted)]">
          {t("admin.noFilesYet")}
        </div>
      )}

      {!isLoading && !isError && items.length > 0 && (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {items.map((item) => (
              <div
                key={item._id}
                className="group overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)]"
              >
                <div className="relative aspect-square bg-[var(--color-background)]">
                  {item.category === "image" ? (
                    <img src={item.url} alt={item.originalName} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="grid h-full place-items-center text-[var(--color-text-muted)]">
                      <FiFileText size={28} />
                    </div>
                  )}

                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/70 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={t("common.openFile")}
                      className="grid h-9 w-9 place-items-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                    >
                      <FiExternalLink size={14} />
                    </a>
                    {canDeleteMedia && (
                      <button
                        type="button"
                        onClick={() => startDelete(item)}
                        aria-label={t("common.deleteFile")}
                        className="grid h-9 w-9 place-items-center rounded-full bg-[var(--color-danger)] text-[var(--color-danger-foreground)]"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-2.5">
                  <p className="truncate font-mono text-xs text-[var(--color-text-primary)]" title={item.originalName}>
                    {item.originalName}
                  </p>
                  <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-[var(--color-text-muted)]">
                    <span>{formatBytes(item.size)}</span>
                    <span>{formatLocaleDate(item.createdAt, { year: "numeric", month: "short", day: "numeric" })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {meta?.pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-1.5 font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-40"
              >
                {t("common.previous")}
              </button>
              <span className="font-mono text-xs text-[var(--color-text-muted)]">
                {t("common.pageOf", { page: meta.page, pages: meta.pages })}
              </span>
              <button
                type="button"
                disabled={page >= meta.pages}
                onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-1.5 font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-40"
              >
                {t("common.next")}
              </button>
            </div>
          )}
        </>
      )}

      {deleting && (
        <ConfirmDialog
          title={t("admin.deleteFileTitle")}
          message={
            checkingUsage ? (
              t("admin.checkingUsage")
            ) : usageError ? (
              "Usage could not be checked. Deleting this file will clear any matching content references."
            ) : usage && usage.length > 0 ? (
              <>
                {t("admin.fileUsedIn")}
                <ul className="mt-2 list-inside list-disc space-y-0.5">
                  {usage.map((u, i) => (
                    <li key={`${u.resource}-${u.id}-${i}`}>
                      <span className="capitalize">{u.resource}</span>: {u.label || t("common.untitled")}
                    </li>
                  ))}
                </ul>
                <span className="mt-2 block">{t("admin.deletingWillClear")}</span>
              </>
            ) : (
              t("admin.fileNotUsed")
            )
          }
          onConfirm={() => deleteMutation.mutate(deleting._id)}
          onCancel={() => {
            setDeleting(null);
            setUsage(null);
            setUsageError(false);
          }}
          isLoading={checkingUsage || deleteMutation.isPending}
        />
      )}
    </div>
  );
}
