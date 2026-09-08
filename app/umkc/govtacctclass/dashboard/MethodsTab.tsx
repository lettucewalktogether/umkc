"use client";

import { useState } from "react";
import { classCode, course } from "@/lib/course";
import { domains, questions } from "@/lib/assessment";
import { codebook } from "@/lib/coding";
import { criteria } from "@/lib/rubric";
import { references, doiUrl } from "@/lib/references";
import {
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

  const nAssessment = assessmentRecords.length;
  const nEval = evalRecords.length;
  const teams = [...new Set(evalRecords.map((r) => r.team.trim()).filter(Boolean))];

  const methods = `Method

Participants and design. Students enrolled in ${course.name} at the ${course.school} (class identifier ${classCode}) completed a confidence assessment alongside the Public AI Innovation Challenge simulation, in which competing student vendor teams responded to a municipal Quality Control Review challenge and then evaluated one another's presentations. ${
    nAssessment > 0
      ? `${nAssessment} ${nAssessment === 1 ? "response was" : "responses were"} collected.`
      : "No assessment responses were available at the time of writing."
  } The instrument is administered once, so the assessment findings are descriptive of the class as measured and support no claim about change over time.

Instrument. Confidence was measured with ${questions.length} items on a seven-point Likert-type scale (Likert, 1932), from 1 (not at all confident) to 7 (highly confident), each accompanied by a required open response asking the respondent to justify the rating. Items were assigned a priori to ${domains.length} domains: ${domains
    .map((d) => `${d.name.toLowerCase()} (items ${d.from}-${d.to})`)
    .join("; ")}. Respondents were instructed not to use AI systems, outside sources, or classmates when completing it.

Presentation evaluation. Student evaluators scored every team other than their own on ${criteria.length} published criteria (${criteria
    .map((c) => `${c.name.toLowerCase()}, ${c.weight}%`)
    .join("; ")}), each on a 0-5 scale requiring a selected primary reason and specific presentation evidence. Weighted points were computed as the score divided by 5 multiplied by the criterion weight, summing to 100.${
    nEval > 0
      ? ` ${nEval} ${nEval === 1 ? "evaluation was" : "evaluations were"} collected across ${teams.length} ${teams.length === 1 ? "team" : "teams"}.`
      : ""
  }

Quantitative analysis. Item responses were summarised by mean, standard deviation, median, and the full distribution across the seven scale points. Domain scores were analysed as sums of their constituent items. Internal consistency for each domain scale and for the full instrument was estimated with Cronbach's alpha (Cronbach, 1951). No inferential test of change was conducted, because a single administration provides no second measurement to compare against. Reporting follows APA style (American Psychological Association, 2020).

Analysis of the open responses. The written justifications were scanned automatically for observable textual features: the presence of a concrete example, reference to a document or control, use of governmental accounting vocabulary, quantification, explicit statements of not knowing, hedging, and unhedged commitment. These are surface features counted by pattern matching, not judgments of correctness; no claim is made that a response is accurate or mistaken. Assessing meaning would require human coding and a reliability check (Elo & Kyngäs, 2008; Krippendorff, 2018), which was not performed, so the feature counts are reported as description and the responses themselves are retained for reading.

Sentiment analysis. Affective wording in the open responses was scored with VADER (Hutto & Gilbert, 2014), a rule-based lexicon model developed for short texts that accounts for negation, degree modifiers, punctuation, and capitalization. Each response received a compound score normalized to the interval [-1, 1], with the published thresholds of 0.05 and -0.05 used to label responses positive, neutral, or negative. Counts of hedging and certainty markers were computed alongside the sentiment scores.

Limitations. All confidence measures are self-reported. Self-assessment of knowledge correlates only weakly with demonstrated learning and is more closely associated with affect and motivation (Sitzmann et al., 2010), and respondents with the least command of a domain are least able to judge it (Kruger & Dunning, 1999); a high confidence rating is therefore not evidence of knowledge. With one administration there is no baseline or follow-up, so no change can be estimated and no effect attributed to the simulation. VADER was validated on social-media text rather than academic self-explanation, so its lexicon is only partly matched to this corpus. All analyses were computed in the browser from the submitted responses.

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
