import { API_BASE_URL } from "@/config/apiBaseUrl";
const SESSION_KEY = "portfolio_analytics_session";

function getSessionId() {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id =
      window.crypto?.randomUUID?.() ||
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return "";
  }
}

function canTrack() {
  if (typeof window === "undefined") return false;
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
