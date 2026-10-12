import { FaFacebookF, FaGithub, FaInstagram, FaLinkedinIn, FaTelegram, FaWhatsapp } from "react-icons/fa6";
import { FiMail } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { SHOW_UNCONFIGURED_SOCIALS, SOCIAL_PLATFORMS, resolveSocialHref } from "@/config/socialLinks";

const ICONS = {
  github: FaGithub,
  linkedin: FaLinkedinIn,
  facebook: FaFacebookF,
  whatsapp: FaWhatsapp,
  telegram: FaTelegram,
  instagram: FaInstagram,
  email: FiMail,
};

const ICON_SIZE = { sm: 14, md: 16, lg: 18 };

/**
 * Professional social icon row with hover motion, tooltips and accessible
 * labels. Real URLs come from the profile (admin) or `config/socialLinks.js`.
 */
export default function SocialLinks({ profile, size = "md", className = "", tooltipSide = "top", showUnconfigured = SHOW_UNCONFIGURED_SOCIALS, platforms }) {
  const { t } = useTranslation();
  const list = SOCIAL_PLATFORMS
    .filter((platform) => !platforms || platforms.includes(platform.key))
    .map((platform, fallbackOrder) => {
      const saved = profile?.socialSettings?.find((item) => item.platform === platform.key);
      return { ...platform, href: resolveSocialHref(platform, profile), enabled: saved?.enabled ?? true, order: saved?.order ?? fallbackOrder };
    })
    .filter((platform) => platform.enabled && (platform.href || showUnconfigured))
    .sort((a, b) => a.order - b.order);

  if (!list.length) return null;

  const sizeClass = size === "sm" ? "ds-social--sm" : size === "lg" ? "ds-social--lg" : "";

  return (
    <ul className={`flex flex-wrap items-center gap-2.5 ${className}`} aria-label={t("social.label")}>
      {list.map(({ key, labelKey, href, brand }) => {
        const Icon = ICONS[key];
        const label = t(labelKey);
        const style = { "--brand": brand };
        const isExternal = href && !href.startsWith("mailto:");
        return (
          <li key={key}>
            {href ? (
              <a
                href={href}
                {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                aria-label={label}
                title={label}
                data-tooltip={label}
                data-tooltip-side={tooltipSide}
                className={`ds-social ${sizeClass}`}
                style={style}
              >
                <Icon size={ICON_SIZE[size] || 16} aria-hidden="true" />
              </a>
            ) : (
              <span
                role="img"
                aria-disabled="true"
                aria-label={t("social.comingSoon", { platform: label })}
                data-tooltip={t("social.comingSoon", { platform: label })}
                data-tooltip-side={tooltipSide}
                tabIndex={0}
                className={`ds-social ${sizeClass}`}
                style={style}
              >
                <Icon size={ICON_SIZE[size] || 16} aria-hidden="true" />
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
