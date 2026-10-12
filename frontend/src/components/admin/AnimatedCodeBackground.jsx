import { useMemo } from "react";

const programs = [
  ["// portfolio / data loader", "export async function loadPortfolio() {", "  const profile = await api.get(\"/profile\");", "  const projects = await api.get(\"/projects\");", "  return { profile: profile.data, projects: projects.data };", "}"],
  ["// projects / query", "const fetchProjects = async () => {", "  const response = await api.get(\"/projects\");", "  return response.data.map((project) => ({", "    ...project, href: `/projects/${project.slug}`,", "  }));", "};"],
  ["// api / route registration", "router.get(\"/projects\", protect, async (req, res) => {", "  const projects = await Project.find({ published: true })", "    .sort({ order: 1 })", "    .select(\"title slug summary thumbnail\");", "  res.status(200).json({ data: projects });", "});"],
  ["// interface / portfolio", "export default function PortfolioPage() {", "  const { data, isLoading } = useProjects();", "  if (isLoading) return <ProjectSkeleton />;", "  return <ProjectGrid projects={data} />;", "}"],
  ["// profile / skills", "async function getProfile() {", "  const profile = await Profile.findOne().lean();", "  const skills = await Skill.find().sort({ order: 1 });", "  return { ...profile, skills };", "}", "export { getProfile };"],
  ["// authentication / session", "export async function signIn(credentials) {", "  const { data } = await api.post(\"/auth/login\", credentials);", "  sessionStorage.setItem(\"accessToken\", data.token);", "  return data.user;", "}"],
  ["// application / bootstrap", "const app = express();", "app.use(helmet());", "app.use(express.json({ limit: \"1mb\" }));", "app.use(\"/api/projects\", projectRoutes);", "app.use(\"/api/profile\", profileRoutes);"],
  ["// content / project card", "function ProjectCard({ project }) {", "  return (", "    <article className=\"project-card\">", "      <img src={project.thumbnail} alt={project.title} />", "      <ProjectDetails project={project} />", "    </article>", "  );", "}"],
  ["// settings / theme", "const theme = useUIStore((state) => state.theme);", "useEffect(() => {", "  document.documentElement.dataset.theme = theme;", "  localStorage.setItem(\"theme\", theme);", "}, [theme]);"],
];

const positions = [
  ["2%", "3%"], ["37%", "4%"], ["71%", "7%"], ["4%", "31%"],
  ["72%", "34%"], ["1%", "69%"], ["38%", "76%"], ["73%", "72%"], ["28%", "23%"],
];
const tokenPattern = /(\/\/.*|"(?:[^"\\]|\\.)*"|\b(?:const|let|var|async|await|return|export|default|function|if|new|true|false)\b|\b\d+(?:\.\d+)?\b|(?<=<)\/?[A-Z][A-Za-z0-9]*|\b[a-zA-Z_$][\w$]*(?=\s*:)|\b[a-zA-Z_$][\w$]*|[=+*/<>!&|?:.-])/g;

function highlight(line) {
  const parts = [];
  let cursor = 0;
  for (const match of line.matchAll(tokenPattern)) {
    const token = match[0];
    const start = match.index;
    if (start > cursor) parts.push(line.slice(cursor, start));
    const type = token.startsWith("//") ? "comment"
      : token.startsWith('"') ? "string"
        : /^(const|let|var|async|await|return|export|default|function|if|new|true|false)$/.test(token) ? "keyword"
          : /^\d/.test(token) ? "number"
            : /^\/?[A-Z]/.test(token) && match.index > 0 && line[match.index - 1] === "<" ? "tag"
              : line[match.index + token.length] === ":" ? "property"
              : /^[=+*/<>!&|?:.-]$/.test(token) ? "operator"
                : /^\s*\(/.test(line.slice(start + token.length)) ? "function" : "variable";
    parts.push(<span key={`${start}-${token}`} className={`code-${type}`}>{token}</span>);
    cursor = start + token.length;
  }
  if (cursor < line.length) parts.push(line.slice(cursor));
  return parts;
}

export default function AnimatedCodeBackground() {
  const regions = useMemo(() => positions.map((position, index) => ({
    position,
    lines: programs[index],
    delay: `${-((index * 3.7) % 18)}s`,
    duration: `${23 + (index % 4) * 3}s`,
  })), []);

  return (
    <div className="animated-code-background" aria-hidden="true">
      {regions.map(({ position, lines, delay, duration }, blockIndex) => (
        <div className={`animated-code-background__region animated-code-background__region--${blockIndex + 1}`} key={lines[0]} style={{ left: position[0], top: position[1], "--typing-delay": delay, "--cycle-duration": duration }}>
          {lines.map((line, lineIndex) => (
            <div className="animated-code-background__line" key={`${lineIndex}-${line}`} style={{ "--line-delay": `${lineIndex * 1.25}s`, "--line-chars": Math.max(4, line.length) }}>
              {highlight(line)}<i className="animated-code-background__caret" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
