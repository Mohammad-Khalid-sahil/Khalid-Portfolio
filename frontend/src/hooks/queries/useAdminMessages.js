import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";

export function useAdminMessages(enabled = true) {
  return useQuery({
    queryKey: ["admin", "messages"],
    queryFn: () => api.get("/contact/messages").then((res) => res.data),
    enabled,
  });
}
