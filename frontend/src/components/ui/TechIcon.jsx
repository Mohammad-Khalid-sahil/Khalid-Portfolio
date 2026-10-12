import {
  SiReact, SiJavascript, SiTypescript, SiNodedotjs, SiExpress, SiMongodb, SiMysql, SiPostgresql,
  SiFlutter, SiDart, SiGit, SiGithub, SiTailwindcss, SiHtml5, SiDocker, SiFirebase, SiNextdotjs,
  SiPython, SiRedux, SiFigma, SiVite,
} from "react-icons/si";
import { FiCode, FiDatabase, FiGlobe, FiLayers, FiServer, FiSmartphone, FiTool } from "react-icons/fi";

// Purely visual mapping from a technology name to a recognisable glyph.
const MATCHERS = [
  [/^react(\.js|js)?$|react native/i, SiReact],
  [/next/i, SiNextdotjs],
  [/typescript|^ts$/i, SiTypescript],
  [/javascript|^js$|es6/i, SiJavascript],
  [/node/i, SiNodedotjs],
  [/express/i, SiExpress],
  [/mongo/i, SiMongodb],
  [/mysql/i, SiMysql],
  [/postgres/i, SiPostgresql],
  [/flutter/i, SiFlutter],
  [/dart/i, SiDart],
  [/github/i, SiGithub],
  [/^git$|git\b/i, SiGit],
  [/tailwind/i, SiTailwindcss],
  [/html/i, SiHtml5],
  [/docker/i, SiDocker],
  [/firebase/i, SiFirebase],
  [/python/i, SiPython],
  [/redux/i, SiRedux],
  [/figma/i, SiFigma],
  [/vite/i, SiVite],
];

const CATEGORY_FALLBACK = {
  frontend: FiGlobe,
  backend: FiServer,
  database: FiDatabase,
  mobile: FiSmartphone,
  devops: FiTool,
  tools: FiLayers,
};

export function resolveTechIcon(name = "", category) {
  const label = String(name).trim();
  const match = MATCHERS.find(([pattern]) => pattern.test(label));
  if (match) return match[1];
  return CATEGORY_FALLBACK[category] || FiCode;
}

export default function TechIcon({ name, category, size = 16, className = "" }) {
  const Icon = resolveTechIcon(name, category);
  return <Icon size={size} aria-hidden="true" className={className} />;
}
