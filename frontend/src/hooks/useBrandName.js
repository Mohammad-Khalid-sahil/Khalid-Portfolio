import { useProfile } from "@/hooks/queries/useProfile";
import { useSettings } from "@/hooks/queries/useSettings";
import { cleanBrandName } from "@/utils/displayContent";

const FALLBACK_NAME = "Portfolio";

export function useBrandName() {
  const { data: profile } = useProfile();
  const { data: settings } = useSettings();
  const fromProfile = cleanBrandName(profile?.name);
  const fromSettings = cleanBrandName(settings?.siteTitle);
  if (fromProfile) return fromProfile;
  if (fromSettings) return fromSettings.split(/[—–|-]/)[0].trim() || fromSettings;
  return FALLBACK_NAME;
}
