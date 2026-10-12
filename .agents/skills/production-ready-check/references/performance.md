# Performance Rubric

Grade every check as pass / partial / fail / not-applicable. Every non-pass needs
evidence: a file path and what you found there. Grade against the project's actual
shape — a static site has few applicable checks here, and that is fine.

## Checks

### PERF-1 — No N+1 query patterns
Look for database or API calls inside loops over collections (a query per item of
a list fetched by an outer query; an HTTP call per row). ORMs make this easy to
spot: iteration over a relation without eager loading / `select_related` /
`includes`. Fail when a hot path does it; partial for isolated occurrences.

### PERF-2 — Queries are bounded
List endpoints and bulk reads use pagination, limits, or streaming. A
`SELECT`/`find()`/`scan` with no limit feeding an HTTP response is a fail — it
works in the demo and dies at 100k rows.

### PERF-3 — No blocking work on async or request paths
In async frameworks: no synchronous I/O (blocking HTTP clients, `time.sleep`,
blocking file/DB drivers) inside `async` handlers. In any web app: no obviously
long-running work (report generation, media processing, bulk email) executed
inline in the request instead of a background job.

### PERF-4 — Indexes support the query patterns
Where migrations or schema definitions exist: columns used in lookups, foreign
keys, and frequent filters have indexes. Partial if some obvious ones are missing;
not-applicable without a database.

### PERF-5 — Connection reuse
Database connections, HTTP clients, and similar expensive resources are pooled or
reused, not created per request/call (e.g. a new client instantiated inside a
handler on every invocation).

### PERF-6 — No obviously quadratic hot paths
Nested loops over the same large collection, membership tests against lists inside
loops, repeated full-file re-reads or re-parses inside iterations. Only fail when
the data involved can plausibly grow.

### PERF-7 — Payloads and assets are reasonable
APIs don't return entire objects when a fraction is used (no field selection
anywhere); frontends don't ship multi-megabyte unoptimised images or bundles with
no build-time optimisation. Partial for scattered cases.

### PERF-8 — Caching where it obviously pays
Repeatedly computed or fetched values that change rarely (config lookups, per-user
permissions resolved on every call, external catalogue data) have some caching
layer. Grade leniently: fail only when the absence is clearly costly and the fix
is standard.

### PERF-9 — Timeouts on outbound calls
HTTP/database/queue calls to other systems specify timeouts (and ideally retries
with backoff). A default-timeout-infinity client on a request path means one slow
dependency stalls the whole service.
