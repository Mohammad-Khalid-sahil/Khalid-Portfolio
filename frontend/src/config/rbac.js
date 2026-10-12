/** Frontend mirror of backend/src/config/rbac.js — used for route and UI gating only. */

export const PERMISSIONS = {
  "users:read": ["admin"],
  "users:write": ["admin"],
  "analytics:read": ["admin"],
  "ai:admin": ["admin"],
  "messages:read": ["admin"],
  "messages:write": ["admin"],
  "settings:write": ["admin"],
  "profile:write": ["admin"],
  "content:read": ["admin", "editor"],
  "content:write": ["admin", "editor"],
  "content:delete": ["admin"],
  "media:read": ["admin", "editor"],
  "media:write": ["admin", "editor"],
  "media:delete": ["admin"],
};

export function roleCan(role, permission) {
  if (!role) return false;
  return (PERMISSIONS[permission] || []).includes(role);
}
