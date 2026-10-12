import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import api from "@/services/api";
import { SectionLoader } from "@/components/loaders/SectionLoader";

/**
 * Renders a checkbox list of items fetched from `endpoint`, storing the
 * selected `_id`s in `value` (an array of ID strings). Works with any
 * existing public list endpoint (e.g. /projects) — no new relation API.
 */
export default function RelationMultiSelect({ endpoint, labelKey, value = [], onChange, ariaInvalid = false, ariaDescribedBy, ariaLabelledBy }) {
  const { t } = useTranslation();
  const { data: options, isLoading } = useQuery({
    queryKey: ["admin", "relation-options", endpoint],
    queryFn: () => api.get(endpoint).then((res) => res.data),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <SectionLoader label={t("common.loadingOptions")} />;

  function toggle(id) {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  }

  if (!options?.length) {
    return <p className="text-sm text-[var(--color-text-muted)]">{t("common.noItemsYet")}</p>;
  }

  return (
    <div role="group" aria-labelledby={ariaLabelledBy} aria-invalid={ariaInvalid} aria-describedby={ariaDescribedBy} className={`max-h-40 space-y-1.5 overflow-y-auto rounded-[var(--radius-md)] border p-3 ${ariaInvalid ? "border-[var(--color-danger)] bg-[color:var(--color-danger)]/5" : "border-[var(--color-border)]"}`}>
      {options.map((opt) => (
        <label key={opt._id} className="admin-form-inline-label flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
          <input
            type="checkbox"
            checked={value.includes(opt._id)}
            onChange={() => toggle(opt._id)}
            className="h-4 w-4 accent-[var(--color-primary)]"
          />
          {opt[labelKey]}
        </label>
      ))}
    </div>
  );
}
