import { useQuery } from "@tanstack/react-query";
import { getTestimonials } from "@/services/testimonialService";
import { useUIStore } from "@/store/useUIStore";

export function useTestimonials() {
  const locale = useUIStore((state) => state.language);
  return useQuery({
    queryKey: ["testimonials", locale],
    queryFn: () => getTestimonials(locale),
    staleTime: 5 * 60 * 1000,
  });
}
