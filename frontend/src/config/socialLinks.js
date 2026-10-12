/* Profile settings take precedence; these supplied URLs are initial public defaults. */
export const SOCIAL_PLATFORMS = [
  { key: "github", labelKey: "social.github", url: "https://github.com/Mohammad-Khalid-sahil", brand: "var(--color-text-primary)" },
  { key: "linkedin", labelKey: "social.linkedin", url: "", brand: "#0a66c2" },
  { key: "facebook", labelKey: "social.facebook", url: "https://www.facebook.com/share/1SwV66jEk2/", brand: "#1877f2" },
  { key: "whatsapp", labelKey: "social.whatsapp", url: "https://wa.me/message/5JAEVNKM5VSZG1", brand: "#25d366" },
  { key: "telegram", labelKey: "social.telegram", url: "", brand: "#26a5e4" },
  { key: "instagram", labelKey: "social.instagram", url: "", brand: "#e1306c" },
  { key: "email", labelKey: "social.email", url: "", brand: "var(--color-primary)" },
];

export const PROFILE_SOCIAL_PLATFORMS = [
  { key: "github", label: "GitHub" },
  { key: "facebook", label: "Facebook" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "telegram", label: "Telegram" },
];
export const PROFILE_SOCIAL_KEYS = PROFILE_SOCIAL_PLATFORMS.map(({ key }) => key);

/** When true, unconfigured entries can be shown as disabled placeholders. */
export const SHOW_UNCONFIGURED_SOCIALS = true;

/** Resolve saved Admin URLs, using supplied public defaults before first save. */
export function resolveSocialHref(platform, profile) {
  const managed = profile?.socialSettings?.find((item) => item.platform === platform.key);
  const isManagedPlatform = PROFILE_SOCIAL_KEYS.includes(platform.key);
  const href = managed
    ? (profile?.social?.[platform.key] || platform.url)
    : isManagedPlatform
      ? platform.url
      : (profile?.social?.[platform.key] || platform.url);
  if (!href) return platform.key === "email" && profile?.email ? "mailto:" + profile.email : "";
  try {
    const parsed = new URL(href);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? href : "";
  } catch {
    return "";
  }
}

export const DEFAULT_GITHUB_PROFILE_URL = SOCIAL_PLATFORMS.find(({ key }) => key === "github").url;

/** Use the Admin GitHub URL when valid; keep a direct public fallback otherwise. */
export function resolveGithubProfileUrl(profile) {
  const value = profile?.social?.github || DEFAULT_GITHUB_PROFILE_URL;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !["github.com", "www.github.com"].includes(url.hostname.toLowerCase())) {
      return DEFAULT_GITHUB_PROFILE_URL;
    }
    const username = url.pathname.split("/").filter(Boolean)[0] || "";
    if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(username)) return DEFAULT_GITHUB_PROFILE_URL;
    return `https://github.com/${username}`;
  } catch {
    return DEFAULT_GITHUB_PROFILE_URL;
  }
}