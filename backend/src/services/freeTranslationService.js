const MYMEMORY_ENDPOINT = "https://api.mymemory.translated.net/get";
const MAX_QUERY_BYTES = 450;

function byteLength(value) {
  return Buffer.byteLength(value, "utf8");
}

function splitText(value, maxBytes = MAX_QUERY_BYTES) {
  const tokens = value.match(/\s+|[^\s]+/gu) || [];
  const chunks = [];
  let current = "";

  for (let token of tokens) {
    while (byteLength(token) > maxBytes) {
      const codepoints = [...token];
      let part = "";
      while (codepoints.length && byteLength(part + codepoints[0]) <= maxBytes) part += codepoints.shift();
      if (current) chunks.push(current);
      if (part) chunks.push(part);
      current = "";
      token = codepoints.join("");
    }
    if (current && byteLength(current + token) > maxBytes) {
      chunks.push(current);
      current = "";
    }
    current += token;
  }
  if (current) chunks.push(current);
  return chunks;
}

async function translateChunk(chunk, target, fetchImpl) {
  const leading = chunk.match(/^\s*/u)?.[0] || "";
  const trailing = chunk.match(/\s*$/u)?.[0] || "";
  const source = chunk.slice(leading.length, chunk.length - trailing.length);
  if (!source) return chunk;

  const url = new URL(MYMEMORY_ENDPOINT);
  url.searchParams.set("q", source);
  url.searchParams.set("langpair", `en|${target}`);

  let response;
  try {
    response = await fetchImpl(url, { signal: AbortSignal.timeout(10000) });
  } catch {
    throw new Error("Free translation service is unavailable");
  }
  if (!response.ok) throw new Error("Free translation service is unavailable");

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("Free translation service returned an invalid response");
  }
  const translated = result?.responseStatus === 200 && result?.responseData?.translatedText;
  if (typeof translated !== "string") throw new Error("Free translation service returned no translation");
  return `${leading}${translated}${trailing}`;
}

async function translateValue(value, target, fetchImpl) {
  if (typeof value === "string") {
    const chunks = splitText(value);
    const translated = await Promise.all(chunks.map((chunk) => translateChunk(chunk, target, fetchImpl)));
    return translated.join("");
  }
  if (Array.isArray(value)) {
    return Promise.all(value.map((item) => translateValue(item, target, fetchImpl)));
  }
  throw new Error("Translation values must be strings or string arrays");
}

/** Translate validated CMS content through MyMemory's anonymous free tier. */
export async function translateCmsContent(content, fetchImpl = fetch) {
  const translations = { fa: {}, ps: {} };
  for (const [field, value] of Object.entries(content)) {
    translations.fa[field] = await translateValue(value, "fa", fetchImpl);
    translations.ps[field] = await translateValue(value, "ps", fetchImpl);
  }
  return translations;
}

