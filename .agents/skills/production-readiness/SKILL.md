---
name: production-readiness
description: >-
  Production governance layer for AI-native systems. Use before shipping,
  merging to main, deploying, opening a launch PR, or whenever the user says
  "is this production ready", "ship checklist", "pre-launch review",
  "go-live", "harden this", "production audit", or "can we deploy". Audits
  API security, multi-tenant isolation, frontend security, AI evaluation,
  deployment governance, abuse prevention, webhook validation, infra
  readiness, compliance/privacy, file-upload security, reliability, cost
  controls, observability, AI governance, testing strategy, analytics
  hygiene, and launch gates. Produces a PASS / BLOCK gate decision, not prose.
version: 2.0.0
license: MIT
---

# Production Readiness — v2

A reusable production governance layer for AI-native systems. This is a
**rigid gate skill**: each of the **16 audit categories** below resolves to
**PASS**, **BLOCK**, or **N/A**. §17 is not a category — it is the final
decision.

**Any** unresolved **BLOCK** means the system is **not** production ready.
Not "a BLOCK in an important category" — any of them. Every category that
can raise a BLOCK appears in the §17 gate, so there is no such thing here as
a defect that is real but does not stop the ship. Do not soften this.

## Activation rules (Claude / Codex / Cursor)

Invoke this skill — do not freelance — when ANY of these are true:

- A change is being merged to `main` / `release` / a deploy branch.
- The user asks about shipping, deploying, go-live, launch, or "is this ready".
- A PR touches auth, tenancy, payments, file upload, webhooks, or model calls.
- An incident postmortem asks "why did this reach production".
- A new external surface is exposed (public endpoint, webhook, upload, share link).

When invoked: walk the 16 categories in order, one at a time, tracking
progress with whatever task list the host agent provides. Record evidence
(file:line, config key, test name) for each verdict. A verdict without
evidence is **BLOCK** by default — "looks fine" is not a pass.

---

## 1. API security

- AuthN on every non-public route; deny-by-default, not allow-by-default.
- AuthZ checked at the **resource**, not just the route (no IDOR).
- Input validated at the boundary with a schema (zod/pydantic/etc.); reject
  unknown fields. Output encoded for its sink.
- Rate limits per identity AND per IP; separate stricter limit on auth,
  password reset, and model-invoking endpoints.
- No secrets, stack traces, or internal IDs in error responses.
- CORS allowlist explicit — never `*` with credentials.

**BLOCK if:** any state-changing endpoint lacks server-side authz, or input
reaches a DB / shell / model prompt without validation.

## 2. Multi-tenant safety

- Every tenant-scoped query carries a tenant predicate enforced server-side
  (RLS, query builder scope, or middleware) — never trusted from the client.
- Tenant ID derived from the session/token, never from request body.
- Cross-tenant test exists: tenant A token + tenant B resource id → 404/403.
- Shared caches, vector indexes, and model context are tenant-keyed.
- Background jobs and webhooks re-resolve tenant context, don't inherit it.

**BLOCK if:** no automated cross-tenant isolation test, or any tenant id is
read from client-controlled input.

## 3. Frontend security

- No secrets in the bundle (API keys, model keys, service tokens).
- Output escaped; `dangerouslySetInnerHTML` / `v-html` only with sanitizer.
- CSP set; `frame-ancestors` / clickjacking protection on.
- Auth tokens in httpOnly cookies or memory — not `localStorage` if XSS-reachable.
- Third-party scripts pinned (SRI) and reviewed; no unvetted analytics blobs.

**BLOCK if:** any privileged key is shipped to the browser.

## 4. AI evaluation systems

- A versioned eval set exists (golden cases + adversarial + regression).
- Quality gate in CI: eval score must clear a threshold to merge.
- Hallucination / refusal / jailbreak cases are in the suite, not aspirational.
- Prompt and model version are pinned and logged per request.
- Eval results are diffed across every model upgrade before it ships.

**BLOCK if:** model behavior can change in prod with no eval gate in CI.

## 5. Deployment governance

- Single, reproducible deploy path (IaC / pipeline) — no manual prod edits.
- Migrations are forward-safe, reversible or expand-contract, tested on a
  prod-shaped dataset.
- Rollback is one command and rehearsed, not theoretical.
- Environments isolated: no shared DB/keys between staging and prod.
- Change is behind a flag or staged rollout if blast radius is large.

**BLOCK if:** no rehearsed rollback, or a destructive migration with no recovery.

## 6. Abuse prevention

- Bot / automation defense on signup, login, and any free model-cost path.
- Per-account quotas + global circuit breaker on model spend.
- Content abuse handling (CSAM/illegal → report path; spam → throttling).
- Enumeration defenses (uniform timing/responses on auth + lookup).

**BLOCK if:** an unauthenticated endpoint can drive unbounded model cost.

## 7. Webhook validation

- Signature verified (HMAC/timestamp) before any processing; reject on fail.
- Replay protection: timestamp window + idempotency key dedup.
- Handler is idempotent — same event twice = same end state.
- Payload schema-validated; provider IP/source checked where offered.
- Failures dead-letter, don't silently drop.

**BLOCK if:** any webhook mutates state before signature verification.

## 8. Infra readiness

- Health + readiness probes distinct and accurate.
- Resource limits/requests set; autoscaling tested under load.
- Secrets from a manager (not env files in the image / repo).
- Backups exist AND a restore was actually performed.
- Single points of failure identified; graceful degradation defined.

