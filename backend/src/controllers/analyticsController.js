import Analytics from "../models/Analytics.js";
import { catchAsync } from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/sendSuccess.js";

function detectDevice(userAgent = "") {
  if (/mobile/i.test(userAgent)) return "mobile";
  if (/tablet|ipad/i.test(userAgent)) return "tablet";
  if (userAgent) return "desktop";
  return "unknown";
}

function detectBrowser(userAgent = "") {
  if (/edg/i.test(userAgent)) return "Edge";
  if (/opr|opera/i.test(userAgent)) return "Opera";
  if (/firefox/i.test(userAgent)) return "Firefox";
  if (/chrome|crios/i.test(userAgent)) return "Chrome";
  if (/safari/i.test(userAgent)) return "Safari";
  return userAgent ? "Other" : "Unknown";
}

function detectCountry(req) {
  const value =
    req.headers["cf-ipcountry"] ||
    req.headers["x-vercel-ip-country"] ||
    req.headers["x-country-code"] ||
    "";
  return String(value).slice(0, 2).toUpperCase();
}

function detectSource(referrer = "") {
  if (!referrer) return "direct";

  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
    if (/google|bing|duckduckgo|yahoo|baidu|yandex/.test(host)) return "search";
    if (/github|linkedin|twitter|x\.com|facebook|instagram|youtube|reddit/.test(host)) return "social";
    return host;
  } catch {
    return "unknown";
  }
}

export const trackEvent = catchAsync(async (req, res) => {
  const { path, referrer = "", sessionId = "", eventType = "page_view", contentType, contentId = "", contentTitle = "" } = req.body;
  const resolvedContentType =
    contentType || (eventType === "project_view" ? "project" : eventType === "blog_view" ? "blog" : "page");

  await Analytics.create({
    path,
    referrer,
    source: detectSource(referrer),
    eventType,
    contentType: resolvedContentType,
    contentId,
    contentTitle,
    country: detectCountry(req),
    sessionId,
    device: detectDevice(req.headers["user-agent"]),
    browser: detectBrowser(req.headers["user-agent"]),
  });
  sendSuccess(res, { statusCode: 201, message: "Event tracked" });
});

export const getSummary = catchAsync(async (req, res) => {
  const pageViewMatch = { eventType: "page_view" };
  const [totalViews, visitors, projectViews, blogViews, topPages, devices, browsers, sources, countries, popularContent] = await Promise.all([
    Analytics.countDocuments(pageViewMatch),
    Analytics.distinct("sessionId", { sessionId: { $ne: "" } }).then((ids) => ids.length),
    Analytics.countDocuments({ eventType: "project_view" }),
    Analytics.countDocuments({ eventType: "blog_view" }),
    Analytics.aggregate([
      { $match: pageViewMatch },
      { $group: { _id: "$path", views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 10 },
    ]),
    Analytics.aggregate([{ $group: { _id: "$device", count: { $sum: 1 } } }]),
    Analytics.aggregate([{ $group: { _id: "$browser", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Analytics.aggregate([{ $group: { _id: "$source", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Analytics.aggregate([
      { $match: { country: { $ne: "" } } },
      { $group: { _id: "$country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Analytics.aggregate([
      { $match: { eventType: { $in: ["project_view", "blog_view"] } } },
      {
        $group: {
          _id: { contentType: "$contentType", contentId: "$contentId", path: "$path" },
          title: { $last: "$contentTitle" },
          views: { $sum: 1 },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 10 },
    ]),
  ]);

  sendSuccess(res, {
    message: "Analytics summary retrieved",
    data: { totalViews, visitors, projectViews, blogViews, topPages, devices, browsers, sources, countries, popularContent },
  });
});
