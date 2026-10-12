import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { FiUpload, FiFileText, FiX, FiExternalLink } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { uploadProjectImage } from "@/services/uploadService";

/**
 * Same underlying upload mechanism as ImageUploadField (the endpoint
 * already whitelists PDFs — see backend/src/middlewares/upload.js) — this
 * component just renders appropriately for a document instead of an image.
 */
export default function PdfUploadField({ value, onChange, ariaLabelledBy }) {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef(null);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" || file.size > 5 * 1024 * 1024) {
      toast.error(t("common.uploadFailed"));
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const uploaded = await uploadProjectImage(file, "resume");
      const url = typeof uploaded === "string" ? uploaded : uploaded?.url;
      if (!url) throw new Error(t("common.uploadFailed"));
      onChange(url);
      toast.success(t("common.pdfUploaded"));
    } catch (err) {
      toast.error(err.message || t("common.uploadFailed"));
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div role="group" aria-labelledby={ariaLabelledBy} className="space-y-2">
      <div className="flex gap-2">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-muted)]">
          <FiFileText size={16} />
        </div>
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("common.pdfUrlPlaceholder")}
          className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label={t("common.clearFile")}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
          >
            <FiX size={14} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-1.5 font-mono text-xs text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-60"
        >
          <FiUpload size={12} />
          {isUploading ? t("common.uploading") : t("common.uploadPdf")}
        </button>
        {value && (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 font-mono text-xs text-[var(--color-primary)] hover:underline"
          >
            {t("common.viewFile")} <FiExternalLink size={11} />
          </a>
        )}
        <input ref={inputRef} type="file" accept=".pdf,application/pdf" onChange={handleFileChange} className="hidden" />
      </div>
    </div>
  );
}
