import { Fragment, useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { FiX } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import ImageUploadField from "./ImageUploadField";
import GalleryUploadField from "./GalleryUploadField";
import RelationMultiSelect from "./RelationMultiSelect";
import { addAdminTranslations } from "@/services/adminTranslationService";

function toInputDate(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function buildDefaultValues(fields, record) {
  const values = {};
  fields.forEach((field) => {
    const raw = record ? record[field.name] : undefined;
    if (field.type === "array") {
      values[field.name] = Array.isArray(raw) ? raw.join(", ") : raw || "";
    } else if (field.type === "gallery") {
      values[field.name] = Array.isArray(raw) ? raw.map(normalizeMediaUrl).filter(Boolean) : [];
    } else if (field.type === "relation") {
      values[field.name] = Array.isArray(raw) ? raw.map((item) => (typeof item === "object" ? item._id : item)) : [];
    } else if (field.type === "date") {
      values[field.name] = toInputDate(raw);
    } else if (field.type === "boolean") {
      values[field.name] = raw ?? field.defaultValue ?? false;
    } else {
      values[field.name] = raw ?? field.defaultValue ?? "";
    }
  });
  return values;
}

function normalizeMediaUrl(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && typeof value.url === "string") return value.url;
  return value;
}

function getResourceFieldName(path, fields) {
  if (Array.isArray(path)) path = path.join(".");
  if (typeof path !== "string") return null;
  const normalizedPath = path.replace(/\[(\d+)\]/g, ".$1");
  return [...fields]
    .sort((a, b) => b.name.length - a.name.length)
    .find(({ name }) => normalizedPath === name || normalizedPath.startsWith(`${name}.`))?.name || null;
}

function parseSubmitValues(fields, formValues) {
  const payload = {};
  fields.forEach((field) => {
    const value = formValues[field.name];
    if (field.type === "array") {
      payload[field.name] = value
        ? value
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean)
        : [];
    } else if (field.type === "gallery") {
      payload[field.name] = Array.isArray(value) ? value.map(normalizeMediaUrl).filter(Boolean) : [];
    } else if (field.type === "relation") {
      payload[field.name] = Array.isArray(value) ? value : [];
    } else if (field.type === "image") {
      payload[field.name] = normalizeMediaUrl(value);
    } else if (field.type === "number") {
      payload[field.name] = value === "" ? undefined : Number(value);
    } else if (field.type === "date") {
      payload[field.name] = value || null;
    } else {
      payload[field.name] = value;
    }
  });
  // Normalize some fields to match backend expectations without changing rules:
  // - slug: trim and lower-case so backend's /^[a-z0-9-]*$/ matches expected input
  if (Object.prototype.hasOwnProperty.call(payload, "slug") && typeof payload.slug === "string") {
    payload.slug = payload.slug.trim().toLowerCase();
  }

  // - thumbnail: allow ImageUploadField to pass either a URL string or
  //   an object { url, mediaId } (defensive); backend expects a URL string
  if (Object.prototype.hasOwnProperty.call(payload, "thumbnail")) {
    payload.thumbnail = normalizeMediaUrl(payload.thumbnail);
  }
  return payload;
}

