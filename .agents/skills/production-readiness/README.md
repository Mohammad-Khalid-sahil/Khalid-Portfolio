# Production Readiness Skill — v2

A reusable **production governance layer for AI-native systems**, packaged as
a Claude Code skill. It turns "is this ready to ship?" into a hard
**PASS / BLOCK** gate across 16 audit categories instead of a vibe check.

Designed to be the kind of internal pre-launch gate a Staff+ engineer or AI
platform architect would actually enforce.

## What it covers

| # | Category | # | Category |
|---|----------|---|----------|
| 1 | API security | 10 | File upload security |
| 2 | Multi-tenant safety | 11 | Reliability engineering |
| 3 | Frontend security | 12 | Cost protection |
| 4 | AI evaluation systems | 13 | Observability maturity |
| 5 | Deployment governance | 14 | AI governance |
| 6 | Abuse prevention | 15 | Testing strategy |
| 7 | Webhook validation | 16 | Analytics hygiene |
| 8 | Infra readiness | | |
| 9 | Compliance & privacy | | |

§17 is not a category — it is the final decision, and it gates on all sixteen.

Each category resolves to **PASS**, **BLOCK**, or **N/A** — with required
evidence (`file:line`, config key, or test name). **Any** unresolved
**BLOCK** means **not production ready**. Every category that can raise a
BLOCK gates the launch, so there is no defect here that is real but shippable.

## Why v2

v2 hardens the original readiness checklist for **AI-native** systems
specifically — adding API security, multi-tenant isolation, frontend
security, AI evaluation gating, deployment governance, abuse prevention,
webhook validation, infra readiness, compliance/privacy, file-upload
security, reliability engineering, model-cost protection, observability
maturity, AI governance (prompt-injection + tool authz), testing strategy,
analytics hygiene, explicit launch gates, and activation rules for
Claude / Codex / Cursor.

## Install

**Claude Code (personal skills):**

```bash
git clone https://github.com/Imasaikiran/production-readiness-skill.git \
  ~/.claude/skills/production-readiness
```

It activates automatically when you ask things like *"is this production
ready"*, *"pre-launch review"*, *"harden this"*, *"can we deploy"*, or when a
change touches auth, tenancy, payments, uploads, webhooks, or model calls.

**Manual / other agents (Codex, Cursor):** point the agent at
[`SKILL.md`](./SKILL.md) — it is a self-contained governance spec.

## Output

The skill produces a decision, not prose:

```
PRODUCTION READINESS: BLOCK
Blocking:
  §2 Multi-tenant — no cross-tenant test  (evidence: tests/ has none)
  §12 Cost        — no global spend cap    (evidence: billing.ts:—)
Passing: §1, §3, §5, §7, §8, §11, §15
N/A:     §10 (no uploads), §16 (no analytics yet)
Next: smallest set of changes to flip each BLOCK to PASS.
```

## Operating principles

- **Evidence or it's a BLOCK** — no vibe-based passes.
- **Audit first, fix second** — full audit, then the smallest fix set.
- **Scope honestly** — mark `N/A` loudly, never fake a pass.
- **One BLOCK = not ready** — and the skill says so plainly.

## License

MIT — see [LICENSE](./LICENSE).
