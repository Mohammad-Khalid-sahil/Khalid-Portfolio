import i18n from "@/i18n";

// Maps our app language codes to BCP-47 locales for Intl/date formatting.
// Afghanistan-specific locale variants are used for Dari/Pashto content.
const LOCALE_MAP = {
  en: "en-US",
  fa: "fa-AF",
  ps: "ps-AF",
};

function resolveLocale() {
  return LOCALE_MAP[i18n.language] || "en-US";
}

/**
 * Formats a date respecting the current UI language. Falls back to en-US
 * if the runtime's Intl data doesn't support the target locale.
 */
export function formatLocaleDate(dateStr, options = { year: "numeric", month: "short" }) {
  if (!dateStr) return i18n.t("common.present");
  try {
    return new Date(dateStr).toLocaleDateString(resolveLocale(), options);
  } catch {
    return new Date(dateStr).toLocaleDateString("en-US", options);
  }
}

export function formatLocaleDateLong(dateStr) {
  if (!dateStr) return "";
  return formatLocaleDate(dateStr, { year: "numeric", month: "long", day: "numeric" });
}

export function formatLocaleDateTime(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleString(resolveLocale());
  } catch {
    return new Date(dateStr).toLocaleString("en-US");
  }
}
