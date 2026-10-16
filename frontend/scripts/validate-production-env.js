import { loadEnv } from "vite";
const loaded = loadEnv("production", process.cwd(), "");
const configured = (name) => process.env[name] || loaded[name] || "";
function requireHttpsUrl(name, options = {}) {
  const value = configured(name).trim();
  if (!value) throw new Error("[frontend env] " + name + " is required for a production build.");
  let url;
  try { url = new URL(value); } catch { throw new Error("[frontend env] " + name + " must be a valid absolute HTTPS URL."); }
  const host = url.hostname.toLowerCase();
  const reservedHost = host === "example.com" || [".example.com", ".example.org", ".example", ".invalid", ".test", ".localhost", ".local"].some((suffix) => host.endsWith(suffix));
  if (url.protocol !== "https:" || ["localhost", "127.0.0.1", "::1"].includes(host) || reservedHost) {
    throw new Error("[frontend env] " + name + " must use a real HTTPS production host, not localhost or an example placeholder.");
  }
  if (url.username || url.password || url.search || url.hash) throw new Error("[frontend env] " + name + " must not contain credentials, query parameters, or a fragment.");
  if (!options.api && url.pathname !== "/") throw new Error("[frontend env] " + name + " must be an origin without a path.");
  if (options.api && url.pathname.replace(/\/+$/, "") !== "/api") throw new Error("[frontend env] " + name + " must use exactly the /api path.");
}
requireHttpsUrl("VITE_API_URL", { api: true });
requireHttpsUrl("VITE_SITE_URL");
