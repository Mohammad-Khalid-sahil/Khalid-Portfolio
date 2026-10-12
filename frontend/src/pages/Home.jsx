import Hero from "@/sections/hero/Hero";
import AboutPreview from "@/sections/about/AboutPreview";
import SkillsPreview from "@/sections/skills/SkillsPreview";
import FeaturedProjects from "@/sections/projects/FeaturedProjects";
import ExperiencePreview from "@/sections/experience/ExperiencePreview";
import BlogPreview from "@/sections/blog/BlogPreview";
import GitHubActivity from "@/sections/github/GitHubActivity";
import ServicesPreview from "@/sections/services/ServicesPreview";
import Testimonials from "@/sections/testimonials/Testimonials";
import CTA from "@/sections/contact/CTA";
import Seo from "@/components/seo/Seo";

export default function Home() {
  return (
    <>
      <Seo
        title="Home"
        description="Mohammad Khalid is a software engineer and full-stack developer building React, Node.js, Flutter, and MongoDB products."
        keywords={["Mohammad Khalid", "full-stack developer", "software engineer", "React developer", "Node.js developer", "Flutter developer"]}
        path="/"
      />
      <Hero />
      <AboutPreview />
      <SkillsPreview />
      <ServicesPreview />
      <FeaturedProjects />
      <ExperiencePreview />
      <BlogPreview />
      <GitHubActivity />
      <Testimonials />
      <CTA />
    </>
  );
}
