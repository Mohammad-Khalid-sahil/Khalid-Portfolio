import assert from "node:assert/strict";
import { describe, it, after } from "node:test";
process.env.AI_ENABLED = "true";
process.env.AI_PROVIDER_ENABLED = "true";
process.env.AI_API_KEY = "test-key";
const originalFetch = global.fetch;
let providerCalls = 0;
global.fetch = async () => { providerCalls += 1; throw new Error("provider unavailable in deterministic regression test"); };
const { generatePortfolioReply } = await import("../src/services/portfolioAiService.js");
after(() => { global.fetch = originalFetch; });
const knowledge = {
  profile: { name: "Mohammad Khalid Sahil", title: "Software Engineer", email: "hello@example.com" },
  skills: [{ name: "React" }, { name: "Node.js" }],
  projects: [{ title: "Nokta Academy", technologies: ["React"] }, { title: "Commerce API", technologies: ["Node.js"] }],
  services: [{ title: "Web Development" }], experience: [], education: [], certifications: [], blog: [], github: null,
};
describe("AI assistant relevance and localization", () => {
  it("answers a React project question with only matching portfolio projects", async () => {
    const answer = await generatePortfolioReply("Tell me about projects built with React.", knowledge);
    assert.match(answer, /Nokta Academy/);
    assert.doesNotMatch(answer, /Commerce API/);
  });
  it("keeps skills questions focused on skills even when a skill name is common", async () => {
    const answer = await generatePortfolioReply("What skills do you work with?", knowledge);
    assert.match(answer, /React.*Node\.js/);
    assert.doesNotMatch(answer, /project|Nokta|Commerce/i);
  });
  it("answers Dari questions in Dari rather than corrupted text", async () => {
    const answer = await generatePortfolioReply("در مورد مهارت‌ها معلومات بدهید", knowledge);
    assert.match(answer, /مهارت/);
    assert.match(answer, /React/);
    assert.doesNotMatch(answer, /Ø|Ù/);
  });
  it("detects Pashto and handles Pashto project wording", async () => {
    const answer = await generatePortfolioReply("ستاسو د پروژو په اړه معلومات راکړئ", knowledge);
    assert.match(answer, /پورټفولیو کې دا پروژې/);
    assert.match(answer, /Nokta Academy/);
  });
  it("keeps an English follow-up in English after an earlier Dari turn", async () => {
    const answer = await generatePortfolioReply("Which project uses React?", knowledge, [
      { role: "user", content: "د پروژه‌ها معلومات بدهید" }, { role: "assistant", content: "پروژه‌های نمونه" },
    ]);
    assert.match(answer, /Nokta Academy/);
    assert.match(answer, /project/i);
  });
  it("does not send unrelated questions to the AI provider", async () => {
    const before = providerCalls;
    const answer = await generatePortfolioReply("What is your favorite movie?", knowledge);
    assert.match(answer, /portfolio/i);
    assert.equal(providerCalls, before);
  });
});

