# Maintainability Rubric

Grade every check as pass / partial / fail / not-applicable. Every non-pass needs
evidence: a file path and what you found there. This pillar answers: can a new
developer (or a future agent session) change this code safely?

## Checks

### MAINT-1 — Tests exist and cover the core
There is a test suite, and it exercises the project's central logic — not only a
placeholder or a single happy-path test. Fail with no tests at all; partial when
tests exist but whole core areas have none.

### MAINT-2 — README explains the project
A README states what the project is, how to run it, and how to configure it.
Partial if it exists but is a template stub or badly out of date (references
files/commands that no longer exist).

### MAINT-3 — No god files
No source file concentrates a disproportionate share of the codebase's logic
(a single file several times larger than its peers, mixing unrelated concerns:
routes + business logic + persistence + helpers). Cite the file and its size.

### MAINT-4 — No significant dead code
No large commented-out blocks, unused modules, obviously abandoned
copies (`utils_old.py`, `component.backup.tsx`, `final_v2`). Scattered small
instances are partial; whole dead subsystems are a fail.

### MAINT-5 — No copy-paste duplication of logic
The same non-trivial logic (validation rules, calculations, request handling)
does not appear pasted in multiple places where a change would have to be made
N times. Cite at least two of the copies.

### MAINT-6 — Consistent structure and naming
The project follows one discernible convention for layout and naming. Mixed
paradigms without rationale (half the handlers in one style, half in another;
same concept named three ways) is a partial; no discernible structure is a fail.

### MAINT-7 — Dependencies are declared, used, and pruned
Everything imported is declared in the manifest; the manifest doesn't carry
obviously unused heavyweight dependencies. Partial for a few strays.

### MAINT-8 — Errors are handled, not swallowed
No bare `except:`/empty `catch` blocks that silence failures, and errors carry
enough context to debug. Swallowed exceptions on important paths are a fail.

### MAINT-9 — Magic values are named
Business-meaningful numbers and strings (limits, fee percentages, status codes,
retry counts) live in named constants or configuration, not inline literals
repeated through the code.

### MAINT-10 — Lint/format tooling is configured
Some automated style/quality gate exists (linter or formatter config, type
checking where the language supports it). Its absence in a multi-contributor or
AI-generated codebase means drift is unchecked.
