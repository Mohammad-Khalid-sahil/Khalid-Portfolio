import { useQuery } from "@tanstack/react-query";
import { getGithubProfile, getGithubRepos } from "@/services/githubService";

export function useGithubProfile() {
  return useQuery({
    queryKey: ["github", "profile"],
    queryFn: getGithubProfile,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
}

export function useGithubRepos(limit = 6) {
  return useQuery({
    queryKey: ["github", "repos", limit],
    queryFn: () => getGithubRepos(limit),
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
}
