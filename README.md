# Premium Portfolio — Full-Stack Project

A full-stack developer portfolio: React + Tailwind (frontend) and Node.js + Express + MongoDB (backend).

## 🎨 Design identity
"Terminal / Code Editor" theme — dark ink background, JetBrains Mono / Space Grotesk / Inter typography,
cyan + amber accents, an interactive typing-terminal Hero, and a Ctrl+K command palette.

## 📁 Structure
```
portfolio/
├── frontend/   React + Vite + Tailwind v4 + Framer Motion + GSAP
└── backend/    Node.js + Express + MongoDB (Mongoose)
```

## 🚀 Getting started

### 1. Backend
```bash
cd backend
cp .env.example .env      # edit MONGO_URI, JWT secrets, SMTP, etc.
npm ci
npm run seed               # optional: creates an admin user; portfolio content is managed in Admin
npm run dev                 # starts on http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
cp .env.example .env       # VITE_API_URL should point at the backend
npm ci
npm run dev                 # starts on http://localhost:5173
```

## 🖼️ Media Library (Phase 7)
- New authenticated Admin **Media Library** (`/admin/media`): upload, search by filename, filter by type (image/document), preview, and delete — reusing the exact same secure multer pipeline built in Phase 4 (whitelisted MIME types + extensions, 5MB limit, randomized safe filenames). No second upload system was built.
- New `Media` model tracks every upload (filename, original name, URL, MIME type, size, category, who uploaded it, when). The pre-existing `/api/projects/upload` endpoint (used by Projects, Certifications, Profile avatar, and Resume) now also logs to this model automatically, so files uploaded from *any* existing form appear in the Library — with zero duplicated upload code.
- **Blog cover** images can now be uploaded directly in the admin (previously a raw URL text field) using the same `ImageUploadField` component already used elsewhere.
- **Legacy files (Phase 4-6 uploads)**: run `npm run backfill-media` once to scan the existing `uploads/` folder and create Media records for anything uploaded before the Library existed, so they show up too — without touching or re-uploading the files themselves. Set `PUBLIC_API_URL` in `.env` first if your backend's public origin differs from `http://localhost:PORT`, so reconstructed URLs match what Projects/Certifications/etc. already have stored.
- **Reference-aware deletion**: before removing a file, the admin sees exactly which Projects, Certifications, Profile fields, or Blog posts currently use it (`GET /api/media/:id/usage`). Deleting a file automatically clears it from all of those places (thumbnail/gallery/image/avatar/resumeUrl/cover set to empty) so nothing is left pointing at a broken link — instead of just deleting the file and hoping nothing referenced it.
- Deleting a file removes both the database record and the file on disk; the on-disk path is built only from the server-stored filename (never user input), so path traversal isn't possible even in principle.
- Endpoints: `GET/POST /api/media`, `GET /api/media/:id/usage`, `DELETE /api/media/:id` (all admin/editor only).

## 📄 Resume, Contact & Profile/About (Phase 6)
- **Profile/About**: added `specialization`, `careerGoals`, `interests`, and `languages` to the Profile model — `interests` was previously hardcoded in `constants/siteData.js` and is now fully admin-managed. The About page now shows a real `avatar` image instead of a placeholder.
- **Resume**: added a **Languages** section (from the new Profile field), a **View PDF** toggle that embeds the resume inline via `<iframe>`, and the Download button now uses the `download` attribute to force an actual download. Resume/CV upload is now a real file upload (PDF) in the admin, reusing the exact same upload endpoint built for Projects/Certifications — no second upload system.
- **Contact**: added a persistent inline success banner alongside the existing toast. Verified the previously-fixed HTML-escaping and message-not-found handling are both still intact. Reply-via-email (`mailto:`) in the admin inbox was already implemented and is unchanged.
- Fixed a validation bug found during testing: a Profile `languages` entry with a missing `name` was incorrectly accepted — `name` is now properly required per entry.

## 🧩 Skills, Services, Experience, Education & Certifications (Phase 5)
- **Skills**: now support `relatedProjects` — link a skill to the projects that used it (via a checkbox multi-select fed by the existing `/projects` endpoint, no new relation system). Shown as clickable chips on the public Skills page.
- **Services**: added `technologies`, a per-card `ctaText` button (links to Contact), and `featured` (shown as a badge).
- **Experience**: added `description` and an explicit `isCurrent` flag so "Present" no longer depends only on an empty end date.
- **Education**: added `description`.
- **Certifications**: the `image` field existed in the model but was missing from both the admin form and the public page — fixed on both ends. Reuses the **same** upload mechanism built for Projects in Phase 4 (no second media system).

## 🚀 Projects & Case Studies (Phase 4)
- **Real image uploads**: project thumbnail and gallery/screenshots are uploaded via a hardened endpoint (`POST /api/projects/upload`, admin/editor only, whitelisted file types, 5MB limit, randomized filenames) instead of pasting raw URLs. Manual URL entry still works as a fallback.
- **Full case study page**: Overview, Key Features, Screenshots gallery, Video Demo (auto-embeds YouTube/Vimeo), Architecture, Challenges, Solutions, Security, Performance, Results, Lessons Learned, Documentation link, and a **Related Projects** section (same category, computed automatically — no manual curation needed).
- Admin project form now exposes every model field, including `documentation`, `architecture`, `security`, `performance`, and `lessonsLearned`, which were previously missing from the UI.

