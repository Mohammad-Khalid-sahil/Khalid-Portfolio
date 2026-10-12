import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import Profile from "../models/Profile.js";
import Skill from "../models/Skill.js";
import Service from "../models/Service.js";
import Project from "../models/Project.js";
import Experience from "../models/Experience.js";
import Education from "../models/Education.js";
import Certification from "../models/Certification.js";
import BlogPost from "../models/BlogPost.js";
import { getGithubProfile, getGithubRepos } from "../integrations/github/githubService.js";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_RESPONSE_LENGTH = 1200;
let activeProviderRequests = 0;
const SAFE_QUESTION_HINTS = [
  "profile",
  "about",
  "skills",
  "services",
  "projects",
  "experience",
  "education",
  "certifications",
  "resume",
  "blog",
  "github",
];

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all|previous)\s+instructions/i,
  /system\s*prompt/i,
  /developer\s+mode/i,
  /reveal\s+(secrets?|api\s+keys?|tokens?|passwords?)/i,
  /show\s+(private|admin|internal)\s+(info|data|details)/i,
  /act\s+as\s+if\s+you\s+are\s+an\s+admin/i,
  /print\s+(env|environment)/i,
  /bypass\s+(security|rate\s+limit|rules)/i,
];

const DEFAULT_SUGGESTED_QUESTIONS = [
  "Tell me about Mohammad Khalid.",
  "What skills do you work with?",
  "What services do you offer?",
  "Show me your featured projects.",
  "What is your experience and background?",
  "What certifications and education do you have?",
  "Can I view your resume or blog?",
  "What does your GitHub profile look like?",
];

function normalizeText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function safeString(value, fallback = "Not available") {
  const clean = normalizeText(value);
  return clean || fallback;
}

export function sanitizeQuestion(rawQuestion) {
  const normalized = normalizeText(rawQuestion);

  if (!normalized) {
    throw ApiError.badRequest("Please enter a question before sending it.");
  }

  if (normalized.length > MAX_MESSAGE_LENGTH) {
    throw ApiError.badRequest(`Question is too long. Keep it under ${MAX_MESSAGE_LENGTH} characters.`);
  }

  const suspicious = PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(normalized));
  return {
    normalized,
    suspicious,
    isPortfolioQuestion: SAFE_QUESTION_HINTS.some((hint) => normalized.toLowerCase().includes(hint)),
  };
}

function detectLanguage(question, conversation = []) {
  const combined = [question, ...conversation.map((entry) => entry?.content || "")].join(" ");
  const lower = combined.toLowerCase();

  if (/(pashto|پښتو|ps)/i.test(lower) || /[ښځږډګڼړڅ]/.test(combined)) return "ps";
  if (/(dari|farsi|فارسی|دری|فارسى|fa)/i.test(lower) || /[\u0600-\u06FF]/.test(combined)) return "fa";

  return "en";
}

function localize(language, englishText, farsiText, pashtoText) {
  if (language === "fa") return farsiText;
  if (language === "ps") return pashtoText;
  return englishText;
}

function buildHistoryExcerpt(conversation = []) {
  if (!Array.isArray(conversation) || !conversation.length) return "";
  return conversation
    .slice(-6)
    .map((entry) => `${entry?.role || "user"}: ${entry?.content || ""}`)
    .join(" ");
}

