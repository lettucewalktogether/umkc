"use client";

import Cite from "@/app/Cite";
import { classCode } from "@/lib/course";
import { domains, questions, scale } from "@/lib/assessment";
import { type AssessmentRecord } from "@/lib/dashboard";
import { cronbachAlpha, fmt, mean, median, sd } from "@/lib/stats";
import { downloadCsv, slug, toCsv, today } from "@/lib/csv";

/**
 * Confidence ratings for one administration of the instrument.
 *
 * Everything here is computed from the submitted responses; there is nothing
 * to configure. The instrument is administered once, so these are descriptive
 * statistics rather than tests of change: with a single measurement there is
 * no second point to compare against, and reporting a change statistic would
 * be inventing one.
 */

const RATINGS = [1, 2, 3, 4, 5, 6, 7];

export default function QuantTab({
  records,
}: {
  records: AssessmentRecord[];
}) {
  if (records.length === 0) {
    return (
      <p className="saved-empty">
        No assessments yet. The analysis appears here as students submit them,
        and recalculates on every refresh.
      </p>
    );
  }

  // One row per respondent, one column per item.
  const perItem = questions.map((_, i) =>
    records.map((r) => r.ratings[i]).filter((v): v is number => v !== null),
  );

  const completeRows = records
    .map((r) => r.ratings)
    .filter((rs) => rs.every((v) => v !== null)) as number[][];

  const overall = perItem.flat();

  const domainStats = domains.map((d) => {
    const idx = Array.from(
      { length: d.to - d.from + 1 },
      (_, k) => d.from - 1 + k,
    );
    const subtotals = records
      .map((r) => idx.map((i) => r.ratings[i]))
      .filter((vs) => vs.every((v) => v !== null))
      .map((vs) => (vs as number[]).reduce((a, b) => a + b, 0));
    const itemsForAlpha = completeRows.map((row) => idx.map((i) => row[i]));
    return {
      domain: d,
      n: subtotals.length,
      meanSubtotal: subtotals.length ? mean(subtotals) : null,
      sdSubtotal: subtotals.length > 1 ? sd(subtotals) : null,
      maxSubtotal: idx.length * 7,
      alpha:
        itemsForAlpha.length > 1 && idx.length > 1
          ? cronbachAlpha(itemsForAlpha)
          : null,
    };
  });

  const alphaAll =
    completeRows.length > 1 ? cronbachAlpha(completeRows) : null;

  function exportCsv() {
    const header = [
      "Class code",
      "Item",
      "Question",
      "Responses",
      "Mean",
      "SD",
      "Median",
      ...RATINGS.map((r) => `Rated ${r}`),
    ];
    const rows = questions.map((q, i) => {
      const vs = perItem[i];
      return [
        classCode,
        `Q${i + 1}`,
        q.stem,
        vs.length,
        vs.length ? Number(mean(vs).toFixed(2)) : "",
        vs.length > 1 ? Number(sd(vs).toFixed(2)) : "",
        vs.length ? median(vs) : "",
        ...RATINGS.map((r) => vs.filter((v) => v === r).length),
      ];
    });
    downloadCsv(
      `${slug(classCode, "class")}-assessment-summary-${today()}.csv`,
      toCsv([header, ...rows]),
    );
  }

  return (
    <>
      <div className="panel">
        <span className="label">One administration</span>
        <p>
          {records.length} response{records.length === 1 ? "" : "s"}. The
          instrument is given once, so these describe the class as measured.
        </p>
      </div>

      <div className="buttonrow">
        <button type="button" onClick={exportCsv}>
          Export item summary (CSV)
        </button>
      </div>

      <h3>Overall</h3>
      <p>
        Mean confidence across every answered item is{" "}
        <strong>{fmt(mean(overall))}</strong> on the seven-point scale
        {overall.length > 1 && <> (SD {fmt(sd(overall))})</>}, from{" "}
        {overall.length} answered item
        {overall.length === 1 ? "" : "s"}. The scale runs from 1 (
        {scale[0][2].toLowerCase()}) to 7 ({scale[6][2].toLowerCase()}).
      </p>

      <h3>By item</h3>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th className="num">n</th>
              <th className="num">Mean</th>
              <th className="num">SD</th>
              <th className="num">Median</th>
              {RATINGS.map((r) => (
                <th className="num" key={r}>
                  {r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {questions.map((q, i) => {
              const vs = perItem[i];
              return (
                <tr key={q.stem}>
                  <td>
                    <strong>Q{i + 1}</strong> {q.stem}
                  </td>
                  <td className="num">{vs.length}</td>
                  <td className="num">{vs.length ? fmt(mean(vs)) : "—"}</td>
                  <td className="num">{vs.length > 1 ? fmt(sd(vs)) : "—"}</td>
                  <td className="num">{vs.length ? median(vs) : "—"}</td>
                  {RATINGS.map((r) => (
                    <td className="num" key={r}>
                      {vs.filter((v) => v === r).length || "—"}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h3>By domain</h3>
      <p>
        Domain scores are the sum of their items, so each has a different
        maximum. Alpha is Cronbach&rsquo;s coefficient{" "}
        <Cite k="cronbach1951" />, reported where a domain has more than one
        item and more than one complete response.
      </p>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Domain</th>
              <th className="num">Complete responses</th>
              <th className="num">Mean</th>
              <th className="num">SD</th>
              <th className="num">Out of</th>
              <th className="num">Alpha</th>
            </tr>
          </thead>
          <tbody>
            {domainStats.map((d) => (
              <tr key={d.domain.name}>
                <td>
                  {d.domain.name}{" "}
                  <span className="subtle">
                    (Q{d.domain.from}&ndash;Q{d.domain.to})
                  </span>
                </td>
                <td className="num">{d.n}</td>
                <td className="num">
                  {d.meanSubtotal === null ? "—" : fmt(d.meanSubtotal)}
                </td>
                <td className="num">
                  {d.sdSubtotal === null ? "—" : fmt(d.sdSubtotal)}
                </td>
                <td className="num">{d.maxSubtotal}</td>
                <td className="num">
                  {d.alpha === null ? "—" : fmt(d.alpha)}
                </td>
              </tr>
            ))}
            <tr>
              <td>
                <strong>All ten items</strong>
              </td>
              <td className="num">{completeRows.length}</td>
              <td className="num">
                {completeRows.length
                  ? fmt(mean(completeRows.map((r) => r.reduce((a, b) => a + b, 0))))
                  : "—"}
              </td>
              <td className="num">
                {completeRows.length > 1
                  ? fmt(sd(completeRows.map((r) => r.reduce((a, b) => a + b, 0))))
                  : "—"}
              </td>
              <td className="num">70</td>
              <td className="num">
                {alphaAll === null ? "—" : fmt(alphaAll)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="panel warn">
        <span className="label">Reading these figures</span>
        <p>
          Every measure here is self-reported confidence. Self-assessment of
          knowledge tracks affect and motivation more closely than demonstrated
          learning <Cite k="sitzmann2010" />, and respondents with the least
          command of an area are the least able to judge it{" "}
          <Cite k="kruger1999" />. A high mean is evidence about how the class
          feels, not about what it can do.
        </p>
      </div>
    </>
  );
}
