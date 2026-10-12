import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function ConfirmDialog({ title, message, onConfirm, onCancel, isLoading }) {
  const { t } = useTranslation();
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const loadingRef = useRef(isLoading);
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    loadingRef.current = isLoading;
    onCancelRef.current = onCancel;
  }, [isLoading, onCancel]);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loadingRef.current) {
        event.preventDefault();
        onCancelRef.current?.();
        return;
      }

      if (event.key === "Tab" && dialogRef.current) {
        const focusable = [...dialogRef.current.querySelectorAll(focusableSelector)].filter(
          (element) => !element.hasAttribute("disabled") && element.offsetParent !== null
        );

        if (!focusable.length) {
          event.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    requestAnimationFrame(() => {
      cancelButtonRef.current?.focus();
    });

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[95] flex items-center justify-center bg-gray-950/65 p-4 backdrop-blur-sm" onClick={() => !isLoading && onCancel?.()}>
      <motion.div
        ref={dialogRef}
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-2xl shadow-black/25 sm:p-7"
      >
        <h3 id="confirm-dialog-title" className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-text-primary)]">
          {title}
        </h3>
        <p id="confirm-dialog-description" className="mt-2 text-sm text-[var(--color-text-muted)]">
          {message}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 font-mono text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-[var(--radius-md)] bg-[var(--color-danger)] px-4 py-2 font-mono text-sm font-medium text-[var(--color-danger-foreground)] disabled:opacity-60"
          >
            {isLoading ? t("common.deleting") : t("common.delete")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
