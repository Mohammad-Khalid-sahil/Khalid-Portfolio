import { useQuery } from "@tanstack/react-query";
import { getServices } from "@/services/serviceOfferingService";
import { useUIStore } from "@/store/useUIStore";

export function useServiceOfferings() {
  const locale = useUIStore((state) => state.language);
  return useQuery({
    queryKey: ["services", locale],
    queryFn: () => getServices(locale),
    staleTime: 5 * 60 * 1000,
  });
}
