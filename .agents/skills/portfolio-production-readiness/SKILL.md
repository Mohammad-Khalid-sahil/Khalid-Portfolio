---
name: portfolio-production-readiness
description: Audit, repair, test, and document production readiness for this portfolio repository. Use when preparing this project for hosting or reviewing its deployment safety; do not deploy or mutate production systems.
metadata:
  short-description: Audit and harden the portfolio for production
---

# Portfolio production readiness

Use this skill for a full pre-deployment audit and remediation of this repository. Keep the existing React/Vite frontend, Express/Mongoose API, MongoDB data model, visual design, routes, API contracts, and features unless a verified defect requires a narrowly scoped change. This workflow prepares and verifies code; it never deploys, publishes, changes DNS, or operates on production data.

## Safety and preservation

- Inspect project guidance, structure, Git status, manifests, scripts, environment validation, routes, models, middleware, tests, deployment files, and prior QA reports before editing. If Git is absent, make timestamped backups of only the files that will be changed; never overwrite a backup.
- Do not read or print secret values. Report configuration names and presence only. Never invent credentials, production domains, API endpoints, or provider settings.
- Never clear, drop, seed, migrate, or otherwise mutate a real database. Inspect database-dependent tests before running them. Use a unique disposable local database and temporary storage for tests that write; do not delete user files or existing uploads.
- Do not install or upgrade dependencies unless a verified defect requires it. Do not deploy, publish, change DNS, or incur external service cost. Ask before any action that can affect a live service, production data, secrets, or paid service.
- Preserve uncommitted user work. Do not hide failures by weakening validation or substituting fake production configuration.

## Workflow

1. **Baseline:** Inventory the repository and technology stack, identify relevant docs and prior audits, and check Git status. Record test, lint, type-check, dependency, and build results before source changes. State unavailable checks and unsafe tests explicitly. Do not claim every file was reviewed if the repository is too large for line-by-line review.
2. **Triage:** Verify each suspected issue in source and callers. Trace environment variables from examples and docs into runtime configuration; trace auth, API, database, upload, AI, analytics, logging, and hosting paths end to end. Separate confirmed defects from risks and unknowns. Record evidence, impact, minimal repair, and rollback before editing.
3. **Repair:** Fix confirmed blockers with the smallest compatible changes. Preserve routes, schemas, public content, localization, auth behavior, and APIs unless change is required. Coordinate frontend/backend changes when a security fix crosses the API boundary. Back up touched files when there is no Git checkpoint.
4. **Verify:** Run focused regression tests, relevant lint/syntax/type checks, dependency consistency and clean-install checks where safe, and production builds. Exercise the real local app in a browser when available, including direct route loads, refresh, navigation, locales, RTL, responsive layouts, empty/loading/error states, console errors, and essential API requests. Use isolated data and storage for mutation tests. Never equate HTTP 200 or compilation alone with a functioning page.
5. **Operations:** Verify environment names and production validation, CORS, host/port binding, health/readiness, shutdown, persistent upload storage, secrets handling, backup and restore procedures, logging/monitoring, rate and cost limits, CI gates, and deployment/rollback instructions. If no hosting platform is selected, document platform-neutral requirements and mark platform-specific checks blocked or unverified; do not fabricate settings.
6. **Final review:** Re-run checks affected by fixes, inspect the complete diff for unrelated or accidental changes, and compare with baseline. Report only observed results. Keep unresolved risks, blocked checks, required operator configuration, hosting/storage/database decisions, and actions needing approval visible.

## Project-specific baseline leads

Treat these as hypotheses to re-check on every invocation, not assumed current defects:

- Prior audit flagged a `bcryptjs` manifest/lock mismatch, absent runtime upload-storage settings, and backend Mongo URI naming drift.
- The frontend production build validates `VITE_API_URL` and `VITE_SITE_URL`; determine their actual use and keep HTTPS/real-host validation strict.
- Admin access-token persistence, public AI request controls, deployment/CI, backups/restores, monitoring, and end-to-end coverage require verification.
- A previous local audit estimated 50/100. Recalculate only with a documented, repeatable rubric and state the rubric and evidence.

## Deliverables

Before source edits, record the initial findings and proposed repairs in the maintained audit documentation (create `docs/production-readiness-report.md` only if no equivalent exists). Update or create, without duplicates, a platform-neutral `docs/deployment-guide.md` and `docs/production-environment-checklist.md` when useful. Add focused tests and CI only when they fit the current architecture and can be verified safely. Keep this skill concise and repository-specific; do not copy generic policy catalogs into it.

## Final status vocabulary

Label each material finding **FIXED**, **VERIFIED**, **NOT VERIFIED**, or **BLOCKED**. Include severity, root cause, evidence, files changed, exact commands and outcomes, browser evidence, skipped tests and why, residual risks, required environment variables, operator decisions, and rollback guidance. Give an overall readiness verdict and score only when the score is reproducible. Never claim full production readiness while a critical control remains blocked or unverified.

## Selected deployment reference: Vercel + Render

When this repository is prepared for its selected hosting target, inspect and verify the current provider documentation before editing provider files. The current reference is Vercel for `frontend/` (Vite, `npm ci`, `npm run build`, `dist`, real `VITE_API_URL` and `VITE_SITE_URL`) and Render for `backend/` (Node 24, `npm ci`, `npm start`, `HOST=0.0.0.0`, host-assigned `PORT`, `/api/health`). Preserve strict origin validation and never place secrets in `VITE_` values.

Verify SPA deep links with Vercel's supported configuration; do not assume Netlify `_redirects` applies. Document Render's ephemeral filesystem, persistent disk behavior, service egress, Atlas allowlisting, and the configured object-storage or persistent-volume choice. Prefer narrow MongoDB network access; never recommend `0.0.0.0/0`. Test cookie refresh in real browsers. If frontend and API use unrelated provider default domains, account for third-party cookie blocking; recommend selected custom domains under one registrable site and require operator verification. No provider project creation, paid resource, DNS edit, deploy, or production-data operation is authorized by this workflow.
