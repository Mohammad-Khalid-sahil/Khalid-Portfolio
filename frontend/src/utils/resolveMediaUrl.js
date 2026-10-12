import { API_BASE_URL } from "@/config/apiBaseUrl";

/**
 * Resolve media URLs stored by the API against the configured API origin.
 * Older records may contain localhost URLs, which point to the visitor\x27s
 * own machine after deployment and can resolve to the wrong local listener.
 */
export function resolveMediaUrl(value) {
  const rawUrl = typeof value === "string" ? value : value && typeof value.url === "string" ? value.url : "";
  if (!rawUrl) return "";

  try {
    const apiUrl = new URL(API_BASE_URL, window.location.origin);
    const mediaUrl = new URL(rawUrl, apiUrl.origin);
    if (["localhost", "127.0.0.1", "::1", "[::1]"].includes(mediaUrl.hostname)) {
      mediaUrl.protocol = apiUrl.protocol;
      mediaUrl.host = apiUrl.host;
    }
    return mediaUrl.toString();
  } catch {
    return rawUrl;
  }
}
