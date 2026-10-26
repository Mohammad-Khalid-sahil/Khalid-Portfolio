import { useQuery } from "@tanstack/react-query";
import { getSettings } from "@/services/settingsService";
import i18n from "@/i18n";

export function useSettings() {
  return useQuery({
    queryKey: ["settings", i18n.language],
    queryFn: () => getSettings(i18n.language),
    staleTime: 10 * 60 * 1000,
  });
}
