import api from "./api";

export function getSkills(locale = "en") {
  return api.get("/skills", { params: { locale } }).then((res) => res.data);
}
