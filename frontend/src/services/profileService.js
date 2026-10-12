import api from "./api";
import { cleanBrandName } from "@/utils/displayContent";

export function getProfile(locale = "en") {
  return api.get("/profile", { params: { locale } }).then((res) => {
    if (!res.data) return null;
    return { ...res.data, name: cleanBrandName(res.data.name) };
  });
}
