import assert from "node:assert/strict";
import fs from "node:fs";
import mongoose from "mongoose";
import { after, before, describe, it } from "node:test";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_access_secret_that_is_long_enough_12345";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_that_is_long_enough_12345";

const app = (await import("../src/app.js")).default;
const Profile = (await import("../src/models/Profile.js")).default;
const Skill = (await import("../src/models/Skill.js")).default;
const Service = (await import("../src/models/Service.js")).default;
const Project = (await import("../src/models/Project.js")).default;
const Experience = (await import("../src/models/Experience.js")).default;
const Education = (await import("../src/models/Education.js")).default;
const Certification = (await import("../src/models/Certification.js")).default;
const BlogPost = (await import("../src/models/BlogPost.js")).default;
const { generatePortfolioReply } = await import("../src/services/portfolioAiService.js");

let server;
let baseURL;

function setupModelStubs() {
  Profile.findOne = () => ({
    lean() {
      return {
        exec: async () => ({
          name: "Mohammad Khalid",
          title: "Software Engineer & Full-Stack Developer",
          tagline: "I build scalable web and mobile applications.",
          bio: "Builds reliable software for product teams.",
          location: "Kabul, Afghanistan",
          availability: true,
          email: "hello@mohammadkhalid.dev",
          phone: "+93700000000",
          social: { github: "https://github.com/" },
          resumeUrl: "/resume.pdf",
        }),
      };
    },
  });

  Skill.find = () => ({
    sort() {
      return {
        limit() {
          return {
            lean() {
              return {
                exec: async () => [
                  { name: "React", category: "frontend", level: 90, yearsExperience: 5, description: "UI systems" },
                  { name: "Node.js", category: "backend", level: 88, yearsExperience: 5, description: "APIs" },
                  { name: "MongoDB", category: "database", level: 85, yearsExperience: 4, description: "Data" },
                ],
              };
            },
          };
        },
      };
    },
  });

  Service.find = () => ({
    sort() {
      return {
        limit() {
          return {
            lean() {
              return {
                exec: async () => [
                  { title: "Web Development", description: "Fast web apps." },
                  { title: "Backend Development", description: "Secure APIs." },
                ],
              };
            },
          };
        },
      };
    },
  });

  Project.find = () => ({
    sort() {
      return {
        limit() {
          return {
            lean() {
              return {
                exec: async () => [
                  { title: "Nokta Academy", slug: "nokta-academy", description: "School platform", category: "web", technologies: ["React", "Node.js"], features: ["Dashboard"] },
                  { title: "Commerce API", slug: "commerce-api", description: "E-commerce backend", category: "backend", technologies: ["Express", "MongoDB"], features: ["Authentication"] },
                ],
              };
            },
          };
        },
      };
    },
  });

  Experience.find = () => ({
    sort() {
      return {
        limit() {
          return {
            lean() {
              return {
                exec: async () => [
                  { position: "Software Engineer", company: "Freelance", location: "Remote", description: "Built shipping products" },
                ],
              };
            },
          };
        },
      };
    },
  });

  Education.find = () => ({
    sort() {
      return {
        limit() {
          return {
            lean() {
              return {
                exec: async () => [
                  { degree: "Bachelor of Computer Science", university: "Kabul University", description: "Software engineering" },
                ],
              };
            },
          };
        },
      };
    },
  });

  Certification.find = () => ({
    sort() {
      return {
        limit() {
          return {
            lean() {
              return {
                exec: async () => [
                  { name: "Full-Stack Web Development", organization: "OpenClassrooms" },
                ],
              };
            },
          };
        },
      };
    },
  });

  BlogPost.find = () => ({
    sort() {
      return {
        limit() {
          return {
            lean() {
              return {
                exec: async () => [
                  { title: "Understanding MongoDB Indexing", slug: "mongodb-indexing", excerpt: "Why indexes matter" },
                ],
              };
            },
          };
        },
      };
    },
  });
}

