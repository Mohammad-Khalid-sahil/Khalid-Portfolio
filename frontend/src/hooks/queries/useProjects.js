import { useQuery } from "@tanstack/react-query";
import { getProjects, getProjectBySlug } from "@/services/projectService";
import { useUIStore } from "@/store/useUIStore";

export function useProjects(params) {
  const locale = useUIStore((state) => state.language);
  return useQuery({
    queryKey: ["projects", locale, params],
    queryFn: () => getProjects({ ...params, locale }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProject(slug) {
  const locale = useUIStore((state) => state.language);
  return useQuery({
    queryKey: ["project", slug, locale],
    queryFn: () => getProjectBySlug(slug, locale),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
  });
}
