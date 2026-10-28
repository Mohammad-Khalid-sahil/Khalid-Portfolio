import test from "node:test";
import assert from "node:assert/strict";
import { translateCmsContent } from "../src/services/freeTranslationService.js";

test("free CMS translation preserves field and array shape and requests Dari and Pashto", async () => {
  const requested = [];
  const fetchMock = async (url, options) => {
    requested.push({ url: new URL(url), options });
    const target = new URL(url).searchParams.get("langpair").split("|")[1];
    return {
      ok: true,
      json: async () => ({ responseStatus: 200, responseData: { translatedText: target } }),
    };
  };

  const translations = await translateCmsContent({ title: "Portfolio", features: ["Fast delivery", "Secure design"] }, fetchMock);

  assert.deepEqual(translations, {
    fa: { title: "fa", features: ["fa", "fa"] },
    ps: { title: "ps", features: ["ps", "ps"] },
  });
  assert.deepEqual(requested.map(({ url }) => url.searchParams.get("langpair")), ["en|fa", "en|ps", "en|fa", "en|fa", "en|ps", "en|ps"]);
  assert.ok(requested.every(({ options }) => options.signal instanceof AbortSignal));
});

test("free CMS translation splits requests below MyMemory's 500-byte segment cap", async () => {
  const requested = [];
  const source = `${"portfolio-content ".repeat(45)}خالد`; // Includes UTF-8 multibyte text.
  const fetchMock = async (url) => {
    const parsed = new URL(url);
    requested.push(parsed.searchParams.get("q"));
    const target = parsed.searchParams.get("langpair").split("|")[1];
    return {
      ok: true,
      json: async () => ({ responseStatus: 200, responseData: { translatedText: target } }),
    };
  };

  const result = await translateCmsContent({ content: source }, fetchMock);

  assert.ok(requested.length > 2);
  assert.ok(requested.every((part) => Buffer.byteLength(part, "utf8") <= 450));
  assert.equal(result.fa.content.split("fa").length - 1, requested.length / 2);
  assert.equal(result.ps.content.split("ps").length - 1, requested.length / 2);
});

test("free CMS translation fails safely when the provider is unavailable", async () => {
  await assert.rejects(
    translateCmsContent({ title: "Portfolio" }, async () => ({ ok: false })),
    /unavailable/
  );
});
