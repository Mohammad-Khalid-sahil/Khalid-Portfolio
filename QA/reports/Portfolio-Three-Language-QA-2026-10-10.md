# Portfolio Website — Three-Language Compatibility and Quality Report

**Test date:** 10 October 2026, 14:06 Asia/Kabul  
**Status:** Partial; browser verification blocked

## Executive summary

The frontend and backend were already running at `http://127.0.0.1:5173/` and `http://127.0.0.1:5000/`. The backend connected to its configured MongoDB database (`127.0.0.1/portfolio`), and its health and public content endpoints responded successfully. The Vite production compilation succeeded. All 902 effective translation keys were present for each locale, with no missing or extra keys and no hits in the configured mojibake-marker scan.

This was not a full browser QA pass. No browser automation tool is installed or exposed in this environment, and the browser debugging session did not provide inspectable page output. Consequently, the report does not claim that language switching, persisted preferences, visual layout, responsive sizes, or page rendering were browser-verified.

## Scope and test environment

- Languages: English (`en`), Dari (`fa`), and Pashto (`ps`).
- Frontend: Vite development server on `127.0.0.1:5173`.
- Backend: Express development server on port `5000`.
- Database: backend startup reported a successful connection to `127.0.0.1/portfolio`; read-only API checks succeeded.
- Production environment files were not changed. No seed scripts, migrations, form submissions, or database writes were run.
- No screenshot was captured. No passwords, tokens, or private environment values are included.

## Routes and service checks

The 17 tested frontend URLs all returned HTTP 200 with the SPA shell (`index.html`): `/`, `/about`, `/skills`, `/services`, `/projects`, `/projects/demo`, `/experience`, `/education`, `/certifications`, `/testimonials`, `/resume`, `/blog`, `/blog/demo`, `/contact`, `/assistant`, `/admin/login`, and `/admin/resource/certifications`.

This verifies server fallback and shell delivery only. It does not verify that React rendered each route. In particular, the admin resource route is protected, and no authenticated browser session was tested.

Read-only API requests to `/api/health`, `/api/profile`, `/api/projects`, `/api/skills`, `/api/services`, `/api/experiences`, `/api/education`, `/api/certifications`, `/api/testimonials`, and `/api/blog` each returned HTTP 200 with `success: true`.

The implemented public routes also include `/projects/:slug` and `/blog/:slug`; the concrete `/projects/demo` and `/blog/demo` checks above verify the SPA shell, not that those slugs exist in the database.

## Locale data checks

| Locale | Effective keys | Missing / extra | Direction configuration | Status |
|---|---:|---:|---|---|
| English (`en`) | 902 | 0 / 0 | LTR | Data check passed; browser rendering not tested |
| Dari (`fa`) | 902 | 0 / 0 | RTL | Data check passed; browser rendering and language quality review not tested |
| Pashto (`ps`) | 902 | 0 / 0 | RTL | Data check passed; browser rendering and language quality review not tested |

The effective i18next bundle was loaded and compared by nested key. A scan for the configured mojibake markers and replacement characters found zero candidate strings in the three bundles. This is a pattern scan, not proof of linguistic correctness or absence of mixed-language phrasing. No native-language review was performed.

Data-level lookups returned translated `nav.home` and `common.responsibilities` values in all three locales. English maps to LTR, while Dari and Pashto map to RTL in the project’s locale configuration. Actual document `lang`/`dir` attributes, selector interaction, refresh persistence, immediate UI updates, and text layout were **not tested in a browser**. The checked responsibility label is `common.responsibilities`; source usage does not contain the previously reported `components.responsibilities` key.

## Pages, interactions, and responsive testing

| Area | Result |
|---|---|
| Page component rendering in all three languages | **Blocked** — browser automation unavailable |
| Navbar, selector, footer, menus, links | **Not tested** in browser |
| Theme switching, search, filters, project/blog navigation | **Not tested** in browser |
| Contact form validation/submission | **Not tested**; no submission was made |
| CV download/preview | **Not tested** |
| AI Assistant UI/provider response | **Not tested** in browser; selected backend API/unit tests passed (see below) |
| Loading, empty, and error UI states | **Not tested** in browser |
| Desktop 1440×900, tablet 768×1024, mobile 390×844 | **Blocked** — no browser screenshots or visual measurements |

## Defect and fix record

**Previously reported admin blank-screen crash — code fix present, browser retest blocked.** The supplied console error identified `ReferenceError: emptyMessage is not defined` in `DataTable`. The component now accepts the `emptyMessage` prop that `ResourceManager` already supplies, preserving the existing translated fallback when the prop is absent. The issue was confirmed from the supplied runtime error and source, and the frontend bundle compiled afterward. This report does not claim that the Certifications screen was retested interactively.

No additional localization defect was confirmed in a rendered browser, so no further project changes were made for this QA pass.

## Build, lint, and automated tests

- Direct Vite production compilation to a temporary directory: **Passed**; 692 modules transformed.
- Standard `npm run build`: **Blocked** by the production environment validation because required `VITE_API_URL`/`VITE_SITE_URL` configuration is unavailable in this environment. No `.env` files were altered.
- Frontend lint: **Passed with 18 warnings**, no lint errors. Warnings include existing hook/state-effect, Fast Refresh export, static component, and unused catch-parameter findings.
- Safe backend tests: **27 passed, 0 failed** across AI provider behavior, AI response behavior, API validation/access control, authentication, and CMS localization. Those selected suites use stubs/in-memory test objects.
- Full backend suite: **Not run**. Several test files call `deleteMany()` and `dropDatabase()` against MongoDB, which is connected to the configured project database; running them would risk deleting project data.
- `node --check` on `frontend/src/i18n.js` and `frontend/src/services/api.js`: **Passed**. JSX compilation was covered by Vite; Node’s direct `--check` does not accept `.jsx` files.

## Final status by language

- **English:** translation bundle completeness and marker scan passed. Browser/UI status is unverified.
- **Dari:** translation bundle completeness and marker scan passed; direction is configured RTL. Browser/UI rendering and native-language accuracy are unverified.
- **Pashto:** translation bundle completeness and marker scan passed; direction is configured RTL. Browser/UI rendering and native-language accuracy are unverified.

## Remaining risks and next verification step

The requested real-browser route-by-language matrix, persistence checks, console/network review, RTL visual inspection, and responsive screenshots remain unverified because browser automation is unavailable here. Re-run those checks in an instrumented browser (for example, a local Playwright installation or a manually opened browser with DevTools access), including a signed-in test account for protected admin routes. Configure the required production API/site URLs before running the repository’s full production build. Have Dari and Pashto reviewed by qualified speakers before declaring translation quality verified.
