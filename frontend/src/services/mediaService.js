import api from "./api";
import { uploadFile } from "./uploadService";

export function listMedia(params) {
  return api.get("/media", { params });
}

export function uploadMedia(file, usedIn = "other") {
  return uploadFile(file, usedIn, "media");
}

export function deleteMedia(id) {
  return api.delete(`/media/${id}`);
}

export function getMediaUsage(id) {
  return api.get(`/media/${id}/usage`).then((res) => res.data);
}
