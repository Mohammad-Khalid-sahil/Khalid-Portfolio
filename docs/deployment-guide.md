# Deployment guide: Vercel frontend and backend

This repository contains a Vite SPA in `frontend/` and an Express/Mongoose API in `backend/`. Deploy them as separate Vercel projects rooted at their respective directories. A Render backend reference remains below as an alternative only. No project is linked, configured, provisioned, or deployed by this guide. Replace every `<...>` value with a real value you select; placeholders are not build inputs.

## Vercel frontend

Create a Vercel project connected to this repository with:

| Setting | Value |
| --- | --- |
| Root Directory | `frontend` |
| Framework Preset | Vite |
| Node.js version | 24, matching `.github/workflows/ci.yml` |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

The checked-in [`frontend/vercel.json`](../frontend/vercel.json) rewrites SPA deep links to `index.html`, following Vercel's Vite guidance. The existing `frontend/public/_redirects` file is not Vercel's routing configuration. Verify direct navigation and refresh on `/admin/login`, `/projects/<existing-slug>`, and `/blog/<existing-slug>` after the first deployment. Do not treat a Vercel 404 as an API error.

Set these build-time variables in Vercel Project Settings for each environment that you build:

| Variable | Value to supply | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `https://<your-backend-api-origin>/api` | Public API base URL compiled into frontend requests; replace with the actual backend origin. |
| `VITE_SITE_URL` | `https://<your-vercel-site-origin>` | Public site origin used by canonical metadata, sitemap, and robots output. |

