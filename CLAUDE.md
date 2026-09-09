# UMKC Government Accounting — Public AI Innovation Challenge

Next.js site for one class unit, deployed on Vercel at
`publicinnovation.vercel.app/umkc/govtacctclass`.

## Write in plain language

**Every word a person reads must pass the `plain-language` skill.** Site copy,
headings, buttons, error messages, dashboard readings, replies in chat, emails,
handouts, code comments, commit messages. Target: an eighth-grade reader
understands it the first time.

The two rules broken most often here:

- **Say what a number means.** Never print a statistic without a sentence a
  non-specialist can act on.
- **Plain word first, term in brackets.** "money set aside (an encumbrance)".

See `.claude/skills/plain-language/SKILL.md`.

## What the site is

Two separate instruments, reported separately. Do not merge them.

- **Class assessment** — ten confidence items, seven-point scale, each with a
  written justification. Given **once**. There is no pre/post pairing.
- **Presentation evaluations** — students score other teams against six
  weighted rubric criteria.

Students identify themselves by **student ID** on both.

## How work reaches the instructor

Students fill a page in, enter their student ID and the shared class passcode,
and submit. Submissions go to Vercel Blob and appear on the dashboard on their
own. There is no upload path and no file handling.

- `POST /umkc/govtacctclass/api/submissions` — gated by `STUDENT_PASSCODE`
- `GET` / `PATCH` on the same route — gated by the instructor session cookie

## Storage

Paths are `<stage>/<kind>/<cohort>/<file>`.

- Stages: `active` (on the dashboard), `archived` (hidden, restorable), `deep`
  (out of every view, still stored). `active` keeps the bare prefix, so blobs
  written before stages existed are still found.
- A **cohort** is one run of the class: a label and the dates its students
  submit in, stored at `config/cohorts.json`.
- **Nothing is ever deleted.** There is no destructive path in the API, and
  "remove from view" means a move to `deep`. Keep it that way.

## Auth

- `INSTRUCTOR_PASSCODE` — dashboard and archive. **Never overwrite it**; the
  value cannot be read back, and replacing it locks the instructor out.
- `STUDENT_PASSCODE` — lets students submit. Nothing more.
- The session cookie is scoped to `path=/umkc/govtacctclass`, which is why the
  API lives under that path. A route outside it never receives the cookie.
- The middleware matcher lists **exact paths**. Any new page showing student
  work must be added to it. `/dashboard/references` is public on purpose.

## Analytics

Vercel Web Analytics, Speed Insights, and Microsoft Clarity. Clarity records
sessions, so it is held off `/assessment` and `/eval`, and both forms carry
`data-clarity-mask`. Keep it that way: those pages hold student coursework.

## Statistics

The dashboard only claims what it runs. If a procedure is removed, remove its
entry from `lib/references.ts` too. The references page exists to show that
sources check out, so citing a test nobody runs is a false claim.

Written responses are scanned for **observable features** (an example, a named
record, hedging). They are never labelled correct or mistaken. Judging that
needs a human reading meaning. A keyword rule claiming it would assert more
than the data supports.

## Deploying

The Vercel Production Branch is still `claude/umkc-govt-acct-class-je3a65`, so
a push to `main` builds a **preview**. Production needs an explicit deploy:

```
POST https://api.vercel.com/v13/deployments
{"name":"innovation","project":"prj_42GeyoyrS85iocSb1CkgXo8LFTpT",
 "target":"production","gitSource":{"type":"github","repoId":1352747684,"ref":"main"}}
```

Environment variables are injected at build time, so changing one does nothing
until the next deploy.
