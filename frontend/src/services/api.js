import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";
import { API_BASE_URL } from "@/config/apiBaseUrl";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // send the httpOnly refresh-token cookie
  headers: { "Content-Type": "application/json" },
});

// Attach the admin access token, if present, to every outgoing request.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise = null;

function canRefreshAfter401(url = "") {
  return !["/auth/login", "/auth/refresh", "/auth/logout"].some((authPath) => url.includes(authPath));
}

// On a 401, try refreshing the access token once via the httpOnly cookie,
// then retry the original request. If refresh also fails, clear the
// session so the UI can redirect to /admin/login.
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;

    if (status === 401 && !originalRequest._retry && canRefreshAfter401(originalRequest.url)) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true })
            .then((res) => res.data.data.accessToken)
            .finally(() => {
              refreshPromise = null;
            });
        }
        const newToken = await refreshPromise;
        useAuthStore.getState().setAccessToken(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        useAuthStore.getState().clearSession();
      }
    }

    const data = error?.response?.data;
    const message = data?.message || "Something went wrong. Please try again.";

    const customError = new Error(message);
    customError.status = status;
    customError.details = data?.details || null;
    customError.response = error.response;

    return Promise.reject(customError);
  }
);

export default api;
