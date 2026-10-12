import BlogPost from "../models/BlogPost.js";
import Project from "../models/Project.js";
import Settings from "../models/Settings.js";
import { env } from "../config/env.js";
import { catchAsync } from "../utils/catchAsync.js";

const STATIC_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/about", priority: "0.8", changefreq: "monthly" },
  { path: "/skills", priority: "0.8", changefreq: "monthly" },
  { path: "/services", priority: "0.8", changefreq: "monthly" },
  { path: "/projects", priority: "0.9", changefreq: "weekly" },
  { path: "/experience", priority: "0.7", changefreq: "monthly" },
  { path: "/education", priority: "0.6", changefreq: "monthly" },
  { path: "/certifications", priority: "0.6", changefreq: "monthly" },
  { path: "/testimonials", priority: "0.6", changefreq: "monthly" },
  { path: "/resume", priority: "0.8", changefreq: "monthly" },
  { path: "/blog", priority: "0.9", changefreq: "weekly" },
  { path: "/contact", priority: "0.8", changefreq: "monthly" },
];

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function baseUrlFromSettings(settings) {
  return (settings?.seo?.siteUrl || env.CLIENT_URL).replace(/\/$/, "");
}

function absoluteUrl(baseUrl, path) {
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function formatDate(date) {
  if (!date) return undefined;
  return new Date(date).toISOString().split("T")[0];
}

function sitemapUrl({ baseUrl, path, lastmod, changefreq, priority }) {
  return [
    "  <url>",
    `    <loc>${escapeXml(absoluteUrl(baseUrl, path))}</loc>`,
    lastmod ? `    <lastmod>${escapeXml(formatDate(lastmod))}</lastmod>` : "",
    changefreq ? `    <changefreq>${escapeXml(changefreq)}</changefreq>` : "",
    priority ? `    <priority>${escapeXml(priority)}</priority>` : "",
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

export const getSitemap = catchAsync(async (req, res) => {
  const settings = await Settings.findOne().lean();
  const baseUrl = baseUrlFromSettings(settings);
  const [projects, posts] = await Promise.all([
    Project.find({ published: true }).select("slug updatedAt createdAt").sort("order -updatedAt").lean(),
    BlogPost.find({ published: true }).select("slug updatedAt publishedAt").sort("-publishedAt").lean(),
  ]);

  const urls = [
    ...STATIC_ROUTES,
    ...projects.map((project) => ({
      path: `/projects/${project.slug}`,
      lastmod: project.updatedAt || project.createdAt,
      priority: "0.8",
      changefreq: "monthly",
    })),
    ...posts.map((post) => ({
      path: `/blog/${post.slug}`,
      lastmod: post.updatedAt || post.publishedAt,
      priority: "0.7",
      changefreq: "monthly",
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((entry) => sitemapUrl({ baseUrl, ...entry }))
    .join("\n")}\n</urlset>\n`;

  res
    .set("Cache-Control", "public, max-age=300, s-maxage=300, stale-while-revalidate=86400")
    .type("application/xml")
    .send(xml);
});

export const getRobots = catchAsync(async (req, res) => {
  const settings = await Settings.findOne().lean();
  const baseUrl = baseUrlFromSettings(settings);

  res
    .set("Cache-Control", "public, max-age=3600, s-maxage=3600")
    .type("text/plain")
    .send(["User-agent: *", "Allow: /", "Disallow: /admin/", "", `Sitemap: ${absoluteUrl(baseUrl, "/sitemap.xml")}`, ""].join("\n"));
});
