# Security Rubric

Grade every check as pass / partial / fail / not-applicable. Every non-pass needs
evidence: a file path and what you found there. Remember the ground rule: note that
a secrets file exists, never print its contents.

## Checks

### SEC-1 — No hardcoded secrets
Search source files for API keys, tokens, passwords, connection strings, and
private keys embedded as literals (`api_key = "sk-…"`, `password=`, `AKIA…`,
`-----BEGIN … PRIVATE KEY-----`, JDBC/postgres URLs with credentials). Test
fixtures with obviously fake values may pass; real-looking credentials anywhere
are a fail.

### SEC-2 — Secrets files not committed
`.env`, `*.pem`, `credentials.json`, and similar must be ignored by version
control. Fail if such a file is tracked in git; partial if there is no `.gitignore`
entry for them even though none is currently committed.

### SEC-3 — Input validation at trust boundaries
Every place where external data enters (HTTP handlers, CLI args, file uploads,
message consumers) validates or safely parses its input (schema validation,
typed frameworks like Pydantic/zod, explicit checks). Fail if handlers pass raw
request data straight into logic or storage.

### SEC-4 — No injection-prone constructs
Look for SQL built by string concatenation/interpolation, shell commands composed
from user input (`os.system`, `exec`, `subprocess` with `shell=True`), unsafe
deserialisation (`pickle.loads`, `yaml.load` without SafeLoader, `eval`), and
HTML rendered from unescaped input. Any occurrence reachable from external input
is a fail.

### SEC-5 — Authentication and authorization on protected surfaces
If the project exposes endpoints or pages that act on user data, they must be
behind some auth mechanism, and sensitive operations must check *authorization*
(who may do this), not only authentication (who you are). Fail for unprotected
mutating endpoints; not-applicable for projects with no protected surface.

### SEC-6 — No permissive CORS or wildcard origins
`Access-Control-Allow-Origin: *` (or framework equivalents like
`allow_origins=["*"]`) combined with credentials, or blanket-permissive CORS on an
API that handles user data, is a fail. Not-applicable if nothing serves HTTP.

### SEC-7 — Dependency manifests are current and lockfiles exist
Check manifests for clearly abandoned or notoriously vulnerable major versions
(you know many: e.g. ancient Django/Flask/Express/log4j lines), and for the
presence of a lockfile where the ecosystem uses one. Partial if versions are
merely old; fail for known-vulnerable pins. Do not fetch advisories — grade only
from what you know.

### SEC-8 — Sensitive data kept out of logs
Log statements should not print passwords, tokens, session IDs, or full personal
records. Fail if handlers or middleware log raw request bodies/headers on paths
that carry credentials.

### SEC-9 — Debug and development modes off by default
`DEBUG = True`, stack traces returned to clients, exposed admin/debug endpoints,
or verbose error pages configured as the default is a fail. Pass if debug is
opt-in via environment.

### SEC-10 — Sane cryptography
No home-rolled crypto, no MD5/SHA1 for passwords, no static IVs/salts, no
`verify=False`/TLS verification disabled. Not-applicable if the project does no
crypto at all.
