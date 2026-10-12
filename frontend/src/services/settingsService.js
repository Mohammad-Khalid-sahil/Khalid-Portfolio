import api from "./api";
import { cleanBrandName } from "@/utils/displayContent";

export function getSettings() {
  return api.get("/settings").then((res) => {
    if (!res.data) return null;
    return { ...res.data, siteTitle: cleanBrandName(res.data.siteTitle) };
  });
}
