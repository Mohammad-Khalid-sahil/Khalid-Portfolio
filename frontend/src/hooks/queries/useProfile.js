import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/services/profileService";
import { useUIStore } from "@/store/useUIStore";

export function useProfile() {
  const locale = useUIStore((state) => state.language);
  return useQuery({
    queryKey: ["profile", locale],
    queryFn: () => getProfile(locale),
    staleTime: 5 * 60 * 1000,
  });
}
