# Public Innovation Challenge — course site

Next.js site backing [innovation.vercel.app](https://innovation.vercel.app),
publishing the course materials, data collection, and analysis for classroom
Public Innovation Challenge simulations.

## UMKC Government Accounting

Live section: **`/umkc/govtacctclass`** — Government Accounting with Marsha
Huber, University of Missouri-Kansas City. The unit runs the Kansas City
Quality Control Review (QCR) challenge: student Vendor Teams propose how the
City should improve residential permitting intake and what role AI should play,
then evaluate one another as simulated City Planning and Development
evaluators.

| Route | Contents |
| --- | --- |
| `/umkc/govtacctclass` | Overview, milestone sequence, what every student owes |
| `/umkc/govtacctclass/challenge` | The issued QCR challenge, scope boundary, roles, proposal and presentation requirements, AI-use rules |
| `/umkc/govtacctclass/rubric` | Six weighted criteria, score bands, printable evaluator score sheet |
| `/umkc/govtacctclass/eval` | On-screen evaluator score sheet with live weighted totals, exports to CSV |
| `/umkc/govtacctclass/assessment` | Ten-question pre/post confidence instrument, exports to CSV, also printable |
| `/umkc/govtacctclass/accounting` | Compressed post-selection procurement and accounting exercise |
| `/umkc/govtacctclass/references` | APA 7 entries for every method and external claim |
| `/umkc/govtacctclass/dashboard` | Instructor analysis dashboard (passcode-gated) |

### How data moves

No student data is ever sent to a server. Students fill in the evaluation and
assessment pages in their own browser, export a CSV, and hand that file to the
instructor. The instructor loads those files into the dashboard, which parses
and analyses them in the browser. There is no database and no student PII in
transit or at rest on the host.

Every export carries the **class code** in its first column and in its
filename, so files from different sections stay distinguishable.

### Instructor dashboard

Five tabs over the loaded files:

- **Team scores** — standings by mean weighted total, SD and range across
  evaluators, per-criterion means, and each team's collected evaluator
  narrative. Incomplete evaluations can be excluded.
- **Quantitative** — matched pre/post analysis per item, per domain, and
  overall: *M* (*SD*), mean difference with 95% CI, Wilcoxon signed-rank
  (exact where possible, otherwise continuity-corrected normal approximation),
  paired *t*, Cohen's *d_z*, matched-pairs rank-biserial *r*, Holm and
  Benjamini-Hochberg adjusted *p*, and Cronbach's α per scale.
- **Qualitative** — deductive content analysis against the instrument's own
  coding frame, two-coder support, Cohen's κ with Landis-Koch bands, and
  code-frequency change tested with the exact binomial McNemar test.
- **Sentiment** — VADER compound scores per response with published labelling
  thresholds, plus hedging and certainty marker counts, compared pre to post
  with the same paired procedures.
- **Methods** — a draft methods section generated from the loaded data, with
  the real counts and a full reference list, ready to be edited into a paper.

Each tab exports its own CSV, including the per-response values behind every
aggregate so any published figure can be traced back to its source text.

The statistics in `lib/stats.ts` are implemented from their published
definitions and were validated against SciPy 1.17 — paired *t*, CI, *d_z*,
Wilcoxon (both exact and continuity-corrected normal), Cronbach's α, Holm,
Benjamini-Hochberg, Cohen's κ, and exact McNemar all agree to at least five
significant figures.

### Configuration

Set these in the Vercel project (Settings → Environment Variables):

| Variable | Required | Purpose |
| --- | --- | --- |
| `INSTRUCTOR_PASSCODE` | yes, for the dashboard | Shared instructor passcode. Without it the dashboard cannot be entered. |
| `NEXT_PUBLIC_CLASS_CODE` | no | Class identifier stamped on every export. Defaults to `UMKC-GOVTACCT-HUBER`. |

The dashboard gate is one shared passcode, not per-user authentication: the
cookie holds an HMAC of a fixed message keyed by the passcode, checked in
middleware before the page renders. Treat the passcode as shared-secret
strength and do not put anything in the dashboard that everyone holding it
should not see.

### Source documents

The Word originals are mirrored under `public/umkc/govtacctclass/` and linked
from the site:

- `2026_0831_Kansas_City_Public_Innovation_Challenge_R2.docx`
- `2026_0831_Govt_Acct_Class_Pre_Post_Assessment_R1.docx`

Page content is transcribed from those documents. When a document is revised,
update both the mirrored file and the corresponding page. The challenge text
lives in the page components; the instrument, rubric, and codebook are data
modules (`lib/assessment.ts`, `lib/rubric.ts`, `lib/coding.ts`) shared by the
pages, forms, and dashboard, so a change in one place propagates everywhere.

### Deliberately unset

Dates, team counts, and the course calendar are the instructor's to set. Where
the site needs one it shows a `date TBD` marker rather than a guessed value —
search for `tbd` in `app/umkc/govtacctclass/page.tsx`.

## Development

```bash
npm install
npm run dev     # http://localhost:3000/umkc/govtacctclass
npm run build

# to work on the dashboard locally
INSTRUCTOR_PASSCODE=dev-passcode npm run dev
```

---

Academic simulation using public information. Not a City of Kansas City
publication or solicitation.
