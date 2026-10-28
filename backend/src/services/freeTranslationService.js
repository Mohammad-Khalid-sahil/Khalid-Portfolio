const PROVIDERS = [
  {
    endpoint: "https://translate.googleapis.com/translate_a/single",
    buildUrl(source, target) {
      const url = new URL(this.endpoint);
      url.searchParams.set("client", "gtx");
      url.searchParams.set("sl", "en");
      url.searchParams.set("tl", target);
      url.searchParams.set("dt", "t");
      url.searchParams.set("q", source);
      return url;
    },
    async read(response) {
      const result = await response.json();
      const translated = Array.isArray(result?.[0])
        ? result[0].map((part) => part?.[0]).filter((part) => typeof part === "string").join("")
        : "";
      return translated || null;
    },
  },
  {
    endpoint: "https://api.mymemory.translated.net/get",
    buildUrl(source, target) {
      const url = new URL(this.endpoint);
      url.searchParams.set("q", source);
      url.searchParams.set("langpair", `en|${target}`);
      return url;
    },
    async read(response) {
      const result = await response.json();
      return result?.responseStatus === 200 && typeof result?.responseData?.translatedText === "string"
        ? result.responseData.translatedText
        : null;
    },
  },
];
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

  for (const provider of PROVIDERS) {
    try {
      const response = await fetchImpl(provider.buildUrl(source, target), { signal: AbortSignal.timeout(10000) });
      if (!response.ok) continue;
      const translated = await provider.read(response);
      if (translated) return `${leading}${translated}${trailing}`;
    } catch {
      // Try the next provider when this one is down, rate-limited, or returns an invalid response.
    }
  }
  throw new Error("Free translation services are unavailable");
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

/** Translate validated CMS content through free providers with an automatic fallback. */
export async function translateCmsContent(content, fetchImpl = fetch) {
  const translations = { fa: {}, ps: {} };
  await Promise.all(Object.entries(content).map(async ([field, value]) => {
    [translations.fa[field], translations.ps[field]] = await Promise.all([
      translateValue(value, "fa", fetchImpl),
      translateValue(value, "ps", fetchImpl),
    ]);
  }));
  return translations;
}

