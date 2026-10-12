# Production Ready Check

**Is your AI-generated code production-ready? Ask your agent.**

`production-ready-check` is a free, open-source [Agent Skill](https://skills.sh) that teaches your coding agent (Claude Code, Cursor, and any skills-compatible agent) to run a heuristic production-readiness assessment of the codebase it is working on, and give you a scored, evidence-backed report.

```bash
npx skills add qualityclouds/production-ready-check
```

Then ask your agent:

> "Is this production ready?"

## What you get

A report modeled on the shape of the Norma Production-Ready Score:

- **An overall 0 to 100 estimate** with a one-sentence verdict.
- **Five pillar scores** (Security, Performance, Maintainability, Manageability, Scalability), each graded against a fixed, public rubric (see [references/](references/)).
- **Top findings (max 5)**, each with the file reference, a plain-language explanation of *what breaks and when*, and a concrete fix. Readable whether you're a tech lead or you built your app entirely with AI.
- **An honest coverage statement** on large repos: the agent tells you exactly what it assessed.

The report is written in whatever language you're talking to your agent in.

## What it never does

- **No account, no signup, no network calls, no telemetry.** The skill is markdown instructions only: no scripts, no binaries. It works fully offline and is free forever.
- **Read-only.** It never modifies your files, runs your project, or executes your code.
- **Never touches secrets.** It may flag that a `.env` file is committed; it will not read its contents.

## Honest limitations

This is a heuristic assessment performed by an LLM: two runs can differ, and the score is an **estimate, not a measurement**. The fixed rubrics and the evidence-required grading keep it useful; the mandatory disclaimer in every report keeps it honest.

## Who's behind this

This skill is maintained by [Quality Clouds](https://qualityclouds.ai), the team behind Norma, a platform that answers the same question with versioned deterministic rules combined with more advanced AI-powered validators, consistent scoring, and score tracking over time.


We say this openly because it's the deal: **the skill is free and standalone**, and at the end of each report it includes one optional link to the real thing [Quality Clouds Portal](https://portal.qualityclouds.ai/?utm_source=github&utm_medium=readme&utm_campaign=production-ready-check&utm_content=skill-footer). If you ignore it, the skill never brings it up again. That's the whole funnel: no hidden behavior, nothing phoning home.

## The pillar rubrics

The editorial core of the skill lives in five rubric files, maintained with the same care as our product rules:

| Pillar | Rubric | Answers |
|---|---|---|
| Security | [references/security.md](references/security.md) | Can this be broken into? |
| Performance | [references/performance.md](references/performance.md) | Is it fast enough under real load? |
| Maintainability | [references/maintainability.md](references/maintainability.md) | Can anyone change it safely? |
| Manageability | [references/manageability.md](references/manageability.md) | Can anyone operate it? |
| Scalability | [references/scalability.md](references/scalability.md) | What happens at 10x the load? |

## Contributing

Issues and PRs on the rubrics are welcome. Better checks make a better skill. Rubric changes are reviewed by the skill's owner to keep them high quality and neutral.

## License

[MIT](LICENSE) © Quality Clouds
