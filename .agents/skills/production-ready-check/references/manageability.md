# Manageability Rubric

Grade every check as pass / partial / fail / not-applicable. Every non-pass needs
evidence: a file path and what you found there. This pillar answers: once this is
deployed, can anyone operate it — configure it, observe it, deploy it again, and
tell when it is broken?

## Checks

### MGMT-1 — Configuration comes from the environment
Environment-specific values (URLs, hosts, ports, feature flags, credentials
references) are read from environment variables or config files, not hardcoded.
A hardcoded `localhost` or a production hostname in source is evidence.

### MGMT-2 — An example configuration is provided
A `.env.example`, sample config, or documented variable list tells an operator
what must be set. Without it, deployment is archaeology.

### MGMT-3 — Structured, levelled logging
The project logs through a logging framework with levels — not `print` /
`console.log` scattered as the only visibility. Partial when both coexist; fail
when there is effectively no logging on the paths that matter.

### MGMT-4 — Health/readiness signal
Services expose a health endpoint or equivalent liveness signal that a load
balancer or orchestrator can probe. Not-applicable for CLIs and libraries.

### MGMT-5 — Reproducible build/run path
There is a defined way to build and run the thing (Dockerfile, compose file,
Procfile, Makefile, documented scripts in the manifest). "Works on the author's
machine" — no build definition at all — is a fail.

### MGMT-6 — CI runs the tests
A CI definition (GitHub Actions, Bitbucket Pipelines, GitLab CI, …) builds the
project and runs its tests. Partial if CI exists but skips the test suite.

### MGMT-7 — Dependency versions are pinned or locked
Builds are reproducible: a lockfile, or pinned versions in the manifest.
Floating latest-version dependencies mean the next deploy may ship different
code than the last.

### MGMT-8 — Database changes are managed
Schema changes go through migrations (Alembic, Prisma, Flyway, Rails
migrations, …), not hand-applied SQL implied by the code. Not-applicable without
a database.

### MGMT-9 — Errors are observable in production
Unhandled errors end up somewhere an operator will see them: error middleware
that logs, an error-tracking hook, or at minimum consistent exception logging.
A stack trace printed to a console nobody reads does not count as observability.