function extractTopicAnswer(question, knowledge, language) {
  const lower = question.toLowerCase();

  if (/(what is react|react)/i.test(lower)) {
    return localize(
      language,
      "React is a JavaScript library for building interactive user interfaces. It helps developers build reusable UI components and manage state in web and mobile apps.",
      "ریاكت یوه جاواسکریپت لایبرری ده چې د تعاملی یوزر انترفیسونو رامنځته کولو لپاره کارول کیږي. دا ډویلپرانو د ریسایکل شوي UI کامپوننټونو جوړولو او د حالت مدیریت کولو کې مرسته کوي.",
      "ری اکت د جاوا سکریپټ کتابخانه ده چې د متقابل کاربری انترفیسونو جوړولو لپاره کارول کیږي. دا ډویلپرانو د بیاکارولیدونکو UI کامپوننټونو جوړولو او د حالت مدیریت کولو کې مرسته کوي."
    );
  }

  if (/(project|portfolio|featured|case study|what have you built|built a project)/i.test(lower)) {
    const projects = knowledge.projects || [];
    if (!projects.length) return localize(language, "No public projects are available yet.", "تر اوسه کوم عامه پروژه شتون نه لري.", "تر اوسه کوم عامه پروژه شتون نه لري.");
    const names = projects.slice(0, 4).map((project) => project.title).join(", ");
    return localize(
      language,
      `Notable projects include ${names}.`,
      `د پامونده پروژه‌ګان عبارت دي له ${names}.`,
      `د پامونده پروژو مثالونه ${names} دي.`
    );
  }

  if (/(contact|reach|email|phone|message|how can i contact|can i contact)/i.test(lower)) {
    const profile = knowledge.profile || {};
    const email = profile.email || "hello@mohammadkhalid.dev";
    const phone = profile.phone || "Available on the contact page";
    return localize(
      language,
      `You can reach the portfolio owner via email at ${email} and through the contact page. ${phone !== "Available on the contact page" ? `Phone: ${phone}.` : ""}`,
      `تاسو کولی شی په ایمل ${email} د پورته کولو او د تماس پاڼه له لارې اړیکه ونیسی. ${phone !== "Available on the contact page" ? `ټلیفون: ${phone}.` : ""}`,
      `تاسو کولی شی د ایمل ${email} له لارې اړیکه ونیسي او د تماس پاڼی له لارې. ${phone !== "Available on the contact page" ? `تلیفون: ${phone}.` : ""}`
    );
  }

  if (/(who|about|profile|yourself|introduce|what do you do)/i.test(lower)) {
    const profile = knowledge.profile;
    if (!profile) return localize(language, "A public profile is not available right now.", "د عمومی پروفایل په وخت کې شتون نه لري.", "د عامه پروفایل اوس شتون نه لري.");
    return localize(
      language,
      `${profile.name || "This portfolio owner"} is a ${profile.title || "software specialist"}. ${profile.tagline || profile.bio || "They build digital products and interfaces."}`,
      `${profile.name || "دا پورته کونکی"} د ${profile.title || "سافټویر متخصص"} په توګه فعالیت کوي. ${profile.tagline || profile.bio || "دوی دیجیتال محصولات او انترفیسونه رامینځته کوي."}`,
      `${profile.name || "دا پورته کونکی"} د ${profile.title || "سافټویر متخصص"} په توګه فعالیت کوي. ${profile.tagline || profile.bio || "دوی ډیجیټل محصولات او انترفیسونه جوړوي."}`
    );
  }

  if (/(skill|stack|technology|tech|technologies|framework|tool|programming|languages)/i.test(lower)) {
    const skills = knowledge.skills || [];
    if (!skills.length) return localize(language, "No public skill list is available yet.", "تر اوسه هیچ عامه مهارت لیست شتون نه لري.", "تر اوسه کوم عامه مهارت لیست شتون نه لري.");
    const names = skills.slice(0, 10).map((skill) => skill.name).join(", ");
    return localize(
      language,
      `The portfolio highlights skills including ${names}.`,
      `پورته کولی شی مهارتونه لکه ${names} لیدلی شی.`,
      `پورته کولی شی مهارتونه لکه ${names} لیدلی شی.`
    );
  }

  if (/(service|offer|help|consult|build|website|app|mobile|backend)/i.test(lower)) {
    const services = knowledge.services || [];
    if (!services.length) return localize(language, "No public services are available yet.", "تر اوسه کوم عامه خدمت شتون نه لري.", "تر اوسه کوم عامه خدمت شتون نه لري.");
    const names = services.slice(0, 6).map((service) => service.title).join(", ");
    return localize(
      language,
      `The portfolio offers services such as ${names}.`,
      `پورته خدمات لکه ${names} وړاندې کوي.`,
      `پورته خدمات لکه ${names} وړاندې کوي.`
    );
  }

  if (/(experience|background|career|years|work history|journey)/i.test(lower)) {
    const experience = knowledge.experience || [];
    if (!experience.length) return localize(language, "No public experience entries are available yet.", "تر اوسه کوم عامه تجربه نه ده موجود.", "تر اوسه کوم عامه تجربه نه ده موجود.");
    const latest = experience[0];
    return localize(
      language,
      `${latest.position || "Professional role"} at ${latest.company || "a client team"} is part of the portfolio experience.`,
      `${latest.position || "د مسلکی رتبه"} په ${latest.company || "یو کلاینت غونډمو"} د پورته تجربه برخه ده.`,
      `${latest.position || "د مسلکی رتبه"} په ${latest.company || "یو کلاینت ګروپ"} کې د پورته تجربه برخه ده.`
    );
  }

  if (/(education|degree|university|school|study)/i.test(lower)) {
    const education = knowledge.education || [];
    if (!education.length) return localize(language, "No public education record is available yet.", "تر اوسه کوم عامه تحصیلی معلومات نه دی شتون.", "تر اوسه کوم عامه تحصیلی معلومات نه دی شتون.");
    const latest = education[0];
    return localize(
      language,
      `${latest.degree || "Education record"} from ${latest.university || "a learning institution"} is included in the portfolio.`,
      `${latest.degree || "تحصیلی سند"} له ${latest.university || "یو تعلیمی موسسه"} په پورته کې شامل دی.`,
      `${latest.degree || "تعلیمی سند"} له ${latest.university || "یو تعلیمی موسسه"} څخه په پورته کې شامل دی.`
    );
  }

  if (/(certif|credential|qualification)/i.test(lower)) {
    const certifications = knowledge.certifications || [];
    if (!certifications.length) return localize(language, "No public certifications are listed yet.", "تر اوسه کوم عامه سند نه دی لیست شوی.", "تر اوسه کوم عامه سند نه دی لیست شوی.");
    const names = certifications.slice(0, 3).map((item) => item.name).join(", ");
    return localize(
      language,
      `Public certifications include ${names}.`,
      `د عامه سندونو لیست ${names} دی.`,
      `د عامه سندونو لیست ${names} دی.`
    );
  }

  if (/(resume|cv)/i.test(lower)) {
    return localize(
      language,
      "The resume is available from the portfolio and can also be discussed in summary form.",
      "رزومه د پورته له لارې موجود ده او می‌توان په خلاصه شیوه هم یې بررسی کرد.",
      "رزومه د پورته له لارې موجود ده او کولی شي په لنډیزه بڼه هم بحث شي."
    );
  }

  if (/(blog|article|writing|posts)/i.test(lower)) {
    const blog = knowledge.blog || [];
    if (!blog.length) return localize(language, "No public blog posts are available yet.", "تر اوسه کوم عامه بلاگ موجود نه دی.", "تر اوسه کوم عامه بلاگ موجود نه دی.");
    const titles = blog.slice(0, 3).map((post) => post.title).join(", ");
    return localize(
      language,
      `Recent public posts include ${titles}.`,
      `تازه عمومی مقالې عبارت دي له ${titles}.`,
      `تازه عامه مقالې عبارت دي له ${titles}.`
    );
  }

  if (/(github|repository|repo|code)/i.test(lower)) {
    return localize(
      language,
      "The portfolio includes GitHub references and public repositories when they are configured in the backend.",
      "پورته په GitHub کې عمومی ریپوزیتوری او مرجعونه شامل ده، کله چې په backend کې تنظیم شوي.",
      "پورته په GitHub کې عامه ریپوزیتوری او مرجعونه شامل ده، کله چې په backend کې تنظیم شي."
    );
  }

  return localize(
    language,
    "I can answer questions about the portfolio profile, skills, services, projects, experience, education, certifications, resume, blog, and GitHub when that data is available.",
    "زه کولی شم په پورته کې په پروفایل، مهارتونو، خدماتو، پروژه‌ګانو، تجربه، تحصیل، سندونو، رزومه، بلاگ او GitHub پورې جواب ورکړم کله چې دغه معلومات موجود وي.",
    "زه کولی شم په پورته کې په پروفایل، مهارتونو، خدماتو، پروژو، تجربه، تحصیل، سندونو، رزومه، بلاگ او GitHub پورې جواب ورکوم کله چې دغه معلومات موجود وي."
  );
}

