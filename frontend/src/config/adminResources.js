import { createAdminResourceService } from "@/services/adminResourceServiceFactory";

export const resourceConfigs = {
  projects: {
    title: "Projects",
    service: createAdminResourceService("/projects", { listPath: "/projects/admin/all" }),
    queryKey: ["admin", "projects"],
    publicCacheKeys: [["projects"], ["project"]],
    idKey: "_id",
    tableMinWidth: "844px",
    columns: [
      { key: "thumbnail", label: "Thumbnail", type: "image", width: "9%", headerClassName: "whitespace-nowrap" },
      { key: "title", label: "Title", width: "35%" },
      { key: "category", label: "Category", width: "18%" },
      { key: "featured", label: "Featured", type: "boolean", width: "13%", headerClassName: "whitespace-nowrap" },
      { key: "published", label: "Published", type: "boolean", width: "13%", headerClassName: "whitespace-nowrap" },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true, section: "Basic Information" },
      { name: "description", label: "Short Description", type: "textarea", required: true, section: "Basic Information" },
      { name: "fullDescription", label: "Full Description", type: "textarea", section: "Basic Information" },
      { name: "slug", label: "Slug (auto if empty)", type: "text", section: "Project Identity" },
      {
        name: "category",
        label: "Category",
        type: "select",
        section: "Project Identity",
        options: ["web", "mobile", "backend", "ai", "ui-ux", "other"],
      },
      { name: "technologies", label: "Technologies (comma separated)", type: "array", section: "Project Identity" },
      { name: "featured", label: "Featured", type: "boolean", section: "Project Identity" },
      { name: "published", label: "Published", type: "boolean", defaultValue: true, section: "Project Identity" },
      { name: "order", label: "Order", type: "number", defaultValue: 0, section: "Project Identity" },
      { name: "thumbnail", label: "Thumbnail Image", type: "image", section: "Media" },
      { name: "gallery", label: "Gallery / Screenshots", type: "gallery", section: "Media" },
      { name: "github", label: "GitHub URL", type: "text", section: "Links" },
      { name: "demo", label: "Live Demo URL", type: "text", section: "Links" },
      { name: "videoDemo", label: "Video Demo URL", type: "text", section: "Links" },
      { name: "documentation", label: "Documentation URL", type: "text", section: "Links" },
      { name: "features", label: "Features (comma separated)", type: "array", section: "Case Study" },
      { name: "challenges", label: "Challenges", type: "textarea", section: "Case Study" },
      { name: "solutions", label: "Solutions", type: "textarea", section: "Case Study" },
      { name: "architecture", label: "Architecture", type: "textarea", section: "Case Study" },
      { name: "security", label: "Security", type: "textarea", section: "Case Study" },
      { name: "performance", label: "Performance", type: "textarea", section: "Case Study" },
      { name: "results", label: "Results", type: "textarea", section: "Case Study" },
      { name: "lessonsLearned", label: "Lessons Learned", type: "textarea", section: "Case Study" },
      { name: "seoTitle", label: "SEO Title", type: "text", section: "SEO" },
      { name: "seoDescription", label: "SEO Description", type: "textarea", section: "SEO" },
      { name: "seoKeywords", label: "SEO Keywords (comma separated)", type: "array", section: "SEO" },
    ],
  },

  skills: {
    title: "Skills",
    service: createAdminResourceService("/skills"),
    queryKey: ["admin", "skills"],
    publicCacheKeys: [["skills"]],
    idKey: "_id",
    columns: [
      { key: "name", label: "Name" },
      { key: "category", label: "Category" },
      { key: "level", label: "Level", type: "number", align: "end" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      {
        name: "category",
        label: "Category",
        type: "select",
        required: true,
        options: ["frontend", "backend", "database", "mobile", "devops", "tools", "other"],
      },
      { name: "level", label: "Level (0-100)", type: "number", min: 0, max: 100, defaultValue: 50 },
      { name: "yearsExperience", label: "Years Experience", type: "number", defaultValue: 1 },
      { name: "description", label: "Description", type: "textarea" },
      {
        name: "relatedProjects",
        label: "Related Projects",
        type: "relation",
        relationEndpoint: "/projects",
        relationLabelKey: "title",
      },
      { name: "featured", label: "Featured", type: "boolean" },
      { name: "order", label: "Order", type: "number", defaultValue: 0 },
    ],
  },

  services: {
    title: "Services",
    service: createAdminResourceService("/services"),
    queryKey: ["admin", "services"],
    publicCacheKeys: [["services"]],
    idKey: "_id",
    columns: [
      { key: "title", label: "Title" },
      { key: "icon", label: "Icon" },
      { key: "order", label: "Order" },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea", required: true },
      {
        name: "icon",
        label: "Icon",
        type: "select",
        options: ["FiCode", "FiSmartphone", "FiServer", "FiDatabase"],
      },
      { name: "features", label: "Features (comma separated)", type: "array" },
      { name: "technologies", label: "Technologies (comma separated)", type: "array" },
      { name: "startingPrice", label: "Starting Price", type: "text" },
      { name: "ctaText", label: "CTA Button Text (e.g. \"Request a quote\")", type: "text" },
      { name: "featured", label: "Featured", type: "boolean" },
      { name: "order", label: "Order", type: "number", defaultValue: 0 },
    ],
  },

  experiences: {
    title: "Experience",
    service: createAdminResourceService("/experiences"),
    queryKey: ["admin", "experiences"],
    publicCacheKeys: [["experiences"]],
    idKey: "_id",
    columns: [
      { key: "position", label: "Position" },
      { key: "company", label: "Company" },
      { key: "startDate", label: "Start", type: "date" },
    ],
    fields: [
      { name: "position", label: "Position", type: "text", required: true },
      { name: "company", label: "Company", type: "text", required: true },
      { name: "location", label: "Location", type: "text" },
      { name: "isCurrent", label: "I currently work here", type: "boolean" },
      { name: "startDate", label: "Start Date", type: "date", required: true },
      { name: "endDate", label: "End Date (leave empty = Present)", type: "date" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "responsibilities", label: "Responsibilities (comma separated)", type: "array" },
      { name: "achievements", label: "Achievements (comma separated)", type: "array" },
      { name: "technologies", label: "Technologies (comma separated)", type: "array" },
      { name: "order", label: "Order", type: "number", defaultValue: 0 },
    ],
  },

  education: {
    title: "Education",
    service: createAdminResourceService("/education"),
    queryKey: ["admin", "education"],
    publicCacheKeys: [["education"]],
    idKey: "_id",
    columns: [
      { key: "degree", label: "Degree" },
      { key: "university", label: "University" },
      { key: "startDate", label: "Start", type: "date" },
    ],
    fields: [
      { name: "degree", label: "Degree", type: "text", required: true },
      { name: "university", label: "University", type: "text", required: true },
      { name: "faculty", label: "Faculty", type: "text" },
      { name: "startDate", label: "Start Date", type: "date", required: true },
      { name: "endDate", label: "End Date", type: "date" },
      { name: "gpa", label: "GPA", type: "text" },
      { name: "courses", label: "Courses (comma separated)", type: "array" },
      { name: "thesis", label: "Thesis", type: "textarea" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "achievements", label: "Achievements (comma separated)", type: "array" },
      { name: "order", label: "Order", type: "number", defaultValue: 0 },
    ],
  },

  certifications: {
    title: "Certifications",
    service: createAdminResourceService("/certifications"),
    queryKey: ["admin", "certifications"],
    publicCacheKeys: [["certifications"]],
    idKey: "_id",
    columns: [
      { key: "name", label: "Name" },
      { key: "organization", label: "Organization" },
      { key: "date", label: "Date", type: "date" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "organization", label: "Organization", type: "text", required: true },
      { name: "date", label: "Date", type: "date", required: true },
      { name: "credentialId", label: "Credential ID", type: "text" },
      { name: "image", label: "Certificate Image", type: "image" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "verificationUrl", label: "Verification URL", type: "text" },
      { name: "order", label: "Order", type: "number", defaultValue: 0 },
    ],
  },

  testimonials: {
    title: "Testimonials",
    service: createAdminResourceService("/testimonials", { listPath: "/testimonials/admin/all" }),
    queryKey: ["admin", "testimonials"],
    publicCacheKeys: [["testimonials"]],
    idKey: "_id",
    tableMinWidth: "920px",
    columns: [
      { key: "avatar", label: "Avatar", type: "image", width: "9%", headerClassName: "whitespace-nowrap" },
      { key: "name", label: "Name", width: "14%" },
      { key: "position", label: "Position", width: "13%" },
      { key: "company", label: "Company", width: "13%" },
      { key: "message", label: "Message", width: "30%" },
      { key: "approved", label: "Approved", type: "boolean", width: "9%", headerClassName: "whitespace-nowrap" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "position", label: "Position", type: "text" },
      { name: "company", label: "Company", type: "text" },
      { name: "message", label: "Message", type: "textarea", required: true },
      { name: "rating", label: "Rating (1-5)", type: "number", min: 1, max: 5, defaultValue: 5 },
      { name: "approved", label: "Approved (visible on site)", type: "boolean", defaultValue: true },
      { name: "order", label: "Order", type: "number", defaultValue: 0 },
    ],
  },

  categories: {
    title: "Blog Categories",
    service: createAdminResourceService("/categories"),
    queryKey: ["admin", "categories"],
    publicCacheKeys: [["posts"], ["post"]],
    idKey: "_id",
    columns: [
      { key: "name", label: "Name" },
      { key: "slug", label: "Slug" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "Slug (auto if empty)", type: "text" },
    ],
  },

  tags: {
    title: "Blog Tags",
    service: createAdminResourceService("/tags"),
    queryKey: ["admin", "tags"],
    publicCacheKeys: [["posts"], ["post"]],
    idKey: "_id",
    columns: [
      { key: "name", label: "Name" },
      { key: "slug", label: "Slug" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "Slug (auto if empty)", type: "text" },
    ],
  },
};


