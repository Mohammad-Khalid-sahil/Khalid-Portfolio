import { useTranslation } from "react-i18next";

const inputClass = "w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]";

export default function LocalizedTextFields({ name, label, register, watch, errors, maxLength, multiline = false }) {
  const { t } = useTranslation();
  return (
    <div className="mt-3 grid gap-3 border-s border-[var(--color-border)] ps-3">
      {[{ code: "fa", label: t("common.dari") }, { code: "ps", label: t("common.pashto") }].map(({ code, label: localeLabel }) => {
        const path = `translations.${code}.${name}`;
        const error = errors?.translations?.[code]?.[name];
        const registration = register(path, { maxLength: maxLength ? { value: maxLength, message: t("adminValidation.maxLength", { field: label, max: maxLength }) } : undefined });
        const props = { id: path, dir: "rtl", ...registration, maxLength, "aria-invalid": Boolean(error), "aria-describedby": error ? `${path}-error` : undefined, className: inputClass };
        return (
          <div key={code}>
            <label htmlFor={path} className="mb-1 block font-mono text-xs text-[var(--color-text-muted)]">{localeLabel}: {label}</label>
            {multiline ? <textarea rows={3} {...props} className={`${inputClass} resize-y`} /> : <input type="text" {...props} />}
            <div className="mt-1 flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
              <span>{t("admin.cmsTranslationsHint")}</span>
              {maxLength ? <span>{String(watch(path) || "").length} / {maxLength}</span> : null}
            </div>
            {error && <p id={`${path}-error`} role="alert" className="mt-1 text-xs text-[var(--color-danger)]">{error.message}</p>}
          </div>
        );
      })}
    </div>
  );
}

