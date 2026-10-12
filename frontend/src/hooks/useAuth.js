import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import i18n from "@/i18n";
import { login as loginRequest, logout as logoutRequest } from "@/services/authService";
import { useAuthStore } from "@/store/useAuthStore";

export function useAuth() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  const loginMutation = useMutation({
    mutationFn: ({ email, password }) => loginRequest(email, password),
    onSuccess: (data) => {
      setSession(data.accessToken, data.user);
      toast.success(i18n.t("common.loggedInSuccess"));
      navigate("/admin");
    },
    onError: (err) => toast.error(err.message || i18n.t("common.loginFailed")),
  });

  async function logout() {
    try {
      await logoutRequest();
    } catch {
      // proceed to clear local session even if the request fails
    }
    clearSession();
    navigate("/admin/login");
  }

  return {
    user,
    isAuthenticated: Boolean(accessToken),
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error?.message || null,
    logout,
  };
}
