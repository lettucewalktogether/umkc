"use client";

import { criteria } from "@/lib/rubric";
import { summarizeTeams, type EvalRecord } from "@/lib/dashboard";
import { fmt } from "@/lib/stats";
import { downloadCsv, slug, toCsv, today } from "@/lib/csv";
import { classCode } from "@/lib/course";

export default function TeamScores({
  records,
  onlyComplete,
  setOnlyComplete,
}: {
  records: EvalRecord[];
  onlyComplete: boolean;
  setOnlyComplete: (v: boolean) => void;
}) {
  const used = onlyComplete ? records.filter((r) => r.complete) : records;
  const teams = summarizeTeams(used);
  const excluded = records.length - used.length;

  if (records.length === 0) {
    return (
      <p className="saved-empty">
        Load the presentation-score spreadsheets your evaluators exported to see
        team results.
      </p>
    );
  }

  function exportSummary() {
    const rows: (string | number)[][] = [
      [
        "Class code",
        "Rank",
        "Team",
        "Evaluations",
        "Complete evaluations",
        "Mean weighted total (of 100)",
        "SD",
        "Min",
        "Max",
        ...criteria.map((c) => `${c.name} - mean score (0-5)`),
        ...criteria.map((c) => `${c.name} - mean weighted points`),
      ],
    ];
    teams.forEach((t, i) => {
      rows.push([
        classCode,
        i + 1,
        t.team,
        t.nEvaluations,
        t.nComplete,
        Number(t.meanTotal.toFixed(2)),
        isNaN(t.sdTotal) ? "" : Number(t.sdTotal.toFixed(2)),
        isNaN(t.minTotal) ? "" : t.minTotal,
        isNaN(t.maxTotal) ? "" : t.maxTotal,
        ...t.byCriterion.map((c) =>
          isNaN(c.meanScore) ? "" : Number(c.meanScore.toFixed(2)),
        ),
        ...t.byCriterion.map((c) =>
          isNaN(c.meanWeighted) ? "" : Number(c.meanWeighted.toFixed(2)),
        ),
      ]);
    });
    downloadCsv(
      `${slug(classCode, "class")}-team-results-${today()}.csv`,
      toCsv(rows),
    );
  }

  const leader = teams[0];

  return (
    <>
      <div className="buttonrow">
        <label className="checkline">
          <input
            type="checkbox"
            checked={onlyComplete}
            onChange={(e) => setOnlyComplete(e.target.checked)}
          />
          Use only complete evaluations
        </label>
        <button type="button" onClick={exportSummary}>
          Export team results (CSV)
        </button>
      </div>

      {onlyComplete && excluded > 0 && (
        <p className="status incomplete">
          {excluded} incomplete{" "}
          {excluded === 1 ? "evaluation is" : "evaluations are"} excluded. An
          evaluation is complete when every criterion carries a score, a primary
          reason, and specific evidence, and the narrative fields are filled in.
        </p>
      )}

      <h3>Standings</h3>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th className="num">Rank</th>
              <th>Team</th>
              <th className="num">Evaluations</th>
              <th className="num">Mean weighted total</th>
              <th className="num">SD</th>
              <th className="num">Range</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t, i) => (
              <tr key={t.team}>
                <td className="num">{i + 1}</td>
                <td>
                  <strong>{t.team}</strong>
                </td>
                <td className="num">
                  {t.nEvaluations}
                  {t.nComplete !== t.nEvaluations && (
                    <span className="subtle"> ({t.nComplete} complete)</span>
                  )}
                </td>
                <td className="num">
                  <strong>{fmt(t.meanTotal, 1)}</strong>
                </td>
                <td className="num">{fmt(t.sdTotal, 1)}</td>
                <td className="num">
                  {isNaN(t.minTotal)
                    ? "—"
                    : `${fmt(t.minTotal, 1)}–${fmt(t.maxTotal, 1)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {leader && teams.length > 1 && (
        <p className="status">
          Highest mean weighted total: <strong>{leader.team}</strong> at{" "}
          {fmt(leader.meanTotal, 1)} of 100, from {leader.nEvaluations}{" "}
          {leader.nEvaluations === 1 ? "evaluation" : "evaluations"}. A wide SD
          means evaluators disagreed; read their evidence before treating the
          ranking as settled.
        </p>
      )}

      <h3>Mean score by criterion</h3>
      <p className="status">
        Scores are on the 0-5 rubric scale. The weighted contribution of each
        criterion is its mean score divided by 5, times its weight.
      </p>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Criterion</th>
              <th className="num">Weight</th>
              {teams.map((t) => (
                <th className="num" key={t.team}>
                  {t.team}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {criteria.map((c, ci) => (
              <tr key={c.key}>
                <td>{c.name}</td>
                <td className="num">{c.weight}%</td>
                {teams.map((t) => (
                  <td className="num" key={t.team}>
                    {fmt(t.byCriterion[ci].meanScore, 2)}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td>
                <strong>Weighted total</strong>
              </td>
              <td className="num">100%</td>
              {teams.map((t) => (
                <td className="num" key={t.team}>
                  <strong>{fmt(t.meanTotal, 1)}</strong>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Evaluator narrative by team</h3>
      {teams.map((t) => (
        <details key={t.team} className="disclosure">
          <summary>
            {t.team} — {t.nEvaluations}{" "}
            {t.nEvaluations === 1 ? "evaluation" : "evaluations"}, mean{" "}
            {fmt(t.meanTotal, 1)}
          </summary>
          <h4>Strengths</h4>
          <ul>
            {t.strengths.length ? (
              t.strengths.map((s, i) => <li key={i}>{s}</li>)
            ) : (
              <li className="subtle">None recorded.</li>
            )}
          </ul>
          <h4>Concerns and unresolved questions</h4>
          <ul>
            {t.concerns.length ? (
              t.concerns.map((s, i) => <li key={i}>{s}</li>)
            ) : (
              <li className="subtle">None recorded.</li>
            )}
          </ul>
          <h4>Overall recommendations</h4>
          <ul>
            {t.recommendations.length ? (
              t.recommendations.map((s, i) => <li key={i}>{s}</li>)
            ) : (
              <li className="subtle">None recorded.</li>
            )}
          </ul>
        </details>
      ))}
    </>
  );
}
