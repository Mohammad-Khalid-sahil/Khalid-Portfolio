import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getMe, refreshSession } from "@/services/authService";
import { useAuthStore } from "@/store/useAuthStore";
import { SectionLoader } from "@/components/loaders/SectionLoader";

export default function ProtectedRoute() {
  const { t } = useTranslation();
  const accessToken = useAuthStore((s) => s.accessToken);
  const clearSession = useAuthStore((s) => s.clearSession);
  const setSession = useAuthStore((s) => s.setSession);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      let token = useAuthStore.getState().accessToken;
      if (!token) {
        token = await refreshSession();
        setAccessToken(token);
      }
      return getMe();
    },
    retry: false,
  });

  useEffect(() => {
    if (meQuery.data && accessToken) setSession(accessToken, meQuery.data);
  }, [accessToken, meQuery.data, setSession]);

  useEffect(() => {
    if (meQuery.isError) clearSession();
  }, [clearSession, meQuery.isError]);

  if (meQuery.isLoading || meQuery.isFetching) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--color-background)]">
        <SectionLoader label={t("common.checkingSession")} />
      </main>
    );
  }
  if (meQuery.isError) return <Navigate to="/admin/login" replace />;

  return <Outlet />;
}
