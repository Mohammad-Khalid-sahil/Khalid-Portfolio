/**
 * Role-based access matrix for the portfolio admin API.
 *
 * Roles:
 * - admin: full administrative access
 * - editor: content management (create/update) without destructive or system actions
 *
 * Route handlers should enforce these rules with protect + restrictTo (or equivalent checks).
 */
export const ROLES = ["admin", "editor"];

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

export function rolesForPermission(permission) {
  return PERMISSIONS[permission] || [];
}
