export const ADMIN_PAGE_TITLE_KEYS = {
  "/admin": "admin.dashboard",
  "/admin/users": "phase4.users.title",
  "/admin/analytics": "phase4.analytics.title",
  "/admin/ai": "phase4.ai.title",
  "/admin/messages": "admin.messages",
  "/admin/settings": "admin.profileSettings",
  "/admin/blog": "admin.blogPosts",
  "/admin/media": "admin.mediaLibrary",
  "/admin/resource/projects": "admin.projects",
  "/admin/resource/skills": "admin.skills",
  "/admin/resource/services": "admin.services",
  "/admin/resource/experiences": "admin.experience",
  "/admin/resource/education": "admin.education",
  "/admin/resource/certifications": "admin.certifications",
  "/admin/resource/testimonials": "admin.testimonials",
  "/admin/resource/categories": "admin.blogCategories",
  "/admin/resource/tags": "admin.blogTags",
};

export function getAdminPageTitleKey(pathname) {
  const path = pathname.replace(/\/+$/, "") || "/admin";
  return ADMIN_PAGE_TITLE_KEYS[path] || "admin.label";
}
