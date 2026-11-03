import api from "./api";

export function getTestimonials(locale = "en") {
  return api.get("/testimonials", { params: { locale } }).then((res) => res.data);
}

export function createTestimonial(payload) {
  return api.post("/testimonials", payload).then((res) => res.data);
}
