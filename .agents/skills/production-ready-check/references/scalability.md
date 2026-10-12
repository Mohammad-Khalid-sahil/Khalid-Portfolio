# Scalability Rubric

Grade every check as pass / partial / fail / not-applicable. Every non-pass needs
evidence: a file path and what you found there. This pillar answers: what happens
when there are ten times more users, requests, or rows? Grade proportionally to
the project's ambitions — a personal tool is not a fleet service; mark checks
not-applicable rather than punishing scale it will never need.

## Checks

### SCALE-1 — No local-only state in the serving process
Sessions, caches, uploads, and job state are not kept in process memory or on the
local disk of a web process (in-memory session dicts, `./uploads/` on the app's
own filesystem, module-level mutable caches used as storage). Any of these means
a second instance breaks the app or loses data.

### SCALE-2 — Instances are interchangeable
Nothing assumes "there is exactly one of me": no scheduled work that would
double-fire with two instances, no local file locks as coordination, no
in-process singletons holding business state. Not-applicable for CLIs.

### SCALE-3 — Heavy work is off the request path
Long-running operations (imports, scans, media processing, bulk notifications)
run as background jobs/queues, not inline in web requests where they pin workers
and time out under load.

### SCALE-4 — Database access won't collapse under growth
Connections are pooled and bounded; there are no per-request table scans of
unbounded tables on hot paths; write patterns don't serialise on a single
hot row/lock. Overlaps deliberately with PERF-2/PERF-4 — here the question is
behaviour under multiplied load, not single-request speed.

### SCALE-5 — External limits are respected
Calls to third-party APIs handle rate limits and failures (backoff, retry
budgets, circuit-breaking or at least deliberate failure handling), so a spike on
your side doesn't turn into a ban or a cascading outage.

### SCALE-6 — The app protects itself at the edge
Some form of rate limiting, body-size limits, or abuse protection exists for
publicly exposed endpoints — in the app or visibly delegated to a gateway/proxy
layer. Not-applicable if nothing is publicly exposed.

### SCALE-7 — Resource usage is bounded
No unbounded in-memory accumulation: reading whole large files/tables into memory
to process them, unbounded queues/lists that grow with traffic, caches with no
eviction. Cite the structure and what feeds it.

### SCALE-8 — Startup and shutdown are orchestration-friendly
The process starts from environment configuration alone, and handles termination
signals gracefully (finishes in-flight work, closes connections) — required for
rolling deploys and autoscaling. Partial when shutdown is unhandled but the app
is stateless enough to tolerate kills.
