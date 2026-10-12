import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FiUpload, FiImage, FiX } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { uploadProjectImage } from "@/services/uploadService";

function mediaUrl(value) {
  return typeof value === "string" ? value : value && typeof value.url === "string" ? value.url : "";
}

export default function ImageUploadField({ label, value, onChange, uploadOnly = false, usedIn = "other", ariaInvalid = false, ariaDescribedBy, ariaLabelledBy }) {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const inputRef = useRef(null);
  const previewUrl = mediaUrl(value);

  useEffect(() => {
    setPreviewFailed(false);
  }, [previewUrl]);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast.error(t("common.uploadFailed"));
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const uploaded = await uploadProjectImage(file, usedIn);
      const nextUrl = typeof uploaded === "string" ? uploaded : uploaded?.url;
      if (!nextUrl) throw new Error(t("common.uploadFailed"));
      onChange(nextUrl);
      toast.success(t("common.imageUploaded"));
    } catch (err) {
      toast.error(err.message || t("common.uploadFailed"));
    } finally {
      setIsUploading(false);
      e.target.value = ""; // allow re-selecting the same file later
    }
  }

  return (
    <div role="group" aria-labelledby={ariaLabelledBy} aria-invalid={ariaInvalid} aria-describedby={ariaDescribedBy} className={`rounded-[var(--radius-md)] border p-2 ${ariaInvalid ? "border-[var(--color-danger)] bg-[color:var(--color-danger)]/5" : "border-transparent"}`}>
      <div className="flex items-center gap-3">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)]">
          {previewUrl && !previewFailed ? (
            <img src={previewUrl} alt={label} onError={() => setPreviewFailed(true)} onLoad={() => setPreviewFailed(false)} className="h-full w-full object-cover" />
          ) : (
            <FiImage className="text-[var(--color-text-muted)]" size={18} />
          )}
        </div>

        <div className="flex-1 space-y-2">
          {!uploadOnly && (
            <div className="flex gap-2">
              <input
                type="text"
                value={previewUrl}
                onChange={(e) => onChange(e.target.value)}
                placeholder={t("common.imageUrlPlaceholder")}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
              />
              {value && (
                <button
                  type="button"
                  onClick={() => onChange("")}
                  aria-label={t("common.clearImage")}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            data-field-focus-target="true"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-1.5 font-mono text-xs text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-60"
          >
            <FiUpload size={12} />
            {isUploading ? t("common.uploading") : t("common.uploadImage")}
          </button>
          {uploadOnly && previewUrl && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="ms-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-1.5 font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
            >
              {t("common.clearImage")}
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
