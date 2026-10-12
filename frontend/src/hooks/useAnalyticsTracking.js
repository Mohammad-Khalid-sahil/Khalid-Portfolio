import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackAnalyticsEvent } from "@/services/analyticsService";

export function usePageAnalyticsTracking() {
  const location = useLocation();
  const lastPath = useRef("");

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    if (lastPath.current === path) return;
    lastPath.current = path;

    trackAnalyticsEvent({ path, eventType: "page_view", contentType: "page" });
  }, [location.pathname, location.search]);
}

export function useContentAnalyticsTracking({ enabled, path, eventType, contentType, contentId, contentTitle }) {
  const lastKey = useRef("");

  useEffect(() => {
    if (!enabled || !path || !eventType || !contentType) return;
    const key = `${eventType}:${contentId || path}`;
    if (lastKey.current === key) return;
    lastKey.current = key;

    trackAnalyticsEvent({ path, eventType, contentType, contentId, contentTitle });
  }, [contentId, contentTitle, contentType, enabled, eventType, path]);
}