function answerPortfolioQuestion(question, knowledge, language, conversation = []) {
  const lower = question.toLowerCase();
  const historyContext = buildHistoryExcerpt(conversation);

  if (/(which one uses react|react.*project|project.*react|uses react)/i.test(lower) || (historyContext && /react/i.test(historyContext) && /which|one|that|this|it/i.test(lower))) {
    const match = (knowledge.projects || []).find((project) => (project.technologies || []).some((tech) => /react/i.test(tech)));
    if (match) {
      return localize(
        language,
        `${match.title} is the project in this portfolio that uses React.`,
        `${match.title} هغه پروژه ده چې په پورته کې React استعمال کړی.`,
        `${match.title} هغه پروژه ده چې په پورته کې React استعمال کړی.`
      );
    }
  }

  return extractTopicAnswer(question, knowledge, language);
}

function buildGeneralAnswer(question, language) {
  const lower = question.toLowerCase();

  if (/react/i.test(lower)) {
    return localize(
      language,
      "React is a JavaScript library used to build interactive user interfaces. It lets developers create reusable UI components and manage changing data efficiently.",
      "ریاكت یوه جاواسکریپت کتابخانه ده چې د تعاملی یوزر انترفیسونو جوړولو لپاره کارول کیږي. دا ډویلپرانو د بیاکارولیدونکو UI کامپوننټونو جوړولو او د تغیراتو معلوماتو مدیریت کولو کې مرسته کوي.",
      "ری اکت یوه جاوا سکریپټ کتابخانه ده چې د متقابل کاربری انترفیسونو جوړولو لپاره کارول کیږي. دا ډویلپرانو د بیاکارولیدونکو UI کامپوننټونو جوړولو او د بدلون کېدو معلوماتو مدیریت کولو کې مرسته کوي."
    );
  }

  if (/node|express|backend/i.test(lower)) {
    return localize(
      language,
      "Node.js and Express are commonly used for backend APIs, authentication, server logic, and data services.",
      "Node.js او Express په معمول ډول د Backend API، احراز هویت، سرور لوجیک او د معلوماتو خدماتو لپاره کارول کیږي.",
      "Node.js او Express په معمول ډول د Backend API، احراز هویت، سرور لوجیک او د معلوماتو خدماتو لپاره کارول کیږي."
    );
  }

  if (/mongodb|database/i.test(lower)) {
    return localize(
      language,
      "MongoDB is a document-based database that stores structured data for modern web applications.",
      "MongoDB یوه د سندونو پراساس ډیټابیس ده چې د مدرن ویب اپلیکیشنونو لپاره داده‌ها ذخیره کوي.",
      "MongoDB یوه د سندونو پراساس ډیټابیس ده چې د مدرن ویب اپلیکیشنونو لپاره معلومات ذخیره کوي."
    );
  }

  return localize(
    language,
    "That sounds like a general technology question. I can explain the concept in simple terms and help relate it to the portfolio work when needed.",
    "دا یو عمومی تکنالوژی سوال دی. زه کولی شم مفهوم په ساده ډول تشریح کنم او په ضرورت کې په پورته کار پورې هم ربط ورکړم.",
    "دا یو عمومی ټیکنالوژی سوال دی. زه کولی شم مفهوم په ساده ډول تشریح کنم او په ضرورت کې په پورته کار پورې هم ربط ورکړم."
  );
}

