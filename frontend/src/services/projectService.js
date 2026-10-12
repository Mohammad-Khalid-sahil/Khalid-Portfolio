import api from "./api";

export function getProjects(params) {
  return api.get("/projects", { params }).then((res) => res.data);
}

export function getProjectBySlug(slug, locale = "en") {
  return api.get(`/projects/${slug}`, { params: { locale } }).then((res) => res.data);
}
