import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { FiUpload, FiX } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { uploadProjectImage } from "@/services/uploadService";

function mediaUrl(value) {
  return typeof value === "string" ? value : value && typeof value.url === "string" ? value.url : "";
}

export default function GalleryUploadField({ value = [], onChange, ariaInvalid = false, ariaDescribedBy, ariaLabelledBy }) {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef(null);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if ((value || []).length >= 20 || !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast.error(t("common.uploadFailed"));
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const uploaded = await uploadProjectImage(file, "project");
      const url = mediaUrl(uploaded);
      if (!url) throw new Error(t("common.uploadFailed"));
      const currentUrls = (value || []).map(mediaUrl).filter(Boolean);
      if (currentUrls.includes(url)) return;
      onChange([...currentUrls, url]);
      toast.success(t("common.imageAdded"));
    } catch (err) {
      toast.error(err.message || t("common.uploadFailed"));
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  function removeAt(index) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div role="group" aria-labelledby={ariaLabelledBy} aria-invalid={ariaInvalid} aria-describedby={ariaDescribedBy} className={`rounded-[var(--radius-md)] border p-2 ${ariaInvalid ? "border-[var(--color-danger)] bg-[color:var(--color-danger)]/5" : "border-transparent"}`}>
      <div className="flex flex-wrap gap-3">
        {(value || []).map(mediaUrl).filter(Boolean).map((url, i) => (
          <div
            key={`${url}-${i}`}
            className="group relative h-20 w-20 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]"
          >
            <img
              src={url}
              alt={`${t("common.gallery")} ${i + 1}`}
              onError={(event) => {
                event.currentTarget.classList.add("hidden");
                event.currentTarget.setAttribute("data-image-error", "true");
                event.currentTarget.parentElement?.classList.add("bg-[var(--color-background)]");
                event.currentTarget.parentElement?.setAttribute("data-image-error", "true");
              }}
              onLoad={(event) => {
                event.currentTarget.classList.remove("hidden");
                event.currentTarget.parentElement?.removeAttribute("data-image-error");
              }}
              className="h-full w-full object-cover"
            />
            <span className="pointer-events-none absolute inset-0 hidden items-center justify-center p-2 text-center font-mono text-[9px] text-[var(--color-danger)] group-has-[img[data-image-error=true]]:flex">
              {t("adminValidation.imagePreviewUnavailable", { defaultValue: "Image preview unavailable" })}
            </span>
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label={t("common.removeImage")}
              className="absolute inset-0 grid place-items-center bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <FiX size={16} />
            </button>
          </div>
        ))}

        <button
          type="button"
          data-field-focus-target="true"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading || (value || []).length >= 20}
          className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-60"
        >
          <FiUpload size={16} />
          <span className="font-mono text-[10px]">{isUploading ? "..." : t("common.add")}</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