const resourceListSorts = {
  projects: ["default", "newest", "oldest", "alpha", "alphaDesc", "order"],
  skills: ["default", "newest", "oldest", "alpha", "alphaDesc", "order"],
  services: ["default", "newest", "oldest", "alpha", "alphaDesc", "order"],
  experiences: ["default", "newest", "oldest", "alpha", "alphaDesc", "order"],
  education: ["default", "newest", "oldest", "alpha", "alphaDesc", "order"],
  certifications: ["default", "newest", "oldest", "alpha", "alphaDesc", "order"],
  testimonials: ["default", "newest", "oldest", "alpha", "alphaDesc", "order"],
  categories: ["default", "newest", "oldest", "alpha", "alphaDesc"],
  tags: ["default", "newest", "oldest", "alpha", "alphaDesc"],
};
const sectionKeyByLabel = {
  "Basic Information": "basic",
  "Project Identity": "identity",
  Media: "media",
  Links: "links",
  "Case Study": "caseStudy",
  SEO: "seo",
};

const localizedResourceFields = {
  projects: ["title", "description", "fullDescription", "features", "challenges", "solutions", "architecture", "security", "performance", "results", "lessonsLearned", "seoTitle", "seoDescription"],
  skills: ["description"],
  services: ["title", "description", "features", "ctaText"],
  experiences: ["position", "description", "responsibilities", "achievements"],
  education: ["degree", "faculty", "courses", "thesis", "description", "achievements"],
  certifications: ["name", "description"],
  testimonials: ["position", "message"],
  categories: ["name"],
  tags: ["name"],
};

Object.entries(resourceConfigs).forEach(([resourceKey, config]) => {
  config.listSortOptions = resourceListSorts[resourceKey];
  config.titleKey = `admin.resources.${resourceKey}.title`;
  config.singularKey = `admin.resources.${resourceKey}.singular`;
  config.columns = config.columns.map((column) => ({
    ...column,
    labelKey: `admin.resources.${resourceKey}.fields.${column.key}`,
  }));
  config.fields = config.fields.map((field) => ({
    ...field,
    labelKey: `admin.resources.${resourceKey}.fields.${field.name}`,
    localized: localizedResourceFields[resourceKey]?.includes(field.name) || false,
    sectionKey: field.section ? `admin.resources.${resourceKey}.sections.${sectionKeyByLabel[field.section] || field.section}` : undefined,
    optionLabelKeys: field.options?.map((option) => {
      const key = String(option).toLowerCase().replace(/-/g, "");
      return ["web", "mobile", "backend", "ai", "uiux", "other", "frontend", "database", "devops", "tools"].includes(key) ? `admin.resources.shared.options.${key}` : undefined;
    }),
  }));
});