function getFieldRules(field, t) {
  const fieldName = field.name || "";
  const fieldLabel = t(field.labelKey || `adminValidation.fields.${fieldName}`, { defaultValue: field.label || fieldName });
  const rules = {};
  const limits = field.maxLength != null ? [field.minLength || 0, field.maxLength] : { title: [1, 150], description: [1, 500], fullDescription: [0, 5000], name: [1, 150], message: [5, 1000], slug: [0, 150], excerpt: [0, 500], content: [1, 50000], seoTitle: [0, 200], seoDescription: [0, 300], github: [0, 500], demo: [0, 500], videoDemo: [0, 500], documentation: [0, 500], verificationUrl: [0, 500], image: [0, 500], icon: [0, 50], startingPrice: [0, 50], ctaText: [0, 60], position: [1, 120], company: [1, 120], degree: [1, 150], university: [1, 150], organization: [1, 150], credentialId: [0, 100], location: [0, 120], faculty: [0, 150], gpa: [0, 20], thesis: [0, 500], responsibilities: [0, 100], achievements: [0, 100], technologies: [0, 100], features: [0, 100], courses: [0, 100], seoKeywords: [0, 50] }[fieldName];
  if (field.required) rules.required = t("adminValidation.required", { field: fieldLabel });
  if (limits?.[0] > 0) rules.minLength = { value: limits[0], message: t("adminValidation.minLength", { field: fieldLabel, min: limits[0] }) };
  if (limits) rules.maxLength = { value: limits[1], message: t("adminValidation.maxLength", { field: fieldLabel, max: limits[1] }) };
  if (["github", "demo", "videoDemo", "documentation", "verificationUrl", "image"].includes(fieldName)) {
    rules.validate = (value) => !value || /^https?:\/\/[^\s]+$/i.test(value) || t("adminValidation.url", { field: fieldLabel });
  }
  // Submission already lowercases and trims slugs. Validate that canonical
  // value too, otherwise an uppercase slug is rejected before normalization.
  if (fieldName === "slug") rules.validate = (value) => !value || /^[a-z0-9-]*$/.test(value.trim().toLowerCase()) || t("adminValidation.slug", { field: fieldLabel });
  if (fieldName === "email") rules.validate = (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || t("adminValidation.email", { field: fieldLabel });
  if (field.type === "number") rules.validate = (value) => {
    if (value === "" || value == null) return true;
    const num = Number(value);
    if (!Number.isFinite(num)) return t("adminValidation.number", { field: fieldLabel });
    if (field.min != null && num < field.min) return t("adminValidation.minValue", { field: fieldLabel, min: field.min });
    if (field.max != null && num > field.max) return t("adminValidation.maxValue", { field: fieldLabel, max: field.max });
    return true;
  };
  if (field.type === "date") rules.validate = (value) => !value || !Number.isNaN(Date.parse(value)) || t("adminValidation.date", { field: fieldLabel });
  if (field.type === "gallery") rules.validate = (value) => {
    if (!Array.isArray(value) || value.length > 20) return t("adminValidation.array", { field: fieldLabel });
    return value.every((item) => /^https?:\/\/[^\s]+$/i.test(normalizeMediaUrl(item) || "")) || t("adminValidation.url", { field: fieldLabel });
  };
  return rules;
}

function getFieldHelperText(field, t, fieldLabel) {
  if (field.type === "number" && (field.min != null || field.max != null)) {
    const limits = [];
    if (field.min != null) limits.push(t("adminValidation.minValue", { field: fieldLabel, min: field.min }));
    if (field.max != null) limits.push(t("adminValidation.maxValue", { field: fieldLabel, max: field.max }));
    return limits.join(" ");
  }
  return field.required ? t("common.fieldRequired") : "";
}

function getFieldRuleMessage(fieldName, fieldError, fallback) {
  if (fieldError?.message) return fieldError.message;
  if (fieldError?.type === "required") return fallback;
  return fallback;
}

export default function ResourceForm({ title, fields, record, resource, onSubmit, onClose, isSaving }) {
  const { t } = useTranslation();
  const [serverErrors, setServerErrors] = useState([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const fieldRefs = useRef({});
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const isSavingRef = useRef(isSaving);
  onCloseRef.current = onClose;
  isSavingRef.current = isSaving;
  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: buildDefaultValues(fields, record),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  function handleInvalidSubmit(invalidErrors) {
    const invalidFields = fields.filter((field) => invalidErrors[field.name] ||
      Object.keys(invalidErrors).some((name) => name.startsWith(`${field.name}.`)));
    const firstField = invalidFields[0];
    const firstFieldLabel = firstField
      ? t(firstField.labelKey || `adminValidation.fields.${firstField.name}`, { defaultValue: firstField.label || firstField.name })
      : "";

    if (firstField) {
      const fieldError = invalidErrors[firstField.name];
      const errorMessage = fieldError?.message || Object.values(fieldError || {}).find((error) => error?.message)?.message || t("common.fieldRequired");
      setServerErrors([]);
      toast.error(`${firstFieldLabel}: ${errorMessage}`);
      const element = fieldRefs.current[firstField.name];
      const focusTarget = element?.querySelector?.('[data-field-focus-target="true"],input:not([type=hidden]),button,select,textarea') || element;
      focusTarget?.focus?.();
      element?.scrollIntoView?.({ block: "center", behavior: "smooth" });
    }
  }

  useEffect(() => {
    reset(buildDefaultValues(fields, record));
    clearErrors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record]);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (!isSavingRef.current) onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
        .filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    closeButtonRef.current?.focus();
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, []);

  useEffect(() => {
    if (!Object.keys(errors).length) return;

    const fieldName = fields.find((field) => errors[field.name])?.name;
    if (!fieldName || !fieldRefs.current[fieldName]) return;

    const fieldElement = fieldRefs.current[fieldName];
    (fieldElement.querySelector?.('[data-field-focus-target="true"],input:not([type=hidden]),button,select,textarea') || fieldElement).focus?.();
    fieldElement.scrollIntoView?.({ block: "center", behavior: "smooth" });
  }, [errors, fields]);

  async function submit(values) {
    setServerErrors([]);
    try {
      const payload = parseSubmitValues(fields, values);
      const localizedFields = fields.filter((field) => field.localized).map((field) => field.name);
      setIsTranslating(localizedFields.length > 0);
      const original = Object.fromEntries(localizedFields.map((name) => [name, record?.[name]]));
      const translationResult = localizedFields.length
        ? await addAdminTranslations(resource, payload, localizedFields, original, record?.translations)
        : { payload, complete: true };
      await onSubmit(translationResult.payload);
      if (!translationResult.complete) toast.error(t("admin.translationUnavailableSaved"));
    } catch (error) {
      const details = Array.isArray(error?.details)
        ? error.details
        : Array.isArray(error?.response?.data?.details)
          ? error.response.data.details
          : [];

      if (details.length) {
        const visibleDetails = [];
        details.forEach((detail) => {
          const fieldName = getResourceFieldName(detail?.field || detail?.path || detail?.name, fields);
          if (!fieldName) return;
          const rawMessage = detail?.message || detail?.msg || "";
          const fieldLabel = t(fields.find((field) => field.name === fieldName)?.labelKey || `adminValidation.fields.${fieldName}`, { defaultValue: fields.find((field) => field.name === fieldName)?.label || fieldName });
          const msg = rawMessage === "duplicate" || error?.status === 409
            ? t("adminValidation.duplicate")
            : /must be at least|minimum/i.test(rawMessage) ? t("adminValidation.minLength", { field: fieldLabel, min: Number(rawMessage.match(/\d+/)?.[0] || 1) })
              : /must be no more than|maximum/i.test(rawMessage) ? t("adminValidation.maxLength", { field: fieldLabel, max: Number(rawMessage.match(/\d+/)?.[0] || 1) })
                : /url|uri/i.test(rawMessage) ? t("adminValidation.url", { field: fieldLabel })
                  : /required/i.test(rawMessage) ? t("adminValidation.required", { field: fieldLabel })
                    : t("adminValidation.invalid", { field: fieldLabel });
          setError(fieldName, {
            type: "server",
            message: msg,
          });
          visibleDetails.push({ fieldName, fieldLabel, message: msg });
        });
        setServerErrors(visibleDetails);
      }

      const message = t("phase4.misc.saveFailed");
      const firstDetail = details[0];
      const firstField = getResourceFieldName(firstDetail?.field || firstDetail?.path || firstDetail?.name, fields);
      const visibleField = firstField ? fields.find((field) => field.name === firstField) : null;
      const firstMessage = details[0]?.message || details[0]?.msg;
      const localizedFirst = visibleField ? t(visibleField.labelKey || `adminValidation.fields.${visibleField.name}`, { defaultValue: visibleField.label }) : "";
      const localizedMessage = firstMessage && /url|uri/i.test(firstMessage)
        ? t("adminValidation.url", { field: localizedFirst })
        : firstMessage && /required/i.test(firstMessage)
          ? t("adminValidation.required", { field: localizedFirst })
          : t("adminValidation.invalid", { field: localizedFirst });
      toast.error(visibleField ? `${localizedFirst}: ${localizedMessage}` : error?.message || message);

      const focusField = visibleField?.name || fields.find((field) => !!errors[field.name])?.name || fields.find((field) => field.required)?.name;
      const input = focusField ? fieldRefs.current[focusField] : null;
      (input?.querySelector?.('[data-field-focus-target="true"],input:not([type=hidden]),button,select,textarea') || input)?.focus?.();
      input?.scrollIntoView?.({ block: "center", behavior: "smooth" });
    } finally {
      setIsTranslating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-gray-950/65 p-4 backdrop-blur-sm" onClick={() => !isSaving && onClose?.()}>
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="resource-form-title"
        className="max-h-[min(90vh,52rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-2xl shadow-black/25 sm:p-8"
      >
        <div className="mb-6 flex items-center justify-between border-b border-[var(--color-border)] pb-5">
          <h2 id="resource-form-title" className="font-[var(--font-display)] text-xl font-semibold text-[var(--color-text-primary)]">
            {record ? t("admin.editRecord", { resource: title }) : t("admin.newRecord", { resource: title })}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            disabled={isSaving || isTranslating}
            aria-label={t("common.cancel")}
            className="grid h-8 w-8 place-items-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          >
            <FiX />
          </button>
        </div>

        {fields.some((field) => field.localized) && (
          <p className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-xs text-[var(--color-text-muted)]">
            {t("admin.cmsTranslationsHint")}
          </p>
        )}

        <form onSubmit={handleSubmit(submit, handleInvalidSubmit)} className="admin-form space-y-4" noValidate>
          {serverErrors.length > 0 && (
            <div role="alert" className="rounded-[var(--radius-md)] border border-[var(--color-danger)] bg-[color:var(--color-danger)]/5 p-3 text-sm text-[var(--color-danger)]">
              <p className="mb-1 font-semibold">{t("adminValidation.summary", { defaultValue: "Please review these fields:" })}</p>
              <ul className="list-inside list-disc space-y-1">
                {serverErrors.map(({ fieldName, fieldLabel, message: validationMessage }, index) => (
                  <li key={`${fieldName}-${index}`}>
                    <button type="button" className="font-semibold underline" onClick={() => {
                      const element = fieldRefs.current[fieldName];
                      (element?.querySelector?.('[data-field-focus-target="true"],input:not([type=hidden]),button,select,textarea') || element)?.focus?.();
                      element?.scrollIntoView?.({ block: "center", behavior: "smooth" });
                    }}>{fieldLabel}</button>: {validationMessage}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {fields.map((field, index) => {
            const watchedValue = watch(field.name);
            const fieldError = errors[field.name];
            const invalidClass = fieldError ? "border-[var(--color-danger)] bg-[color:var(--color-danger)]/5" : "border-[var(--color-border)]";
            const inputErrorMessage = getFieldRuleMessage(field.name, fieldError, t("common.fieldRequired"));
            const fieldRules = getFieldRules(field, t);
            const fieldLabel = t(field.labelKey || `adminValidation.fields.${field.name}`, { defaultValue: field.label || field.name });
            const helperText = getFieldHelperText(field, t, fieldLabel);
            // register once and preserve RHF ref while also keeping a local element reference
            const reg = register(field.name, { ...fieldRules });
            const { ref: registerRef, ...registerProps } = reg || {};

            const beginsSection = field.section && field.section !== fields[index - 1]?.section;

            return (
              <Fragment key={field.name}>
                {beginsSection && (
                  <h3 className="border-t border-[var(--color-border)] pt-5 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)] first:border-t-0 first:pt-0">
                    {t(field.sectionKey, { defaultValue: field.section })}
                  </h3>
                )}
                <div ref={(element) => { fieldRefs.current[field.name] = element; }}>
                <label id={`${field.name}-label`} htmlFor={field.type === "boolean" || field.type === "gallery" || field.type === "image" || field.type === "relation" ? undefined : field.name} className="mb-1.5 block font-mono text-xs text-[var(--color-text-muted)]">
                  {fieldLabel}
                  {field.required && <span className="text-[var(--color-danger)]"> *</span>}
                </label>
                {helperText && <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">{helperText}</p>}

                {field.type === "textarea" && (
                  <textarea
                    id={field.name}
                    rows={3}
                    {...registerProps}
                    onChange={(e) => {
                      registerProps.onChange?.(e);
                      clearErrors(field.name);
                    }}
                    aria-invalid={Boolean(fieldError)}
                    aria-describedby={fieldError ? `${field.name}-error` : undefined}
                    ref={(element) => {
                      if (typeof registerRef === "function") registerRef(element);
                      fieldRefs.current[field.name] = element;
                    }}
                    className={`w-full resize-none rounded-[var(--radius-md)] border bg-transparent px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] ${invalidClass}`}
                  />
                )}

                {/* character counter for textarea / text / array when maxLength or min defined */}
                {(field.type === "textarea" || field.type === "text" || field.type === "array") && (fieldRules.maxLength || field.min) && (
                  <div className="admin-form-counter mt-1 flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
                    <div>
                      {(() => {
                        const str = String(watchedValue ?? "");
                        const len = str.trim().length;
                        if (fieldRules.maxLength) return t("admin.resources.shared.charactersOf", { current: len, max: fieldRules.maxLength.value ?? fieldRules.maxLength });
                        return t("admin.resources.shared.characters", { current: len });
                      })()}
                    </div>
                    {field.min ? <div className={`ms-2 text-[10px] ${watchedValue && watchedValue.trim().length < field.min ? 'text-[var(--color-danger)]' : ''}`}>{t("admin.resources.shared.helpers.minimum", { field: fieldLabel, min: field.min })}</div> : null}
                  </div>
                )}

                {field.type === "select" && (
                  <select
                    id={field.name}
                    {...registerProps}
                    onChange={(e) => {
                      registerProps.onChange?.(e);
                      clearErrors(field.name);
                    }}
                    aria-invalid={Boolean(fieldError)}
                    aria-describedby={fieldError ? `${field.name}-error` : undefined}
                    ref={(element) => {
                      if (typeof registerRef === "function") registerRef(element);
                      fieldRefs.current[field.name] = element;
                    }}
                    className={`w-full rounded-[var(--radius-md)] border bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] ${invalidClass}`}
                  >
                    {field.options.map((opt, optionIndex) => (
                      <option key={opt} value={opt}>
                        {field.optionLabelKeys?.[optionIndex] ? t(field.optionLabelKeys[optionIndex], { defaultValue: opt }) : opt}
                      </option>
                    ))}
                  </select>
                )}

                {field.type === "boolean" && (
                  <label className="admin-form-inline-label flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                    <input
                      id={field.name}
                      type="checkbox"
                      aria-labelledby={`${field.name}-label`}
                      {...register(field.name, {
                        ...fieldRules,
                        onChange: () => clearErrors(field.name),
                      })}
                      className="h-4 w-4 accent-[var(--color-primary)]"
                    />
                    {t("common.yes")}
                  </label>
                )}

                {field.type === "image" && (
                  <Controller
                    name={field.name}
                    control={control}
                    rules={fieldRules}
                    render={({ field: { value, onChange } }) => (
                      <ImageUploadField
                        label={fieldLabel}
                        value={value}
                        ariaInvalid={Boolean(fieldError)}
                        ariaDescribedBy={fieldError ? `${field.name}-error` : undefined}
                        ariaLabelledBy={`${field.name}-label`}
                        uploadOnly={field.name === "thumbnail"}
                        usedIn={field.name === "thumbnail" ? "project" : field.name === "image" ? "certification" : "other"}
                        onChange={(v) => {
                          clearErrors(field.name);
                          onChange(v);
                        }}
                      />
                    )}
                  />
                )}

                {field.type === "gallery" && (
                  <Controller
                    name={field.name}
                    control={control}
                    rules={fieldRules}
                    render={({ field: { value, onChange } }) => (
                      <GalleryUploadField
                        value={value}
                        ariaInvalid={Boolean(fieldError)}
                        ariaDescribedBy={fieldError ? `${field.name}-error` : undefined}
                        ariaLabelledBy={`${field.name}-label`}
                        onChange={(v) => {
                          clearErrors(field.name);
                          onChange(v);
                        }}
                      />
                    )}
                  />
                )}

                {field.type === "relation" && (
                  <Controller
                    name={field.name}
                    control={control}
                    rules={fieldRules}
                    render={({ field: { value, onChange } }) => (
                    <RelationMultiSelect
                      endpoint={field.relationEndpoint}
                      labelKey={field.relationLabelKey}
                      value={value}
                      ariaInvalid={Boolean(fieldError)}
                      ariaDescribedBy={fieldError ? `${field.name}-error` : undefined}
                      ariaLabelledBy={`${field.name}-label`}
                      onChange={(v) => {
                          clearErrors(field.name);
                          onChange(v);
                        }}
                      />
                    )}
                  />
                )}

                {(field.type === "text" || field.type === "array") && (
                  <input
                      id={field.name}
                      type="text"
                      dir={/(url|github|demo|documentation|email|phone|slug|credentialId|verificationUrl)/i.test(field.name) ? "ltr" : undefined}
                      {...registerProps}
                      onChange={(e) => {
                        if (field.name === "slug") e.target.value = e.target.value.trimStart().toLowerCase();
                        registerProps.onChange?.(e);
                        clearErrors(field.name);
                      }}
                      aria-invalid={Boolean(fieldError)}
                      aria-describedby={fieldError ? `${field.name}-error` : undefined}
                      ref={(element) => {
                        if (typeof registerRef === "function") registerRef(element);
                        fieldRefs.current[field.name] = element;
                      }}
                      className={`w-full rounded-[var(--radius-md)] border bg-transparent px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] ${invalidClass}`}
                    />
                )}

                {field.type === "number" && (
                  <input
                    id={field.name}
                    type="number"
                    min={field.min}
                    max={field.max}
                    {...registerProps}
                    onChange={(e) => {
                      registerProps.onChange?.(e);
                      clearErrors(field.name);
                    }}
                    aria-invalid={Boolean(fieldError)}
                    aria-describedby={fieldError ? `${field.name}-error` : undefined}
                    ref={(element) => {
                      if (typeof registerRef === "function") registerRef(element);
                      fieldRefs.current[field.name] = element;
                    }}
                    className={`w-full rounded-[var(--radius-md)] border bg-transparent px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] ${invalidClass}`}
                  />
                )}

                {field.type === "date" && (
                  <input
                    id={field.name}
                    type="date"
                    {...registerProps}
                    onChange={(e) => {
                      registerProps.onChange?.(e);
                      clearErrors(field.name);
                    }}
                    aria-invalid={Boolean(fieldError)}
                    aria-describedby={fieldError ? `${field.name}-error` : undefined}
                    ref={(element) => {
                      if (typeof registerRef === "function") registerRef(element);
                      fieldRefs.current[field.name] = element;
                    }}
                    className={`w-full rounded-[var(--radius-md)] border bg-transparent px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] ${invalidClass}`}
                  />
                )}

                {fieldError && (
                  <p id={`${field.name}-error`} role="alert" className="mt-1 text-xs text-[var(--color-danger)]">
                    {inputErrorMessage}
                  </p>
                )}
                </div>
              </Fragment>
            );
          })}

          <div className="flex justify-end gap-3 border-t border-[var(--color-border)] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isTranslating}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 font-mono text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSaving || isTranslating}
              className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 font-mono text-sm font-medium text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
            >
              {isTranslating ? t("common.saving") : isSaving ? t("common.saving") : t("common.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
