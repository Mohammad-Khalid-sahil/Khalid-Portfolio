import { useAuthStore } from "@/store/useAuthStore";
import { roleCan } from "@/config/rbac";

export function usePermissions() {
  const role = useAuthStore((state) => state.user?.role);

  return {
    role,
    isAdmin: role === "admin",
    can: (permission) => roleCan(role, permission),
  };
}
