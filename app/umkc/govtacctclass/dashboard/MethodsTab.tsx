"use client";

import { useState } from "react";
import { classCode, course } from "@/lib/course";
import { domains, questions } from "@/lib/assessment";
import { codebook } from "@/lib/coding";
import { criteria } from "@/lib/rubric";
import { references, doiUrl } from "@/lib/references";
import {
  matchPrePost,
  summarizeTeams,
  type AssessmentRecord,
  type EvalRecord,
} from "@/lib/dashboard";

export default function MethodsTab({
  evalRecords,
  assessmentRecords,
}: {
  evalRecords: EvalRecord[];
  assessmentRecords: AssessmentRecord[];
}) {
  const [copied, setCopied] = useState(false);

  const match = matchPrePost(assessmentRecords);
  const teams = summarizeTeams(evalRecords);
  const nPairs = match.pairs.length;
  const nEval = evalRecords.length;

  const methods = `Method

Participants and design. Students enrolled in ${course.name} at the ${course.school} (class identifier ${classCode}) completed a single-group pre/post design around the Public AI Innovation Challenge simulation, in which competing student vendor teams responded to a municipal Quality Control Review challenge and then evaluated one another's presentations. ${
    nPairs > 0
      ? `${nPairs} ${nPairs === 1 ? "student" : "students"} completed both the pre- and post-assessment and were matched on a self-generated anonymous code${
          match.preOnly.length + match.postOnly.length > 0
            ? `; ${match.preOnly.length} pre-only and ${match.postOnly.length} post-only responses could not be matched and were excluded from the paired analyses`
            : ""
        }.`
      : "Matched pre/post responses were not available at the time of writing."
  }

Instrument. Confidence was measured with ${questions.length} items on a seven-point Likert-type scale (Likert, 1932), from 1 (not at all confident) to 7 (highly confident), each accompanied by a required open response asking the respondent to justify the rating. Items were assigned a priori to ${domains.length} domains: ${domains
    .map((d) => `${d.name.toLowerCase()} (items ${d.from}-${d.to})`)
    .join("; ")}. The identical instrument was administered before and after the simulation. Respondents were instructed not to use AI systems, outside sources, or classmates when completing it.

Presentation evaluation. Student evaluators scored every team other than their own on ${criteria.length} published criteria (${criteria
    .map((c) => `${c.name.toLowerCase()}, ${c.weight}%`)
    .join("; ")}), each on a 0-5 scale requiring a selected primary reason and specific presentation evidence. Weighted points were computed as the score divided by 5 multiplied by the criterion weight, summing to 100.${
    nEval > 0
      ? ` ${nEval} ${nEval === 1 ? "evaluation was" : "evaluations were"} collected across ${teams.length} ${teams.length === 1 ? "team" : "teams"}.`
      : ""
  }

Quantitative analysis. Because single Likert items are ordinal, the Wilcoxon signed-rank test (Wilcoxon, 1945) was the primary inferential test for item-level change, with the paired-samples t test reported alongside it, a pairing that is conventional for rating data (Norman, 2010). The exact null distribution was used where no ties in absolute differences were present and n was 25 or fewer; otherwise a normal approximation with continuity and tie corrections was applied. Effect sizes were Cohen's d_z for the parametric test (Cohen, 1988; Lakens, 2013) and the matched-pairs rank-biserial correlation for the nonparametric test (Kerby, 2014). Because ten item-level tests were conducted, p-values were adjusted using the Holm step-down procedure (Holm, 1979), with Benjamini-Hochberg false-discovery-rate values also reported (Benjamini & Hochberg, 1995). Internal consistency for each domain scale and for the full instrument was estimated with Cronbach's alpha (Cronbach, 1951). Domain and total scores were analysed as sums of their constituent items. Reporting follows APA style (American Psychological Association, 2020).

Qualitative analysis. The open responses were analysed by deductive content analysis (Elo & Kyngäs, 2008; Krippendorff, 2018) using the coding frame specified in advance by the instrument: ${codebook
    .map((c) => c.label.toLowerCase())
    .join("; ")}. The unit of analysis was one respondent's paragraph on one item at one assessment point, and codes were not mutually exclusive. A subset was independently double-coded and inter-coder agreement was estimated with Cohen's kappa (Cohen, 1960), interpreted using the bands of Landis and Koch (1977). Change in the presence of each code between the matched pre and post responses was tested with the exact binomial form of McNemar's test (McNemar, 1947).

Sentiment analysis. Affective wording in the open responses was scored with VADER (Hutto & Gilbert, 2014), a rule-based lexicon model developed for short texts that accounts for negation, degree modifiers, punctuation, and capitalization. Each response received a compound score normalized to the interval [-1, 1], with the published thresholds of 0.05 and -0.05 used to label responses positive, neutral, or negative. Each participant contributed the mean compound score of their own responses at each assessment point, and pre/post change was tested with the same paired procedures used for the confidence ratings. Counts of hedging and certainty markers were computed alongside the sentiment scores.

Limitations. All confidence measures are self-reported. Self-assessment of knowledge correlates only weakly with demonstrated learning and is more closely associated with affect and motivation (Sitzmann et al., 2010), and respondents with the least command of a domain are least able to judge it (Kruger & Dunning, 1999); a rise in confidence is therefore not evidence of a gain in knowledge. The single-group design has no control condition, so change cannot be attributed to the simulation rather than to the passage of the course, maturation, or repeated exposure to the instrument. VADER was validated on social-media text rather than academic self-explanation, so its lexicon is only partly matched to this corpus. All analyses were computed in the browser from the exported response files; the per-response scores underlying every aggregate are included in the exports.

References

${references.map((r) => `${r.full}${r.doi ? ` https://doi.org/${r.doi}` : r.url ? ` ${r.url}` : ""}`).join("\n\n")}`;

  return (
    <>
      <div className="panel">
        <span className="label">Draft methods section</span>
        <p>
          Generated from the files currently loaded, so the counts match the data
          above. It names every test, effect size, correction, and coding
          procedure the dashboard actually ran, with its source. Read it and
          revise it before submission &mdash; it is a starting draft, not a
          finished manuscript, and the reference entries should be checked
          against the publisher record.
        </p>
      </div>

      <div className="buttonrow">
        <button
          type="button"
          className="primary"
          onClick={() => {
            navigator.clipboard.writeText(methods).then(
              () => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2500);
              },
              () => setCopied(false),
            );
          }}
        >
          {copied ? "Copied" : "Copy to clipboard"}
        </button>
      </div>

      <pre className="methods">{methods}</pre>

      <h3>Works cited by this dashboard</h3>
      <ul className="doclinks">
        {references.map((r) => (
          <li key={r.key} id={r.key}>
            {r.full}{" "}
            {doiUrl(r) && (
              <a href={doiUrl(r)} rel="noreferrer">
                {r.doi ? `https://doi.org/${r.doi}` : r.url}
              </a>
            )}
            <span className="note">{r.usedFor}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
