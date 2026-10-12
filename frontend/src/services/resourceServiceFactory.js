import api from "./api";

/**
 * Creates a standard set of read functions for a REST resource.
 * All backend responses are shaped { success, message, data, meta }.
 */
export function createResourceService(basePath) {
  return {
    getAll: (params) => api.get(basePath, { params }).then((res) => res.data),
    getOne: (id) => api.get(`${basePath}/${id}`).then((res) => res.data),
  };
}
