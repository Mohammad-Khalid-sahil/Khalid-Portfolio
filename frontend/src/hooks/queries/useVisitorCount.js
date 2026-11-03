import { useQuery } from "@tanstack/react-query";
import { getPublicVisitorCount } from "@/services/analyticsService";

export function useVisitorCount() {
  return useQuery({
    queryKey: ["public-analytics", "visitors"],
    queryFn: getPublicVisitorCount,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
