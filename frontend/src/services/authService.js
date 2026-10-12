import api from "./api";

export function login(email, password) {
  return api.post("/auth/login", { email, password }).then((res) => res.data);
}

export function logout() {
  return api.post("/auth/logout");
}

export function getMe() {
  return api.get("/auth/me").then((res) => res.data);
}

export function refreshSession() {
  return api.post("/auth/refresh").then((res) => res.data.accessToken);
}
