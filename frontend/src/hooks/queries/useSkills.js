import { useQuery } from "@tanstack/react-query";
import { getSkills } from "@/services/skillService";
import { useUIStore } from "@/store/useUIStore";

export function useSkills() {
  const locale = useUIStore((state) => state.language);
  return useQuery({
    queryKey: ["skills", locale],
    queryFn: () => getSkills(locale),
    staleTime: 5 * 60 * 1000,
  });
}
