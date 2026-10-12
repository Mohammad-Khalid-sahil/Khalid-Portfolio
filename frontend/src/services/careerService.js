import api from "./api";

export function getExperiences(locale = "en") {
  return api.get("/experiences", { params: { locale } }).then((res) => res.data);
}

export function getEducationList(locale = "en") {
  return api.get("/education", { params: { locale } }).then((res) => res.data);
}

export function getCertifications(locale = "en") {
  return api.get("/certifications", { params: { locale } }).then((res) => res.data);
}