**BLOCK if:** backups have never been test-restored.

## 9. Compliance & privacy

- PII inventory exists; data classified and minimized.
- Retention + deletion policy enforced in code (not a doc).
- DSAR / "delete my data" path works end to end.
- Data residency honored if claimed; subprocessors listed.
- Consent captured where required; logs scrubbed of PII.

**BLOCK if:** user data cannot actually be deleted on request.

## 10. File upload security

- Type validated by content (magic bytes), not extension/MIME header.
- Size cap + count cap; uploads stream, not buffer unbounded.
- Stored outside webroot, served via signed URLs, never executed.
- AV / content scan for user-shared files; images re-encoded to strip payloads.
- Filenames sanitized; no path traversal; randomized storage keys.

**BLOCK if:** uploaded files are served from a path that can execute them.

## 11. Reliability engineering

- Timeouts on every outbound call (DB, model, HTTP) — no infinite waits.
- Retries with backoff + jitter and a cap; idempotent before retrying.
- Circuit breakers / bulkheads around the model provider and other deps.
- Graceful degradation: model down ≠ whole product down.
- Load + soak tested at expected peak; failure injection done once.

**BLOCK if:** a model-provider outage takes the entire product down.

## 12. Cost protection

- Hard ceiling on model spend (per user, per tenant, global) with kill switch.
- Token budgets enforced server-side; truncation/strategy defined for long input.
- Caching for repeat prompts where correctness allows.
- Cost per request logged; spend dashboard + alert thresholds wired.

**BLOCK if:** there is no hard global cap on model spend.

## 13. Observability maturity

- Structured logs with request/trace/tenant id correlation.
- Metrics: latency, error rate, saturation, model latency + token cost.
- Distributed tracing across the model call boundary.
- Actionable alerts (symptom-based, low false-positive), with owners + runbooks.
- Prompt/response sampled and stored (PII-scrubbed) for debugging.

**BLOCK if:** a prod model failure cannot be diagnosed from telemetry alone.

## 14. AI governance

- System prompts and tools are version-controlled and reviewed.
- Tool/function calls are allow-listed and authz'd as their own actions.
- Untrusted content (RAG docs, user text, web) is treated as data, not
  instructions — prompt-injection boundary is explicit.
- Output guardrails: PII, unsafe content, and policy filters on responses.
- Human-in-the-loop for irreversible/high-impact AI actions.

**BLOCK if:** model output can trigger a privileged action with no authz or
human gate.

## 15. Testing strategy

- Unit + integration + at least one end-to-end golden-path test.
- Security tests: authz, cross-tenant, injection — automated, in CI.
- Eval suite gates merges (see §4).
- Flaky tests quarantined, not ignored; coverage on critical paths real.
- A failing test blocks merge (branch protection enforced).

**BLOCK if:** critical paths (auth, tenancy, payment, model) have no automated test.

## 16. Analytics hygiene

- Events have a documented, versioned schema; no PII in event payloads.
- Consent respected before tracking; opt-out works.
- Server-side events for anything trust-sensitive (revenue, conversion).
- Sampling/identity strategy documented; no key data lost to ad-blockers.

**BLOCK if:** PII is shipped to a third-party analytics processor.

## 17. Launch gates (final decision)

Ship only if **every** category is PASS or a defensible N/A. No exceptions,
no "fix later". All sixteen are here on purpose: if a category is worth a
BLOCK rule, it is worth stopping a launch.

- [ ] §1 API security — no missing server-side authz
- [ ] §2 Multi-tenant — cross-tenant isolation test passes
- [ ] §3 Frontend — no privileged key shipped to the browser
- [ ] §4 AI evaluation — model behavior cannot change in prod without an eval gate
- [ ] §5 Deployment — rehearsed rollback exists
- [ ] §6 Abuse — no unauthenticated path to unbounded model cost
- [ ] §7 Webhooks — verify-before-process (if webhooks exist)
- [ ] §8 Infra — restore actually tested
- [ ] §9 Compliance — deletion path works (if storing user data)
- [ ] §10 Upload — no executable upload path (if uploads exist)
- [ ] §11 Reliability — provider outage is survivable
- [ ] §12 Cost — global model-spend kill switch exists
- [ ] §13 Observability — a prod model failure is diagnosable from telemetry
- [ ] §14 AI governance — no unguarded privileged AI action
- [ ] §15 Testing — critical paths covered + branch protection on
- [ ] §16 Analytics — no PII reaching a third-party processor (if analytics exist)

Output format the skill must produce:

```
PRODUCTION READINESS: BLOCK
Blocking:
  §2 Multi-tenant — no cross-tenant test  (evidence: tests/ has none)
  §12 Cost        — no global spend cap    (evidence: billing.ts:—)
Passing: §1, §3, §5, §7, §8, §11, §15
N/A:     §10 (no uploads), §16 (no analytics yet)
Next: smallest set of changes to flip each BLOCK to PASS.
```

## Operating rules

- Evidence or it's a BLOCK. No vibe-based passes.
- Don't fix while auditing — audit fully, report, then fix the smallest set.
- Scope honestly: mark N/A loudly rather than fake a pass. N/A needs a reason
  ("no uploads in this system"), not a shrug.
- One BLOCK anywhere = not production ready. Say so plainly. There is no
  tier of BLOCK that you are allowed to ship past.
