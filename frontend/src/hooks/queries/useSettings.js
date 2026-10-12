import { useQuery } from "@tanstack/react-query";
import { getSettings } from "@/services/settingsService";

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
    staleTime: 10 * 60 * 1000,
  });
}