## 🔐 Admin Panel
- URL: `http://localhost:5173/admin/login`
- Initial credentials must be supplied through `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `backend/.env`; the seed utility has no default account or password and rejects placeholder passwords.
- Manage: Projects, Skills, Services, Experience, Education, Certifications, Testimonials, Blog Posts (+ Categories/Tags), Contact Messages, Profile & Site Settings — all without touching code.
- JWT-based auth with automatic access-token refresh via an httpOnly cookie.

## ✅ What's built so far

**Frontend (public site) — connected to the live API**
- Home, About, Skills, **Services**, Projects (+ case-study detail page), **Experience, Education, Certifications** (now separate pages), **Testimonials** (dedicated page + Home carousel), **Resume** (online resume + PDF download), Blog **(list + full post detail page)**, Contact (working form → backend)
- All content-bearing pages now fetch from the backend via React Query (`@tanstack/react-query`) instead of static data — with loading skeletons and retry-able error states everywhere
- Dark/light theme, language switcher scaffold (en/fa/ps with RTL), Ctrl+K command palette (updated with all new routes)
- Animated hero terminal, animated stat counters, GSAP scroll-triggered skill bars, project hover interactions

**Admin Panel (`/admin`) — full content management, no code changes needed**
- Login with JWT (access + refresh tokens, auto-refresh on expiry)
- Dashboard overview: page views, project/message counts, top pages, recent messages
- Generic CRUD manager (table + dynamic form + delete confirm) reused across Projects, Skills, Services, Experience, Education, Certifications, Testimonials, Blog Categories & Tags
- Dedicated Blog Post editor (category/tag selection, publish toggle)
- Messages inbox (read/unread, reply via email, delete)
- Profile & Site Settings editor (bio, social links, stats, SEO defaults, maintenance mode)

**Backend (REST API)**
- Models: User, Profile, Project, Skill, Service, Experience, Education, Certification, Testimonial,
  Category, Tag, BlogPost, Message, Analytics, Settings
- Full CRUD routes for all content types, JWT auth (access + refresh tokens), contact form with
  honeypot spam-protection + email notifications, GitHub integration, rate limiting, input validation,
  security middleware (helmet, custom Express-5-safe NoSQL-injection sanitizer, CORS)
- Verified with live HTTP smoke tests (health check, 404 handling, validation errors) — all passing
- `npm run seed` creates the configured admin account only. It does not create or overwrite portfolio CMS content.

## 📱 PWA + production readiness
- Frontend now ships with a web app manifest, installability metadata, offline fallback page, and a secure service worker that caches only public static assets and never caches `/api/*` admin/auth data.
- Production deployment checklist:
  - Frontend: set `VITE_API_URL` and `VITE_SITE_URL` in `frontend/.env` or `frontend/.env.production`
  - Backend: set `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL`, `ALLOWED_ORIGINS`, and `NODE_ENV=production` in `backend/.env` or `backend/.env.production`
  - CORS: the backend accepts the configured origin list and credentials are preserved for authenticated admin routes
  - Health: `GET /api/health` is available for uptime checks
  - HTTPS: production domains should use `https://` for the frontend and backend URL config
  - Build/start: `cd frontend && npm run build` and `cd backend && npm run start`
- No extra hosting provider is forced; the stack remains Vite + Express + MongoDB and works with any Node/Mongo deployment environment that supports HTTPS, environment vars, and a reverse proxy.

## 🔜 Next phases (not yet built)
- AI assistant features, deeper analytics dashboards, and additional automation


## 🧰 Tech stack
React · Vite · Tailwind CSS v4 · Framer Motion · GSAP · React Router · Zustand · React Hook Form ·
Node.js · Express · MongoDB · Mongoose · JWT · Nodemailer

## 🔐 Production security and environment

For production deployments, configure the backend in `backend/.env` or `backend/.env.production` with the variables already used by the app:

- `NODE_ENV=production`
- `PORT=5000`
- `MONGO_URI` — MongoDB connection string (do not use a localhost/dev URI in production)
- `JWT_SECRET` and `JWT_REFRESH_SECRET` — each must be unique, at least 32 characters, and not use placeholder/default values
- `CLIENT_URL` — exact production frontend origin, including `https://`
- `ALLOWED_ORIGINS` — comma-separated, explicit list of approved frontend origins
- `PUBLIC_API_URL` — backend public base URL for generated media links if needed
- `GITHUB_USERNAME` / `GITHUB_TOKEN` — optional GitHub integration credentials, kept server-side only
- `AI_API_KEY` — optional AI provider key, kept server-side only and never exposed to the browser
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `CONTACT_RECEIVER_EMAIL` — required only when contact email delivery is enabled in production

CORS is configured to reject any origin outside the explicitly whitelisted list. In production, `*` and localhost origins are not accepted. The refresh cookie is `httpOnly`, `secure`, and `SameSite=None` for cross-origin frontend/API deployments, while local development continues to use the safer local defaults.

Backend startup validates production secrets and required config at boot. If a required production value is missing, insecure, or flagged as a default placeholder, the server exits immediately instead of running with a weak setup.

Health check:

```bash
curl -i http://localhost:5000/api/health
```

The frontend build should use `VITE_API_URL` and `VITE_SITE_URL` in `frontend/.env.production` to match the deployed backend and site origin.

For hosting configuration and the production environment checklist, see
[`docs/deployment-guide.md`](docs/deployment-guide.md) and
[`docs/production-environment-checklist.md`](docs/production-environment-checklist.md).
