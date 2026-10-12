/**
 * Escapes HTML special characters so untrusted input (contact form fields,
 * etc.) can be safely interpolated into an HTML email body without letting
 * the sender inject markup, scripts, or broken layout into the message the
 * site owner opens in their inbox.
 */
export function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
