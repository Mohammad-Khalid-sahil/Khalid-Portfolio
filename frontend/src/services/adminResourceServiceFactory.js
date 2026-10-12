import api from "./api";

/**
 * Builds { list, create, update, remove } for a REST resource whose backend
 * routes follow the standard pattern: GET/POST /path, PUT/DELETE /path/:id.
 */
export function createAdminResourceService(basePath, { listPath = basePath } = {}) {
  return {
    list: (params) => api.get(listPath, { params }).then((res) => ({ items: res.data || [], meta: res.meta || {} })),
    create: (payload) => api.post(basePath, payload).then((res) => res.data),
    update: (id, payload) => api.put(`${basePath}/${id}`, payload).then((res) => res.data),
    remove: (id) => api.delete(`${basePath}/${id}`),
  };
}

