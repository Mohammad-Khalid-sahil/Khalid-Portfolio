import api from "./api";

export function getServices(locale = "en") {
  return api.get("/services", { params: { locale } }).then((res) => res.data);
}
