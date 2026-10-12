import assert from "node:assert/strict";
import { test } from "node:test";
import { localizeCmsContent, resolveCmsLocale } from "../src/utils/cmsLocalization.js";

test("CMS localization preserves legacy fields and applies requested then English fallbacks", () => {
  const legacy = { title: "Legacy title", description: "Legacy description" };
  const localized = {
    ...legacy,
    translations: {
      en: { description: "English translation" },
      fa: { title: "Dari title" },
      ps: { title: "Pashto title" },
    },
  };
  assert.deepEqual(localizeCmsContent(legacy, "fa"), legacy);
  assert.deepEqual(localizeCmsContent(localized, "fa"), { title: "Dari title", description: "English translation" });
  assert.deepEqual(localizeCmsContent(localized, "ps"), { title: "Pashto title", description: "English translation" });
  assert.deepEqual(localizeCmsContent(localized, "invalid"), { title: "Legacy title", description: "English translation" });
  assert.equal(resolveCmsLocale("PS"), "ps");
  assert.equal(resolveCmsLocale("unknown"), "en");
});

test("CMS localization projects nested populated documents and does not expose translation internals", () => {
  const result = localizeCmsContent({
    title: "English project",
    category: { name: "English category", slug: "category", translations: { fa: { name: "Dari category" } } },
    translations: { fa: { title: "Dari project" } },
  }, "fa");
  assert.deepEqual(result, {
    title: "Dari project",
    category: { name: "Dari category", slug: "category" },
  });
});
