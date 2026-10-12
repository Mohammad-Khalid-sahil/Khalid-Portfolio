import api from "./api";

export function getPosts(params) {
  return api.get("/blog", { params }).then((res) => res);
}

export function getPostBySlug(slug, locale = "en") {
  return api.get(`/blog/${slug}`, { params: { locale } }).then((res) => res.data);
}
