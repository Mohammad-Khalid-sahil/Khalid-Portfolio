import api from "@/services/api";

function hasContent(value) {
  return Array.isArray(value) ? value.some((item) => String(item || "").trim()) : String(value || "").trim().length > 0;
}

function comparable(value) {
  if (Array.isArray(value)) return JSON.stringify(value.map((item) => String(item || "").trim()).filter(Boolean));
  return String(value || "").trim();
}

/** Translate only changed English copy, preserving existing translations for untouched fields. */
export async function addAdminTranslations(resource, payload, fields, original = {}, existing = {}) {
  const changed = {};
  const touched = [];
  for (const field of fields) {
    const current = payload[field];
    const unchanged = comparable(current) === comparable(original[field]);
    const hasBothLocales = hasContent(existing?.fa?.[field]) && hasContent(existing?.ps?.[field]);
    if (unchanged && (!hasContent(current) || hasBothLocales)) continue;
    touched.push(field);
    if (hasContent(current)) changed[field] = current;
  }

  const translations = {
    fa: { ...(existing?.fa || {}) },
    ps: { ...(existing?.ps || {}) },
  };
  let generated = { fa: {}, ps: {} };
  let complete = true;
  if (Object.keys(changed).length) {
    try {
      const response = await api.post("/cms-translations/translate", { resource, content: changed });
      generated = response.data?.translations || generated;
    } catch {
      complete = false;
    }
  }

  for (const field of touched) {
    for (const locale of ["fa", "ps"]) {
      if (complete) {
        delete translations[locale][field];
        if (Object.prototype.hasOwnProperty.call(generated[locale] || {}, field)) {
          translations[locale][field] = generated[locale][field];
        }
      } else if (Object.prototype.hasOwnProperty.call(changed, field)) {
        // Do not leave a stale translation attached to newly edited English text.
        delete translations[locale][field];
      }
    }
  }

  const saved = Object.fromEntries(Object.entries(translations).filter(([, values]) => Object.keys(values).length));
  return {
    payload: { ...payload, ...(Object.keys(saved).length ? { translations: saved } : { translations: {} }) },
    complete,
  };
}
