# Production Readiness Checklist

Baseline established 2026-10-12. This is the issue tracker for the production-readiness audit; `production-environment-checklist.md` remains the operator-facing environment setup checklist. No application code or configuration was changed in Phase 0.

Statuses: **Confirmed Open**, **In Progress**, **Fixed and Tested**, **Fixed but Not Fully Verified**, **Blocked by My Decision**, **Not Applicable**.

| ID | Severity | Issue / impact | Status | Evidence and affected files | Verification / recovery |
| --- | --- | --- | --- | --- | --- |
| AUTH-01 | High | Access JWTs remain usable after logout until expiry; default expiry is one day. | Fixed and Tested | `backend/src/config/env.js`, `backend/src/controllers/authController.js`, `backend/src/middlewares/auth.js`, `backend/tests/auth.test.js` | Session-version check revokes account sessions at logout; 15-minute default, duration parser and regression tests. |
| AUTH-02 | High | Logout scope had been undecided; the existing model stores one refresh-token hash, so refresh sessions are single-session per account. | Fixed and Tested | User decision recorded 2026-10-12; `backend/src/models/User.js`, `backend/src/controllers/authController.js` | User selected account-wide logout; kept the existing single-refresh-session model. |
| AUTH-03 | High | Refresh-token rotation was not atomic, leaving a replay/concurrency window. | Fixed and Tested | `backend/src/controllers/authController.js`, `backend/tests/auth.test.js` | Conditional single-document replacement permits one use of each refresh token; replay/concurrency regression test passes. |
| ABUSE-01 | High | Login limits are IP based; auth, API, contact, and AI rate-limit state is process-local. Multi-instance limits would not be shared. | Confirmed Open | `backend/src/middlewares/rateLimiters.js`, `backend/src/app.js` | Hosting topology and shared-store choice must precede implementation; test outage behavior and simultaneous instances. |
| AI-01 | High | No global/provider billing ceiling was verified. Third-party calls now default off in production via `AI_PROVIDER_ENABLED`; explicit opt-in still has only per-instance limits. | Confirmed Open | `backend/src/config/env.js`, `backend/src/controllers/aiController.js`, `backend/src/services/portfolioAiService.js`, `backend/src/middlewares/rateLimiters.js` | Keep provider calls disabled until account-level controls and shared abuse limits are configured and tested. |
| AI-02 | High | No versioned AI evaluation suite or CI quality gate was found. | Confirmed Open | `backend/tests/`, `.github/workflows/ci.yml` | Define safe synthetic/adversarial cases and a reviewed threshold before enabling model changes. |
| SEC-01 | High | Frontend now has a hash-aware CSP report-only policy and frame-ancestor restriction; enforcement remains unverified pending actual origins and browser reports. | In Progress | `frontend/vercel.json`, `frontend/index.html`, `frontend/tests/vercel-security-config.test.js` | Check CSP reports in a real browser/preview with real API/media domains; narrow broad HTTPS sources and enforce only after legitimate app requests are clean. |
| UPLOAD-01 | High | Uploads have size/type/signature checks, but are buffered in memory, publicly served, and not decoded/re-encoded. Production storage durability is unverified. | Confirmed Open | `backend/src/middlewares/upload.js`, `backend/src/utils/storage.js`, `backend/src/app.js` | Decide storage provider and public-read intent. Preserve existing allowlist and limits; test decoder/storage changes with disposable fixtures. |
| ANALYTICS-01 | Medium | Analytics stores query-bearing paths, referrer data, and pseudonymous session IDs without a retention/deletion procedure. | Confirmed Open | `frontend/src/hooks/useAnalyticsTracking.js`, `frontend/src/services/analyticsService.js`, `backend/src/models/Analytics.js` | Minimize new collection without deleting existing records. Owner must select retention and deletion policy before implementation. |
| OPS-01 | High | Database and media backup restoration, hosted alerts, and monitoring have not been demonstrated. | Confirmed Open | `docs/deployment-guide.md`, `backend/src/routes/index.js` | Rehearse only in a separately named isolated database with synthetic data; select providers, retention, RPO/RTO, and owner first. |
| OPS-02 | Medium | `/api/health` is a database readiness endpoint; no separate liveness route exists. Shutdown closes HTTP but does not explicitly disconnect Mongoose. | Confirmed Open | `backend/src/routes/index.js`, `backend/src/server.js` | Check the selected host's probe and shutdown expectations before deciding whether minimal changes are needed. |
| DEPLOY-01 | High | Real host settings, origins, browser cookie flow, storage persistence, and database connectivity are not verified. | Confirmed Open | `frontend/vercel.json`, `docs/deployment-guide.md`, `docs/production-environment-checklist.md` | Decide host/provider/domains; verify exact HTTPS origins and same-site cookie behavior in real browsers. No deploy performed. |
| CI-01 | Medium | CI runs backend tests and frontend lint, but frontend bundling bypasses the package production validator and SEO generation. | Confirmed Open | `.github/workflows/ci.yml`, `frontend/package.json`, `frontend/scripts/validate-production-env.js`, `frontend/scripts/generate-seo-files.js` | Adjust CI in a later phase using test-only values and isolated output; retain production validation. |
| PERF-01 | Medium | Build emits a 1.98 MB portrait and 4.86 MB DOCX resume. | Confirmed Open | `frontend/src/config/profileAssets.js` | Assess user-facing quality/download needs before optimizing or replacing assets. No asset changed. |
| DOC-01 | Low | README says AI features are not yet built, although AI routes/components exist. | Confirmed Open | `README.md`, `backend/src/routes/index.js`, `frontend/src` | Update wording only after verifying current feature descriptions; not a Phase 0 source change. |
| TEST-01 | Medium | Backend tests pass; frontend has lint but no test/type-check script. Browser E2E and hosted checks are absent. | Confirmed Open | `backend/package.json`, `frontend/package.json`, `.github/workflows/ci.yml` | Preserve current tests; plan browser/hosted checks after provider/domain decisions. |
| DEPS-01 | Medium | Local installed dependency trees resolve, but no vulnerability/advisory scan was run. | Confirmed Open | `backend/package-lock.json`, `frontend/package-lock.json` | Run a dependency advisory scan in a later approved verification phase; no network scan was run in baseline. |
| WEBHOOK-01 | N/A | No webhook route or handler found. | Not Applicable | `backend/src/routes/index.js` | Reassess if a webhook feature is introduced. |