Use the actual assigned production origin for Production. For Preview builds, provide the real preview origin used for that deployment (a stable preview domain or branch-specific environment value); the production validator intentionally rejects missing, localhost, and reserved example origins. Add the selected frontend origin(s) to the backend `ALLOWED_ORIGINS` list. Vite exposes `VITE_` values in the browser bundle, so never put database URIs, JWT secrets, AI keys, SMTP credentials, or storage credentials in Vercel's frontend variables. Vercel's Vite guide documents the SPA rewrite and build-time environment behavior: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Vercel environment variables](https://vercel.com/docs/environment-variables).

The client API service sends requests directly to `VITE_API_URL` and includes credentials for the httpOnly refresh cookie. It does not depend on a same-origin `/api` proxy. The backend must allow the exact browser origin and credentials. For reliable admin refresh-cookie behavior, use custom frontend and API domains under the same registrable site (for example, `portfolio.<your-domain>` and `api.<your-domain>`). Default Vercel and Render hostnames are cross-site; browsers and privacy settings can block third-party cookies even when they are `SameSite=None; Secure`. Verify login, refresh, logout, public reads, contact submission, and uploaded-media retrieval in browsers with third-party cookies blocked before launch. See [MDN's third-party cookie guide](https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/Third-party_cookies).

The frontend has no Cloudinary environment variables. Admin media uploads request a short-lived authorization from the backend and send the file directly to the provider; Cloudinary credentials, including `CLOUDINARY_API_SECRET`, belong only in the backend environment. `VITE_*` values are compiled into public browser assets and must never contain secrets.

## Vercel backend

Create a separate Vercel project connected to this repository with Root Directory `backend`. Vercel's Express integration recognizes `backend/src/server.js`, which default-exports the Express app without starting a permanent listener. Use `npm ci`; leave framework detection/build/output overrides at their Express defaults unless Vercel's project UI requests otherwise. Keep local development on `npm run dev` (`src/start.js`). Vercel documents the recognized Express entrypoint and function model [here](https://vercel.com/docs/frameworks/backend/express).

Configure backend-only variables in the backend Vercel project's environment settings:

- Required: `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL`, `ALLOWED_ORIGINS`, `STORAGE_PROVIDER=cloudinary`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN`.
- Optional integrations: `AI_ENABLED`, `AI_PROVIDER_ENABLED`, `AI_API_KEY`, `AI_MODEL`, `AI_TIMEOUT_MS`, `AI_MAX_CONCURRENT`, SMTP names, and GitHub names described below. Keep `AI_PROVIDER_ENABLED` false until actual provider account spend limits and monitoring are configured; shared request limits do not provide a hard global spend cap.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` configure atomic shared limits for API, auth, contact, and AI routes. Rate-limit store failures reject requests rather than falling back to per-instance memory. Create/configure the service outside this code task and test its availability before production.

For Atlas, use a least-privilege database user and place the URI only in `MONGO_URI`. Vercel uses dynamic egress unless static egress/private networking is configured. MongoDB's Vercel native integration documents adding `0.0.0.0/0`; do not choose that broad network rule by default. Select a supported Vercel static egress/private-network path and add only those addresses to Atlas, or explicitly assess and approve the broader exposure before using the integration. Verify current plan, region, and connection compatibility with the providers ([Vercel static IPs](https://vercel.com/kb/guide/can-i-get-a-fixed-ip-address), [MongoDB's Vercel integration](https://www.mongodb.com/docs/atlas/reference/partner-integrations/vercel/)).

Cloudinary requires dynamic folder mode for signed `asset_folder` placement under `portfolio/media` and `portfolio/project`; set the provider's maximum upload size to 5 MiB or less where available. No existing local media is migrated by this setup. Vercel's Express runtime does not serve `express.static()` uploads, so the existing 68 `/uploads/...` files need an approved serving/migration plan before legacy media is complete on Vercel. The report-only frontend CSP and credentialed cookies still require browser checks against the real origins.

## Render backend reference

Create a Render **Web Service** for the same repository with:

| Setting | Value |
| --- | --- |
| Root Directory | `backend` |
| Runtime | Node.js 24 |
| Build Command | `npm ci` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

The app binds to `HOST` (default `0.0.0.0`) and `PORT` (default `5000`); Render supplies its assigned `PORT`, which the app reads at startup. Do not pin the service to port 5000. Startup waits for MongoDB before accepting traffic. `/api/health` returns 200 only when Mongoose reports a connected database, otherwise 503. The server handles `SIGTERM` and `SIGINT` by closing the HTTP listener; graceful termination under the chosen Render plan still needs a live service check. See [Render's Node/Express guide](https://render.com/docs/deploy-node-express-app) and [web service requirements](https://render.com/docs/web-services).

Set backend values in Render's environment/secret manager only:

- Required: `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL`, `ALLOWED_ORIGINS`.
- Choose storage before launch. The recommended multi-instance/redeploy-safe choice is `STORAGE_PROVIDER=s3` with `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL`, and `S3_ENDPOINT` only for an S3-compatible endpoint. `S3_SESSION_TOKEN` is optional. Use a narrowly scoped service credential for required object operations. Since the API returns public media URLs, configure the bucket/CDN to serve only the intended portfolio media objects over HTTPS; the app does not generate signed read URLs.
- For local uploads instead, mount a Render persistent disk at the actual absolute path used by the service and set `STORAGE_PROVIDER=local`, `LOCAL_STORAGE_DIR` to that mount, and `LOCAL_STORAGE_PERSISTENT=true` only after confirming the mount path survives restarts. Render's default service filesystem is ephemeral; attached disks persist data but affect deployment behavior and instance scaling. See [Render persistent disks](https://render.com/docs/disks) and [deployment behavior](https://render.com/docs/deploys).
- Optional integrations: `AI_ENABLED`, `AI_PROVIDER_ENABLED`, `AI_API_KEY`, `AI_MODEL`, `AI_TIMEOUT_MS`, `AI_MAX_CONCURRENT`; `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `CONTACT_RECEIVER_EMAIL`; `GITHUB_USERNAME`, `GITHUB_TOKEN`, `GITHUB_CACHE_TTL_SECONDS`. Third-party AI provider calls default off in production and require `AI_PROVIDER_ENABLED=true`; enable only after provider-side spending controls and monitoring are configured. App rate limits remain per process, not a global cost ceiling.
- `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, and `SEED_ADMIN_PASSWORD` are needed only when intentionally creating/resetting an admin. Do not run seed/reset commands until you have confirmed the service points to the intended database.

`CLIENT_URL` must be the exact Vercel production origin (or its selected custom frontend domain). `ALLOWED_ORIGINS` is a comma-separated list of exact origins, including `CLIENT_URL`; add only preview origins that require API access. Production validation rejects non-HTTPS origins and localhost. Do not set `PUBLIC_API_URL` except when an operator-reviewed media backfill specifically needs it.

## MongoDB connectivity

Atlas is compatible with the current standard Mongoose `MONGO_URI` connection. If using Atlas:

1. Create a dedicated database user for this app with only the required access to the portfolio database; keep the Atlas human/project owner identity separate from application credentials.
2. Store the connection string only as Render's `MONGO_URI`. Encode reserved characters in the username/password as MongoDB requires and never commit the resulting URI.
3. Restrict Atlas network access to the Render service's outbound IP ranges shown for its region, or use an available private network path. Avoid `0.0.0.0/0`. Render's shared outbound ranges may be broader than one service; fixed dedicated outbound IPs are a separate plan/cost decision and are not assumed here. MongoDB documents project IP access lists and trusted CIDRs: [Atlas IP access list](https://www.mongodb.com/docs/atlas/security/add-ip-address-to-list/), [Render outbound addresses](https://render.com/docs/outbound-ip-addresses).
4. Confirm TLS connectivity, database name, and permissions using the deployed health endpoint and application logs without printing the URI. Do not run seed, reset, backfill, migrations, or destructive tests against the production database.

## Build and verification commands

Run these from the package directory. Configure real origins in the selected host's environment before a production frontend build:

```powershell
Set-Location frontend
npm ci
$env:VITE_API_URL = 'https://<your-backend-api-origin>/api'
$env:VITE_SITE_URL = 'https://<your-vercel-site-origin>'
npm run lint
npm run build
```

```powershell
Set-Location backend
npm ci
npm ls --depth=0
npm test
```

Use a disposable MongoDB for database-writing tests. Do not copy production credentials into a local shell or test environment. The current workflow in `.github/workflows/ci.yml` uses a disposable MongoDB service and test-only hostnames for bundling; that does not replace the real-origin production build or hosted CI verification.

## Backup, rollback, and recovery

Before launch, enable encrypted MongoDB backups/snapshots, set retention and access policies, and verify a restore into a separately named non-production database. Keep backup files and connection secrets outside the repository. For object storage, enable versioning or an equivalent recovery mechanism and verify recovery separately. Do not test restore against live data.

For a bad release, redeploy the last known-good Vercel build and Render release. Confirm `/api/health`, direct SPA routes, public API reads, admin login/refresh/logout, contact behavior, and media retrieval. A code rollback does not restore CMS data or uploaded files; recover those only from a separately verified backup and approved recovery procedure. The recent admin-credential fix adds no schema migration.

## Pre-launch checks still owned by the operator

- Supply real Vercel and Render origins, production secrets, MongoDB access, chosen object-storage credentials/policy, and any optional integration credentials.
- Choose frontend/API custom domains under the same registrable site for reliable refresh-cookie behavior, or accept and explicitly test the third-party cookie limitations of provider default domains.
- Confirm Vercel's Production and Preview environment settings and verify Vercel's deployed SPA rewrite behavior.
- Confirm Render's actual outbound ranges and configure Atlas access narrowly; configure alerts, sanitized logs, backup schedules, and recovery ownership.
- Configure provider-side AI spending and abuse controls. The application has emergency disablement and per-process request bounds, but no global spending cap.
- Review the production readiness report and checklist. This document prepares deployment settings only; no deployment has been performed.
