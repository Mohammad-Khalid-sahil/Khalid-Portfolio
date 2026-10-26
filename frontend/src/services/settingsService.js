import api from "./api";
import { cleanBrandName } from "@/utils/displayContent";

export function getSettings(locale = "en") {
  return api.get("/settings", { params: { lang: locale } }).then((res) => {
    if (!res.data) return null;
    return { ...res.data, siteTitle: cleanBrandName(res.data.siteTitle) };
  });
}