## Phase order

1. **Completed in Phase 1:** AUTH-02 decision, account-wide token revocation, shorter access lifetime, and atomic refresh rotation.
2. Decide the recovery procedure and hosting topology before operations and rate-limit changes.
3. Decide AI provider/billing and backend instance/store topology before Phase 2 abuse-control changes.
4. **Phase 3 inventory completed; CSP remains blocked:** obtain the selected frontend/API/media origins and browser/reporting setup, then test report-only before enforcement.
5. Decide upload storage/access, analytics retention, and privacy-sensitive behavior before Phases 4–5.
6. Verify hosting/environment and rehearse backup recovery in isolation before release.
7. Update CI and rerun full regression/build gates; do not deploy until release decisions and hosted checks are reviewed.

Phase 1 is documented in the latest report section. Remaining decisions include hosting topology, AI provider/billing, storage/public-read policy, analytics retention, production domains/database, and recovery targets.

### Phase 4 — Upload inventory completed; release gate remains open

- Verified upload limits, allowlist/signature checks, auth/RBAC, local write behavior, public serving, and existing isolated upload/storage test results. Signature checks do not decode images; no decoder dependency exists. `UPLOAD-01` remains **Confirmed Open**.
- Before any implementation, decide public-read intent, durable storage provider/topology, and whether GIF animation must be preserved. Then test bounded decoding/re-encoding, storage failure/cleanup, and persistence using disposable data in the selected non-production environment.
- Phase 2 (AI/rate limits) and the isolated recovery/hosted checks remain outstanding. No code or configuration changed in Phase 4.
