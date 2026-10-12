import { useQuery } from "@tanstack/react-query";
import { getExperiences, getEducationList, getCertifications } from "@/services/careerService";
import { useUIStore } from "@/store/useUIStore";

export function useExperiences() {
  const locale = useUIStore((state) => state.language);
  return useQuery({ queryKey: ["experiences", locale], queryFn: () => getExperiences(locale), staleTime: 5 * 60 * 1000 });
}

export function useEducationList() {
  const locale = useUIStore((state) => state.language);
  return useQuery({ queryKey: ["education", locale], queryFn: () => getEducationList(locale), staleTime: 5 * 60 * 1000 });
}

export function useCertifications() {
  const locale = useUIStore((state) => state.language);
  return useQuery({ queryKey: ["certifications", locale], queryFn: () => getCertifications(locale), staleTime: 5 * 60 * 1000 });
}
