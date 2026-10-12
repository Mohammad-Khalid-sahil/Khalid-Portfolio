import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import PublicLayout from "@/layouts/PublicLayout";

const Home = lazy(() => import("@/pages/Home"));
const About = lazy(() => import("@/pages/About"));
const Skills = lazy(() => import("@/pages/Skills"));
const Services = lazy(() => import("@/pages/Services"));
const Projects = lazy(() => import("@/pages/Projects"));
const ProjectDetails = lazy(() => import("@/pages/ProjectDetails"));
const Experience = lazy(() => import("@/pages/Experience"));
const Education = lazy(() => import("@/pages/Education"));
const Certifications = lazy(() => import("@/pages/Certifications"));
const Testimonials = lazy(() => import("@/pages/Testimonials"));
const Resume = lazy(() => import("@/pages/Resume"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogDetails = lazy(() => import("@/pages/BlogDetails"));
const Contact = lazy(() => import("@/pages/Contact"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Assistant = lazy(() => import("@/pages/Assistant"));

const pageFallback = (
  <div className="flex min-h-[40vh] items-center justify-center px-6 text-sm text-[var(--color-text-muted)]">
    Loading page...
  </div>
);

export default function AppRoutes() {
  return (
    <Suspense fallback={pageFallback}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/services" element={<Services />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:slug" element={<ProjectDetails />} />
          <Route path="/experience" element={<Experience />} />
          <Route path="/education" element={<Education />} />
          <Route path="/certifications" element={<Certifications />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogDetails />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
