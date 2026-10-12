import { useQuery } from "@tanstack/react-query";
import { getPosts, getPostBySlug } from "@/services/blogService";
import { useUIStore } from "@/store/useUIStore";

export function usePosts(params) {
  const locale = useUIStore((state) => state.language);
  return useQuery({
    queryKey: ["posts", locale, params],
    queryFn: () => getPosts({ ...params, locale }),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePost(slug) {
  const locale = useUIStore((state) => state.language);
  return useQuery({
    queryKey: ["post", slug, locale],
    queryFn: () => getPostBySlug(slug, locale),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
  });
}
