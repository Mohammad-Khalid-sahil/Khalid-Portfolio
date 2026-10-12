export const SKILL_CATEGORY_LABELS = {
  frontend: "Frontend",
  backend: "Backend",
  database: "Database",
  mobile: "Mobile",
  devops: "Tools & DevOps",
  tools: "Tools",
  other: "Other",
};

/**
 * Groups a flat list of skill documents (from the API) into
 * [{ id, label, skills: [...] }] ordered categories for display.
 */
export function groupSkillsByCategory(skills = [], translateLabel) {
  const order = ["frontend", "backend", "database", "mobile", "devops", "tools", "other"];
  const grouped = {};

  skills.forEach((skill) => {
    const key = skill.category || "other";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(skill);
  });

  return order
    .filter((key) => grouped[key]?.length)
    .map((key) => ({
      id: key,
      label: translateLabel ? translateLabel(key) : SKILL_CATEGORY_LABELS[key] || key,
      skills: grouped[key].sort((a, b) => (a.order || 0) - (b.order || 0)),
    }));
}
