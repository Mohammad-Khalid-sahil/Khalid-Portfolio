import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_access_secret_that_is_long_enough_12345";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_that_is_long_enough_12345";
delete process.env.AI_API_KEY;

const { env } = await import("../src/config/env.js");
const User = (await import("../src/models/User.js")).default;
const cmsTranslationRoutes = (await import("../src/routes/cmsTranslationRoutes.js")).default;
const { errorHandler } = await import("../src/middlewares/errorHandler.js");

test("all CMS translation forms work without an AI provider key", async (t) => {
  const userId = new mongoose.Types.ObjectId().toString();
  User.findById = async (id) => (id === userId ? { _id: userId, role: "admin", sessionVersion: 0 } : null);

  const originalFetch = global.fetch;
  const requestedTargets = [];
  global.fetch = async (input, options) => {
    const url = new URL(input);
    if (url.hostname !== "translate.googleapis.com") return originalFetch(input, options);
    const target = url.searchParams.get("tl");
    requestedTargets.push(target);
    return {
      ok: true,
      json: async () => [[[`${target}: ${url.searchParams.get("q")}`, url.searchParams.get("q")]]],
    };
  };
  t.after(() => { global.fetch = originalFetch; });

  const app = express();
  app.use("/api/cms-translations", cmsTranslationRoutes);
  app.use(errorHandler);
  const server = app.listen(0);
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const token = jwt.sign({ sub: userId }, env.JWT_SECRET);
  const forms = [
    ["projects", "title"], ["skills", "description"], ["services", "title"],
    ["experiences", "position"], ["education", "degree"], ["certifications", "name"],
    ["testimonials", "message"], ["categories", "name"], ["tags", "name"],
    ["blog", "title"], ["profile", "title"], ["settings", "siteDescription"],
  ];

  for (const [resource, field] of forms) {
    const response = await originalFetch(`http://127.0.0.1:${server.address().port}/api/cms-translations/translate`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ resource, content: { [field]: "Portfolio" } }),
    });
    const json = await response.json();
    assert.equal(response.status, 200, `${resource} translation failed: ${json.message}`);
    assert.equal(json.data.translations.fa[field], "fa: Portfolio");
    assert.equal(json.data.translations.ps[field], "ps: Portfolio");
  }

  assert.equal(requestedTargets.filter((target) => target === "fa").length, forms.length);
  assert.equal(requestedTargets.filter((target) => target === "ps").length, forms.length);

  const longContentResponse = await originalFetch(`http://127.0.0.1:${server.address().port}/api/cms-translations/translate`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ resource: "projects", content: { description: "A".repeat(3000) } }),
  });
  assert.equal(longContentResponse.status, 200, "long project copy should be translated in chunks");
  assert.equal(process.env.AI_API_KEY, undefined);
});
