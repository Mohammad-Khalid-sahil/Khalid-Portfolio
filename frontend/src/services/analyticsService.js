import { API_BASE_URL } from "@/config/apiBaseUrl";
import api from "@/services/api";
import { useAuthStore } from "@/store/useAuthStore";
const VISITOR_KEY = "portfolio_analytics_visitor";
const LEGACY_SESSION_KEY = "portfolio_analytics_session";

function getSessionId() {
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const id = window.sessionStorage.getItem(LEGACY_SESSION_KEY) ||
      window.crypto?.randomUUID?.() ||
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    try {
      return window.sessionStorage.getItem(LEGACY_SESSION_KEY) || "";
    } catch {
      return "";
    }
  }
}

function canTrack() {
  if (typeof window === "undefined") return false;
  if (useAuthStore.getState().accessToken) return false;
  return navigator.doNotTrack !== "1" && window.doNotTrack !== "1";
}

export function trackAnalyticsEvent(event) {
  if (!canTrack()) return Promise.resolve();

  const body = JSON.stringify({
    eventType: "page_view",
    contentType: "page",
    referrer: document.referrer || "",
    sessionId: getSessionId(),
    ...event,
  });

  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon(
      `${API_BASE_URL}/analytics/track`,
      new Blob([body], { type: "application/json" })
    );
    if (sent) return Promise.resolve();
  }

  return fetch(`${API_BASE_URL}/analytics/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

export function getPublicVisitorCount() {
  return api.get("/analytics/visitors").then((response) => response.data.visitors);
}
