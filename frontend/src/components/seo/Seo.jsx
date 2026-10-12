import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useProfile } from "@/hooks/queries/useProfile";
import { useSettings } from "@/hooks/queries/useSettings";

const FALLBACK_TITLE = "Mohammad Khalid | Full-Stack Developer";
const FALLBACK_DESCRIPTION = "Software engineer and full-stack developer building web, mobile, and backend products.";
const DEFAULT_KEYWORDS = ["full-stack developer", "software engineer", "React", "Node.js", "Flutter", "MongoDB"];
const EMPTY_JSON_LD = [];

export function siteUrl(settings) {
  const configured = settings?.seo?.siteUrl || import.meta.env.VITE_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function absoluteUrl(value, settings) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${siteUrl(settings)}${value.startsWith("/") ? value : `/${value}`}`;
}

function setMeta(selector, attrs) {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement("meta");
    document.head.appendChild(tag);
  }
  Object.entries(attrs).forEach(([key, value]) => {
    if (value) tag.setAttribute(key, value);
  });
}

function setLink(selector, attrs) {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement("link");
    document.head.appendChild(tag);
  }
  Object.entries(attrs).forEach(([key, value]) => {
    if (value) tag.setAttribute(key, value);
  });
}

function removeManagedMeta(selectors) {
  selectors.forEach((selector) => {
    document.head.querySelectorAll(selector).forEach((tag) => tag.remove());
  });
}

function jsonLdScript(data) {
  if (!data || Object.keys(data).length === 0) return;
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.dataset.seoJsonLd = "true";
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

function compact(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ""));
  }
  return value;
}

function compactDeep(value) {
  if (Array.isArray(value)) return value.map(compactDeep).filter((item) => item !== undefined && item !== null && item !== "");
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [key, compactDeep(item)])
        .filter(([, item]) => {
          if (item === undefined || item === null || item === "") return false;
          if (Array.isArray(item) && item.length === 0) return false;
          if (typeof item === "object" && !Array.isArray(item) && Object.keys(item).length === 0) return false;
          return true;
        })
    );
  }
  return value;
}

export function buildPersonSchema(profile, settings) {
  const name = profile?.name || "Mohammad Khalid";
  return compactDeep({
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    jobTitle: profile?.title || "Full-Stack Developer",
    description: profile?.bio || settings?.siteDescription || FALLBACK_DESCRIPTION,
    image: absoluteUrl(profile?.avatar, settings),
    url: siteUrl(settings),
    email: profile?.email,
    telephone: profile?.phone,
    address: profile?.location
      ? {
          "@type": "PostalAddress",
          addressLocality: profile.location,
        }
      : undefined,
    sameAs: compact([
      profile?.social?.github,
      profile?.social?.linkedin,
      profile?.social?.telegram,
      profile?.social?.facebook,
      profile?.social?.instagram,
    ]),
  });
}

export function buildWebsiteSchema(settings) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings?.siteTitle || FALLBACK_TITLE,
    url: siteUrl(settings),
  };
}

export function buildBreadcrumbSchema(items, settings) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path, settings),
    })),
  };
}

export function buildArticleSchema({ post, title, description, canonical, image }, settings) {
  return compactDeep({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    image: image ? [absoluteUrl(image, settings)] : undefined,
    datePublished: post?.publishedAt,
    dateModified: post?.updatedAt,
    author: post?.author?.name ? { "@type": "Person", name: post.author.name } : undefined,
    publisher: {
      "@type": "Person",
      name: post?.author?.name || "Mohammad Khalid",
    },
    mainEntityOfPage: absoluteUrl(canonical, settings),
  });
}

export function buildProjectSchema({ project, canonical, description }, settings) {
  return compactDeep({
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project?.title,
    description,
    image: absoluteUrl(project?.thumbnail, settings),
    url: absoluteUrl(canonical, settings),
    keywords: project?.seoKeywords?.length ? project.seoKeywords.join(", ") : project?.technologies?.join(", "),
    dateCreated: project?.createdAt,
    dateModified: project?.updatedAt,
    creator: {
      "@type": "Person",
      name: "Mohammad Khalid",
    },
    sameAs: [project?.github, project?.demo].filter(Boolean),
  });
}

export default function Seo({
  title,
  description,
  keywords,
  path,
  image,
  type = "website",
  twitterCard = "summary_large_image",
  noIndex = false,
  jsonLd = EMPTY_JSON_LD,
  article,
}) {
  const { data: settings } = useSettings();
  const { data: profile } = useProfile();
  const { i18n } = useTranslation();

  useEffect(() => {
    const baseTitle = settings?.seo?.metaTitle || settings?.siteTitle || FALLBACK_TITLE;
    const finalTitle = title ? `${title} | ${baseTitle}` : baseTitle;
    const finalDescription = description || settings?.seo?.metaDescription || settings?.siteDescription || FALLBACK_DESCRIPTION;
    const finalKeywords = keywords?.length ? keywords : settings?.seo?.keywords?.length ? settings.seo.keywords : DEFAULT_KEYWORDS;
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
    const canonical = absoluteUrl(path || currentPath, settings);
    const finalImage = absoluteUrl(image || settings?.seo?.ogImage || profile?.avatar || "/favicon.svg", settings);
    const siteName = settings?.siteTitle || FALLBACK_TITLE;
    const language = i18n.resolvedLanguage || i18n.language || settings?.defaultLanguage || "en";
    const locale = language.startsWith("fa") ? "fa_AF" : language.startsWith("ps") ? "ps_AF" : "en_US";

    document.title = finalTitle;
    setMeta('meta[name="description"]', { name: "description", content: finalDescription });
    setMeta('meta[name="keywords"]', { name: "keywords", content: finalKeywords.join(", ") });
    setMeta('meta[name="robots"]', { name: "robots", content: noIndex ? "noindex,nofollow" : "index,follow" });
    setLink('link[rel="canonical"]', { rel: "canonical", href: canonical });

    setMeta('meta[property="og:title"]', { property: "og:title", content: finalTitle });
    setMeta('meta[property="og:description"]', { property: "og:description", content: finalDescription });
    setMeta('meta[property="og:type"]', { property: "og:type", content: type });
    setMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
    setMeta('meta[property="og:image"]', { property: "og:image", content: finalImage });
    setMeta('meta[property="og:image:alt"]', { property: "og:image:alt", content: finalTitle });
    setMeta('meta[property="og:site_name"]', { property: "og:site_name", content: siteName });
    setMeta('meta[property="og:locale"]', { property: "og:locale", content: locale });

    setMeta('meta[name="twitter:card"]', { name: "twitter:card", content: twitterCard });
    setMeta('meta[name="twitter:title"]', { name: "twitter:title", content: finalTitle });
    setMeta('meta[name="twitter:description"]', { name: "twitter:description", content: finalDescription });
    setMeta('meta[name="twitter:image"]', { name: "twitter:image", content: finalImage });
    setMeta('meta[name="twitter:image:alt"]', { name: "twitter:image:alt", content: finalTitle });

    removeManagedMeta([
      'meta[property="article:published_time"]',
      'meta[property="article:modified_time"]',
      'meta[property="article:author"]',
      'meta[property="article:section"]',
      'meta[property="article:tag"][data-seo-managed="true"]',
    ]);

    if (type === "article" && article) {
      setMeta('meta[property="article:published_time"]', { property: "article:published_time", content: article.publishedTime });
      setMeta('meta[property="article:modified_time"]', { property: "article:modified_time", content: article.modifiedTime });
      setMeta('meta[property="article:author"]', { property: "article:author", content: article.author });
      setMeta('meta[property="article:section"]', { property: "article:section", content: article.section });
      article.tags?.filter(Boolean).forEach((tagName) => {
        const tag = document.createElement("meta");
        tag.setAttribute("property", "article:tag");
        tag.setAttribute("content", tagName);
        tag.dataset.seoManaged = "true";
        document.head.appendChild(tag);
      });
    }

    document.head.querySelectorAll('script[data-seo-json-ld="true"]').forEach((tag) => tag.remove());
    const schemas = [buildWebsiteSchema(settings), buildPersonSchema(profile, settings), ...jsonLd].filter(Boolean);
    schemas.forEach(jsonLdScript);
  }, [article, description, i18n, image, jsonLd, keywords, noIndex, path, profile, settings, title, twitterCard, type]);

  return null;
}
