import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const vercelConfig = JSON.parse(fs.readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const inlineBootstrap = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const bootstrapHash = crypto.createHash("sha256").update(inlineBootstrap.replace(/\r\n/g, "\n")).digest("base64");
const headers = vercelConfig.headers[0].headers;
const reportOnlyPolicy = headers.find(({ key }) => key === "Content-Security-Policy-Report-Only")?.value;

function validateProductionEnv(apiUrl, siteUrl) {
  const childEnv = { ...process.env, NODE_ENV: "production" };
  if (apiUrl === undefined) delete childEnv.VITE_API_URL;
  else childEnv.VITE_API_URL = apiUrl;
  if (siteUrl === undefined) delete childEnv.VITE_SITE_URL;
  else childEnv.VITE_SITE_URL = siteUrl;
  return spawnSync(process.execPath, ["scripts/validate-production-env.js"], {
    cwd: process.cwd(),
    env: childEnv,
    encoding: "utf8",
  });
}

test("Vercel uses the package build, dist output, and SPA rewrite", () => {
  const packageJson = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(vercelConfig.framework, "vite");
  assert.equal(vercelConfig.installCommand, "npm ci");
  assert.equal(vercelConfig.buildCommand, "npm run build");
  assert.ok(packageJson.scripts.build);
  assert.equal(vercelConfig.outputDirectory, "dist");
  assert.equal(vercelConfig.rewrites[0].destination, "/index.html");
});

test("report-only CSP allows the current theme bootstrap and inventoried resources", () => {
  assert.ok(inlineBootstrap);
  assert.match(reportOnlyPolicy, new RegExp(`'sha256-${bootstrapHash.replace(/[+/=]/g, "\\$&")}'`));
  assert.match(reportOnlyPolicy, /style-src 'self' 'unsafe-inline' https:\/\/fonts\.googleapis\.com/);
  assert.match(reportOnlyPolicy, /font-src 'self' data: https:\/\/fonts\.gstatic\.com/);
  assert.match(reportOnlyPolicy, /connect-src 'self' https:/);
  assert.match(reportOnlyPolicy, /img-src 'self' data: blob: https:/);
  assert.match(reportOnlyPolicy, /frame-src 'self' https:/);
  assert.match(reportOnlyPolicy, /object-src 'none'/);
  assert.match(reportOnlyPolicy, /frame-ancestors 'none'/);
  assert.equal(headers.some(({ key }) => key.toLowerCase() === "content-security-policy"), false);
});

test("production URL validation accepts the configured API prefix and site origin", () => {
  const result = validateProductionEnv(
    "https://khalid-portfolio-opal.vercel.app/api",
    "https://khalid-portfolio.vercel.app"
  );
  assert.equal(result.status, 0, result.stderr);
});

test("production URL validation rejects missing and known placeholder values", () => {
  const missing = validateProductionEnv(undefined, "https://khalid-portfolio.vercel.app");
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /VITE_API_URL is required/);

  const placeholder = validateProductionEnv(
    "https://portfolio-build-check.example.org/api",
    "https://khalid-portfolio.vercel.app"
  );
  assert.notEqual(placeholder.status, 0);
  assert.match(placeholder.stderr, /real HTTPS production host/);
});

test("production URL validation rejects localhost, invalid schemes, and duplicated API paths", () => {
  for (const apiUrl of [
    "http://api.khalid-portfolio.vercel.app/api",
    "https://localhost/api",
    "https://khalid-portfolio-opal.vercel.app/api/api",
    "not-a-url",
  ]) {
    const result = validateProductionEnv(apiUrl, "https://khalid-portfolio.vercel.app");
    assert.notEqual(result.status, 0, apiUrl);
  }
});
