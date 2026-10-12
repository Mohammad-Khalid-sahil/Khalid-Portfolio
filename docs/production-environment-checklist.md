# Production environment checklist

Hosting reference: two Vercel projects rooted at `frontend/` and `backend/`; the Render backend section remains an alternative. No projects, real URLs, database, or credentials are selected/configured in this repository. Set values only in the corresponding provider's environment/secret manager. Do not use placeholders as live settings.

## Vercel project settings

| Setting | Value / action |
| --- | --- |
| Root Directory | `frontend` |
| Framework | Vite |
| Node.js build version | 24, matching the repository CI runtime |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| SPA deep links | `frontend/vercel.json` rewrites app routes to `/index.html`; verify direct navigation and refresh after deploy. |

## Vercel backend project

Use Root Directory `backend`; allow Express framework detection; install with `npm ci`; leave build/output overrides unset unless the Vercel project UI requires them. The recognized `src/server.js` default-exports the Express app. Vercel runs it as a Function; do not use `npm start` as a permanent server process in this project. Local development remains `npm run dev`.

For the Vercel backend, configure the common backend variables below, plus `STORAGE_PROVIDER=cloudinary`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN`. Keep `CLOUDINARY_API_SECRET`, `UPSTASH_REDIS_REST_TOKEN`, Mongo URI, and JWT secrets in backend environment settings only. Vercel runtime config rejects missing Cloudinary or shared rate-limit configuration.

## Backend

Render reference settings: Root Directory `backend`; Node.js 24; Build Command `npm ci`; Start Command `npm start`; Health Check Path `/api/health`. Render supplies `PORT`; the app binds `HOST` (default `0.0.0.0`) and the supplied port. Keep Render-only secrets in Render's service environment, never in Vercel.

| Variable | Required or conditional | Operator action |
| --- | --- | --- |
| `NODE_ENV` | Required | Set `production`. |
| `PORT` | Required by host | Let Render supply its assigned port; the app reads it at startup. Do not pin port `5000` on Render. |
| `HOST` | Usually defaulted | Keep `0.0.0.0` unless the host specifies another bind address. |
| `MONGO_URI` | Required | Use the production MongoDB URI. `MONGODB_URI` is accepted as a legacy alias. Keep it backend-only. |
| `JWT_SECRET` | Required | Generate a unique random value, at least 32 characters. |
| `JWT_REFRESH_SECRET` | Required | Generate a different unique random value, at least 32 characters. |
| `JWT_EXPIRES_IN` | Optional; default `15m` | Positive duration of at least one second (`ms`, `s`, `m`, `h`, `d`, `w`, or `y`). Logout revokes account-wide sessions. |
| `JWT_REFRESH_EXPIRES_IN` | Optional; default `30d` | Positive duration of at least one second (`ms`, `s`, `m`, `h`, `d`, `w`, or `y`). Refresh-token expiry and HttpOnly cookie lifetime use this value. |
| `CLIENT_URL` | Required | Exact HTTPS frontend origin, without a path. |
| `ALLOWED_ORIGINS` | Required | Comma-separated exact HTTPS origins, including `CLIENT_URL`; no wildcards or localhost. |
| `STORAGE_PROVIDER` | Required decision | Use `cloudinary` for the Vercel backend; for the Render alternative, use configured S3-compatible storage or a verified persistent disk. Never rely on ephemeral local disk. |
| `LOCAL_STORAGE_DIR` | Local storage | Absolute/mounted persistent volume path. |
| `LOCAL_STORAGE_PERSISTENT` | Local storage | Set `true` only after host persistence is confirmed. |
| `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` | S3 storage | Configure real bucket details and narrowly scoped credentials; public URL must be HTTPS. |
| `S3_ENDPOINT` | Optional S3-compatible provider | Real HTTPS endpoint when required by the chosen provider. |
| `S3_SESSION_TOKEN` | Optional temporary S3 credentials | Secret-store only. |
| `AI_ENABLED` | Optional; defaults to enabled | Set `false` to disable the public AI chat route immediately. |
| `AI_PROVIDER_ENABLED` | Optional; defaults off in production and on in development | Set `true` only after provider billing limits and shared abuse controls are reviewed. Local deterministic responses remain available while provider calls are disabled. |
| `AI_API_KEY` | Optional AI provider | Secret-store only; omit to use local deterministic responses. No provider call is required for deployment. |
| `AI_MODEL` | Optional | Select a supported model only after validating provider availability/cost. |
| `AI_TIMEOUT_MS` | Optional; default 8000 | Integer 1000–60000. |
| `AI_MAX_CONCURRENT` | Optional; default 4 | Per-process concurrent provider calls, 1–100. Not a global spend cap. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Required on Vercel | Shared atomic rate-limit storage for API/auth/contact/AI routes. Vercel serverless configuration rejects missing/incomplete values; store failures fail closed. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Required when `STORAGE_PROVIDER=cloudinary` | Keep in backend settings. Use dynamic folder mode and set the provider/account upload size limit to 5 MiB or less where available. Existing local media is not migrated. |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `CONTACT_RECEIVER_EMAIL` | Optional email delivery | Configure all four or leave all blank. Keep `SMTP_PASS` private. |
| `SMTP_PORT` | Optional email delivery | Use the selected SMTP provider's assigned port. |
| `GITHUB_USERNAME` | Optional fallback | GitHub integration uses the configured profile's valid GitHub URL first, then this value. |
| `GITHUB_TOKEN` | Optional | Secret-store only; public unauthenticated GitHub API may be used without it. |
| `GITHUB_CACHE_TTL_SECONDS` | Optional; default 900 | Set a positive cache duration if the default is unsuitable. |
| `PUBLIC_API_URL` | Optional utility | Exact public API origin for legacy media backfill only; review before running the backfill. |
| `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Only for initial admin creation | Use a unique strong password. Run the seed utility only after checking the target database. |

