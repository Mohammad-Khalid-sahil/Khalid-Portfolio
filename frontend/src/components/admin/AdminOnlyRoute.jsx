import { Navigate, Outlet } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";

export default function AdminOnlyRoute() {
  const { isAdmin } = usePermissions();

  if (!isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
