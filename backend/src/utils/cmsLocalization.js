const SUPPORTED_LOCALES = new Set(["en", "fa", "ps"]);

export function resolveCmsLocale(value) {
  const locale = String(value || "en").toLowerCase();
  return SUPPORTED_LOCALES.has(locale) ? locale : "en";
}

export function localizeCmsContent(input, localeValue = "en") {
  const locale = resolveCmsLocale(localeValue);
  if (Array.isArray(input)) return input.map((item) => localizeCmsContent(item, locale));
  if (!input || typeof input !== "object" || input instanceof Date) return input;
  const source = typeof input.toObject === "function" ? input.toObject() : input;
  if (source._bsontype || source.constructor?.name === "ObjectId") return source;
  const result = {};
  for (const [key, value] of Object.entries(source)) if (key !== "translations") result[key] = localizeCmsContent(value, locale);
  const translations = source.translations;
  if (translations && typeof translations === "object") {
    const requested = translations[locale] || {};
    const english = translations.en || {};
    for (const field of new Set([...Object.keys(english), ...Object.keys(requested)])) {
      const value = requested[field]; const fallback = english[field];
      if (value !== undefined && value !== null && value !== "") result[field] = value;
      else if (fallback !== undefined && fallback !== null && fallback !== "") result[field] = fallback;
    }
  }
  return result;
}