### MongoDB network access

- If using Atlas, create a dedicated app database user with only the required portfolio database permissions.
- For Vercel, choose supported static egress IPs or private connectivity and allowlist only the selected addresses in Atlas. Vercel documents dynamic addresses; MongoDB's native Vercel integration may add `0.0.0.0/0`. Do not accept that broad rule without explicit owner risk approval. Verify current plan, region, and networking support before configuring.
- For Render, add the service's current outbound IP ranges (or configured private connection) to the Atlas access list. Do not use `0.0.0.0/0`.
- Render shared egress ranges may be broad; use a dedicated outbound IP only if the plan/cost is explicitly selected by the owner. Do not provision one as part of this checklist.

## Frontend build-time values

| Variable | Required | Operator action |
| --- | --- | --- |
| `VITE_API_URL` | Required | Real HTTPS API base URL ending in `/api`. This is public bundle configuration, not a secret. |
| `VITE_SITE_URL` | Required | Real HTTPS frontend origin without a path. This is used to generate absolute SEO URLs. |

Both variables are public build-time values. Configure actual Production origins and real Preview origins for any Preview builds; never add backend secrets under `VITE_` names. A newly added or changed Vercel variable requires a new deployment/build to affect output.

## Release gate

- Confirm the selected frontend, API, MongoDB, email, AI, GitHub, and storage providers and their owners.
- Verify both frontend origins and CORS settings match exactly and use HTTPS.
- Confirm the Vercel project root/build/output settings and test `/admin/login`, an existing project detail, and an existing blog detail by direct load and refresh.
- Confirm Render binds on the supplied `PORT`, passes `/api/health`, and its outbound network is allowed by the database access list.
- Confirm refresh-cookie behavior across the actual frontend/API origins in a browser.
- Confirm database and uploads have independent recovery plans and a verified non-production restore.
- Confirm the CI workflow passes and the production frontend build succeeds with the actual selected origins.
- Configure monitoring, log retention, alerts, access controls, and rollback artifact retention at the chosen host.
- Review provider-side AI budgets/rate limits. `AI_PROVIDER_ENABLED` defaults off in production. The app's per-process request cap and in-memory rate limiter do not enforce a global spend limit across multiple instances; use a shared store/provider control before enabling costly public AI at scale.
- Do not deploy until the unresolved decisions above are satisfied and the release is reviewed.