function buildKnowledge() {
  return {
    profile: {
      name: "Mohammad Khalid",
      title: "Software Engineer & Full-Stack Developer",
      tagline: "I build scalable web and mobile applications.",
      email: "hello@mohammadkhalid.dev",
      phone: "+93700000000",
    },
    skills: [
      { name: "React", category: "frontend" },
      { name: "Node.js", category: "backend" },
      { name: "MongoDB", category: "database" },
    ],
    services: [
      { title: "Web Development" },
      { title: "Backend Development" },
    ],
    projects: [
      { title: "Nokta Academy", technologies: ["React", "Node.js"] },
      { title: "Commerce API", technologies: ["Express", "MongoDB"] },
    ],
    experience: [{ position: "Software Engineer", company: "Freelance" }],
    education: [{ degree: "Bachelor of Computer Science", university: "Kabul University" }],
    certifications: [{ name: "Full-Stack Web Development" }],
    blog: [{ title: "Understanding MongoDB Indexing" }],
    github: {
      profile: { name: "Mohammad Khalid" },
      featuredRepos: [{ name: "portfolio" }, { name: "api-core" }],
    },
  };
}

describe("portfolio AI API and service", () => {
  before(async () => {
    setupModelStubs();
    server = app.listen(0);
    baseURL = `http://127.0.0.1:${server.address().port}/api`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState) await mongoose.disconnect();
  });

  it("answers portfolio questions with relevant content in English", async () => {
    const answer = await generatePortfolioReply("What technologies do you know?", buildKnowledge());
    assert.ok(/react|node|mongodb/i.test(answer));
    assert.ok(!/generic|fixed/i.test(answer));
  });

  it("answers Dari questions in Dari/Farsi script", async () => {
    const answer = await generatePortfolioReply("در مورد مهارت‌های تان معلومات بدهید.", buildKnowledge());
    assert.ok(/[\u0600-\u06FF]/.test(answer));
    assert.ok(!/[A-Za-z]{10,}/.test(answer));
  });

  it("answers Pashto questions in Pashto script", async () => {
    const answer = await generatePortfolioReply("ستاسو د مهارتونو په اړه معلومات راکړئ.", buildKnowledge());
    assert.ok(/[ښځږډګڼړڅ]/.test(answer));
  });

  it("returns different relevant results for different user questions", async () => {
    const skillsAnswer = await generatePortfolioReply("What skills do you work with?", buildKnowledge());
    const projectAnswer = await generatePortfolioReply("Tell me about your projects.", buildKnowledge());
    assert.notEqual(skillsAnswer, projectAnswer);
    assert.ok(/react|node|mongodb/i.test(skillsAnswer));
    assert.ok(/nokta|commerce/i.test(projectAnswer));
  });

  it("uses recent conversation context for follow-up questions", async () => {
    const first = await generatePortfolioReply("What projects have you built?", buildKnowledge());
    const followUp = await generatePortfolioReply("Which one uses React?", buildKnowledge(), [
      { role: "user", content: "What projects have you built?" },
      { role: "assistant", content: first },
    ]);

    assert.ok(/nokta|react/i.test(followUp));
  });

  it("rejects empty messages before sending a request", async () => {
    const result = await fetch(`${baseURL}/ai/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "   " }),
    });

    assert.equal(result.status, 400);
  });

  it("returns a useful fallback for general knowledge questions", async () => {
    const answer = await generatePortfolioReply("What is React?", buildKnowledge());
    assert.ok(/react/i.test(answer));
    assert.ok(/library|user interface|component/i.test(answer));
  });

  it("does not expose AI API keys in the frontend assistant UI", async () => {
    const assistantFile = fs.readFileSync("../frontend/src/pages/Assistant.jsx", "utf8");
    assert.doesNotMatch(assistantFile, /VITE_.*AI|OPENAI_API_KEY|AI_API_KEY/i);
  });
});
