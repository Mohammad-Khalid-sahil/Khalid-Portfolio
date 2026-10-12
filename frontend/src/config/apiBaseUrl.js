const configuredApiBaseUrl = import.meta.env.VITE_API_URL?.trim();
const localApiBaseUrl = import.meta.env.DEV ? "http://127.0.0.1:5000/api" : "";

if (!configuredApiBaseUrl && !localApiBaseUrl) {
  throw new Error("VITE_API_URL must be configured for production.");
}

export const API_BASE_URL = (configuredApiBaseUrl || localApiBaseUrl).replace(/\/+$/, "");