function decideLocalAnswer(question, knowledge, conversation = []) {
  const lower = question.toLowerCase();
  const language = detectLanguage(question, conversation);

  const recentProjectContext = Array.isArray(conversation) && conversation.some((entry) => /project|portfolio|work|built/i.test(entry?.content || ""));
  const isPortfolioQuestion =
    SAFE_QUESTION_HINTS.some((hint) => lower.includes(hint)) ||
    /(project|skill|service|experience|education|certification|resume|blog|github|contact|profile|portfolio|technology|technologies|stack|framework|tool|tools)/i.test(lower) ||
    (recentProjectContext && /which|one|that|this|it/i.test(lower));
  const isGeneralTechnologyQuestion = !isPortfolioQuestion && !/(portfolio|profile|projects|resume|blog|github|contact|about|skill|service|experience|education|certification)/i.test(lower);

  if (isGeneralTechnologyQuestion && !/react.*project|project.*react|which one uses react|uses react/i.test(lower)) return buildGeneralAnswer(question, language);
  return answerPortfolioQuestion(question, knowledge, language, conversation);
}

export async function generatePortfolioReply(question, knowledge, conversation = []) {
  const { normalized, suspicious } = sanitizeQuestion(question);
  const language = detectLanguage(normalized, conversation);

  if (suspicious) {
    return localize(
      language,
      "I can only answer using the public portfolio information available here. I cannot help with private admin data, secrets, credentials, or hidden system details.",
      "من یوازې د موجوده عامه پورته معلوماتو له مخې جواب ورکوم. زه د خصوصی ادمین معلوماتو، رازونو، اعتبارنامو یا پټ سیستم تفصیلاتو سره مرسته نه کوم.",
      "زه یوازې د موجوده عامه پورته معلوماتو له مخې جواب ورکوم. زه د خصوصي ادمین معلوماتو، رازونو، اعتبارنامو یا پټ سیستم توضیحاتو سره مرسته نه کوم."
    );
  }

  const aiApiKey = process.env.AI_API_KEY || env.AI_API_KEY;
  if (env.AI_ENABLED && env.AI_PROVIDER_ENABLED && aiApiKey && activeProviderRequests < env.AI_MAX_CONCURRENT) {
    activeProviderRequests += 1;
    try {
      const history = Array.isArray(conversation) ? conversation.slice(-6) : [];
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${aiApiKey}`,
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL || env.AI_MODEL,
          input: [
            {
              role: "system",
              content:
                "You are a safe portfolio assistant. Use the supplied portfolio data for portfolio-related questions. For unrelated general technology questions, answer helpfully without inventing portfolio facts. Maintain the user’s language. Never reveal secrets, credentials, admin details, or private systems. If data is missing, say so briefly.",
            },
            ...history.map((entry) => ({
              role: entry.role === "assistant" ? "assistant" : "user",
              content: `${entry.content || ""}`,
            })),
            {
              role: "user",
              content: `Question: ${normalized}\n\nConversation context:\n${buildHistoryExcerpt(history)}\n\nPortfolio data:\n${safePortfolioSummary(knowledge)}`,
            },
          ],
          temperature: 0.3,
          max_output_tokens: 500,
        }),
        signal: AbortSignal.timeout(env.AI_TIMEOUT_MS),
      });

      if (response.ok) {
        const data = await response.json();
        const answer =
          data.output_text ||
          data.output
            ?.map((item) => item.content?.map((entry) => entry.text || "").join("\n") || "")
            .join("\n") ||
          "";

        if (answer) {
          return normalizeText(answer).slice(0, MAX_RESPONSE_LENGTH);
        }
      }
    } catch {
      // Fall back to deterministic local response when the external provider is unavailable.
    } finally {
      activeProviderRequests -= 1;
    }
  }

  const localAnswer = decideLocalAnswer(normalized, knowledge, conversation);
  return normalizeText(localAnswer).slice(0, MAX_RESPONSE_LENGTH);
}

function compactProfile(profile) {
  if (!profile) return null;
  return {
    name: profile.name,
    title: profile.title,
    tagline: profile.tagline,
    bio: profile.bio,
    specialization: profile.specialization,
    location: profile.location,
    availability: profile.availability,
    email: profile.email,
    phone: profile.phone,
    social: profile.social || {},
    resumeUrl: profile.resumeUrl,
  };
}

function compactSkill(skill) {
  return {
    name: skill.name,
    category: skill.category,
    level: skill.level,
    yearsExperience: skill.yearsExperience,
    description: skill.description,
  };
}

function compactService(service) {
  return {
    title: service.title,
    description: service.description,
    features: service.features || [],
    technologies: service.technologies || [],
  };
}

function compactProject(project) {
  return {
    title: project.title,
    slug: project.slug,
    description: project.description,
    fullDescription: project.fullDescription,
    category: project.category,
    technologies: project.technologies || [],
    features: project.features || [],
    github: project.github,
    demo: project.demo,
  };
}

function compactExperience(item) {
  return {
    position: item.position,
    company: item.company,
    location: item.location,
    startDate: item.startDate,
    endDate: item.endDate,
    description: item.description,
    achievements: item.achievements || [],
    technologies: item.technologies || [],
  };
}

function compactEducation(item) {
  return {
    degree: item.degree,
    university: item.university,
    faculty: item.faculty,
    startDate: item.startDate,
    endDate: item.endDate,
    gpa: item.gpa,
    description: item.description,
  };
}

function compactCertification(item) {
  return {
    name: item.name,
    organization: item.organization,
    date: item.date,
    credentialId: item.credentialId,
    description: item.description,
    verificationUrl: item.verificationUrl,
  };
}

function compactBlogPost(post) {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    category: post.category ? (typeof post.category === "object" ? post.category.name : post.category) : null,
    readingTime: post.readingTime,
    publishedAt: post.publishedAt,
  };
}

function safePortfolioSummary(knowledge) {
  return JSON.stringify(
    {
      profile: knowledge.profile,
      topSkills: knowledge.skills.slice(0, 12),
      services: knowledge.services.slice(0, 8),
      featuredProjects: knowledge.projects.slice(0, 6),
      experience: knowledge.experience.slice(0, 5),
      education: knowledge.education.slice(0, 4),
      certifications: knowledge.certifications.slice(0, 5),
      blogPosts: knowledge.blog.slice(0, 5),
      github: knowledge.github,
    },
    null,
    2
  );
}

export async function buildPortfolioKnowledge() {
  const [profile, skills, services, projects, experience, education, certifications, blogPosts] = await Promise.all([
    Profile.findOne().lean().exec().catch(() => null),
    Skill.find().sort({ featured: -1, order: 1 }).limit(50).lean().exec().catch(() => []),
    Service.find().sort({ featured: -1, order: 1 }).limit(50).lean().exec().catch(() => []),
    Project.find({ published: true }).sort({ featured: -1, order: 1 }).limit(20).lean().exec().catch(() => []),
    Experience.find().sort({ order: 1, startDate: 1 }).limit(20).lean().exec().catch(() => []),
    Education.find().sort({ order: 1, startDate: 1 }).limit(20).lean().exec().catch(() => []),
    Certification.find().sort({ order: 1, date: 1 }).limit(20).lean().exec().catch(() => []),
    BlogPost.find({ published: true }).sort({ publishedAt: -1 }).limit(8).lean().exec().catch(() => []),
  ]);

  let github = null;
  if (env.GITHUB_USERNAME) {
    try {
      const [profileData, repoData] = await Promise.all([getGithubProfile(), getGithubRepos({ perPage: 5 })]);
      github = {
        profile: profileData.profile,
        featuredRepos: repoData.featured,
        totalStars: repoData.totalStars,
      };
    } catch {
      github = null;
    }
  }

  return {
    profile: compactProfile(profile),
    skills: (skills || []).map(compactSkill),
    services: (services || []).map(compactService),
    projects: (projects || []).map(compactProject),
    experience: (experience || []).map(compactExperience),
    education: (education || []).map(compactEducation),
    certifications: (certifications || []).map(compactCertification),
    blog: (blogPosts || []).map(compactBlogPost),
    github,
  };
}

export const suggestedQuestions = DEFAULT_SUGGESTED_QUESTIONS;
