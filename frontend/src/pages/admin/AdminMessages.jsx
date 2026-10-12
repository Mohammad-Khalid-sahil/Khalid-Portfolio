import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiMail, FiInbox, FiTrash2 } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import api from "@/services/api";
import { useAdminMessages } from "@/hooks/queries/useAdminMessages";
import { formatLocaleDateTime } from "@/utils/formatDate";
import { SectionLoader } from "@/components/loaders/SectionLoader";
import { ErrorState } from "@/components/loaders/ErrorState";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

export default function AdminMessages() {
  const { t } = useTranslation();
  const { data: messages, isLoading, isError, refetch } = useAdminMessages();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const markReadMutation = useMutation({
    mutationFn: (id) => api.patch(`/contact/messages/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "messages"] }),
    onError: (err) => toast.error(err.message || t("common.updateFailed")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/contact/messages/${id}`),
    onSuccess: () => {
      toast.success(t("admin.messageDeleted"));
      queryClient.invalidateQueries({ queryKey: ["admin", "messages"] });
      setDeleting(null);
      setSelected(null);
    },
    onError: (err) => toast.error(err.message || t("common.deleteFailed")),
  });

  function openMessage(msg) {
    setSelected(msg);
    if (!msg.read) markReadMutation.mutate(msg._id);
  }

  return (
    <div>
      <p className="text-sm text-[var(--color-text-muted)]">{t("admin.messagesSubtitle")}</p>

      {isLoading && <SectionLoader label={t("common.loading")} />}
      {isError && <ErrorState message={t("admin.couldntLoadMessages")} onRetry={refetch} />}

      {!isLoading && !isError && (!messages || messages.length === 0) && (
        <p className="mt-8 text-center text-sm text-[var(--color-text-muted)]">{t("admin.noMessagesYet")}</p>
      )}

      {!isLoading && !isError && messages?.length > 0 && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr]">
          <ul className="max-h-[70vh] space-y-1 overflow-y-auto">
            {messages.map((msg) => (
              <li key={msg._id}>
                <button
                  type="button"
                  onClick={() => openMessage(msg)}
                  className={`flex w-full items-start gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-start transition-colors ${
                    selected?._id === msg._id
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 hover:bg-[var(--color-primary)]/10"
                      : "border-[var(--color-border)] hover:bg-[var(--color-card)]"
                  }`}
                >
                  {msg.read ? (
                    <FiInbox className="mt-0.5 shrink-0 text-[var(--color-text-muted)]" size={15} />
                  ) : (
                    <FiMail className="mt-0.5 shrink-0 text-[var(--color-primary)]" size={15} />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm text-[var(--color-text-primary)]">{msg.name}</p>
                    <p className="truncate text-xs text-[var(--color-text-muted)]">{msg.subject}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
            {!selected ? (
              <p className="text-sm text-[var(--color-text-muted)]">{t("admin.selectMessage")}</p>
            ) : (
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-text-primary)]">
                      {selected.subject}
                    </h2>
                    <p className="mt-1 font-mono text-xs text-[var(--color-text-muted)]">
                      {selected.name} · {selected.email}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-[var(--color-text-muted)]">
                      {formatLocaleDateTime(selected.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleting(selected)}
                    className="grid h-9 w-9 place-items-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                    aria-label={t("common.delete")}
                  >
                    <FiTrash2 size={15} />
                  </button>
                </div>
                <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-[var(--color-text-primary)]">
                  {selected.message}
                </p>
                <a
                  href={`mailto:${selected.email}`}
                  className="mt-6 inline-block rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 font-mono text-sm text-[var(--color-text-primary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                >
                  {t("admin.replyViaEmail")}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {deleting && (
        <ConfirmDialog
          title={t("admin.deleteMessageTitle")}
          message={t("common.deleteConfirmMessage")}
          onConfirm={() => deleteMutation.mutate(deleting._id)}
          onCancel={() => setDeleting(null)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
