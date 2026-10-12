/** Strip a leading `// comment` prefix that must never appear as UI copy. */
export function stripCommentSyntax(value) {
  if (value == null) return value;
  return String(value).replace(/^\/\/\s*/, "").trim();
}

/**
 * Brand/name strings sometimes arrive as JSX-style wrappers or Markdown links
 * from earlier placeholders, e.g. `[<Mohammad />](http://localhost:5173/)`.
 */
export function cleanBrandName(value) {
  if (!value || typeof value !== "string") return "";
  let text = value.trim();
  const markdownLink = text.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  if (markdownLink) text = markdownLink[1].trim();
  text = text.replace(/^<\s*/, "").replace(/\s*\/>$/, "").replace(/^<\s*/, "").replace(/\s*>$/, "").trim();
  return text;
}

export function isLocalHostUrl(value) {
  return /localhost|127\.0\.0\.1/i.test(String(value || ""));
}

export function initialsFromName(name) {
  const parts = String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!parts.length) return "";
  return parts.map((part) => part[0]).join("").toUpperCase();
}
