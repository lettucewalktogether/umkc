"use client";

import { useMemo } from "react";
import Cite from "@/app/Cite";
import { classCode } from "@/lib/course";
import { questions } from "@/lib/assessment";
import { type AssessmentRecord } from "@/lib/dashboard";
import { features, featurePresence, wordCount } from "@/lib/textFeatures";
import { fmt, mean, median } from "@/lib/stats";
import { downloadCsv, slug, toCsv, today } from "@/lib/csv";

/**
 * Automatic indicators over the written responses.
 *
 * Nothing here is hand coded. Each response is scanned for observable
 * features and the totals recompute from whatever has been submitted.
 */

type Scanned = {
  code: string;
  item: number;
  text: string;
  words: number;
  present: Record<string, boolean>;
};

export default function QualTab({
  records,
}: {
  records: AssessmentRecord[];
}) {
  const scanned = useMemo<Scanned[]>(() => {
    const out: Scanned[] = [];
    for (const r of records) {
      r.explanations.forEach((text, i) => {
        if (!text.trim()) return;
        out.push({
          code: r.code,
          item: i + 1,
          text,
          words: wordCount(text),
          present: featurePresence(text),
        });
      });
    }
    return out;
  }, [records]);

  if (scanned.length === 0) {
    return (
      <p className="saved-empty">
        No written responses yet. Indicators appear here as students submit
        them, and recalculate on every refresh.
      </p>
    );
  }

  const total = scanned.length;
  const words = scanned.map((s) => s.words);

  function share(key: string, subset = scanned): number {
    if (subset.length === 0) return 0;
    return subset.filter((s) => s.present[key]).length / subset.length;
  }

  function exportCsv() {
    const header = [
      "Class code",
      "Student ID",
      "Item",
      "Words",
      ...features.map((f) => f.label),
      "Response",
    ];
    const rows = scanned.map((s) => [
      classCode,
      s.code,
      `Q${s.item}`,
      s.words,
      ...features.map((f) => (s.present[f.key] ? "Yes" : "")),
      s.text,
    ]);
    downloadCsv(
      `${slug(classCode, "class")}-response-indicators-${today()}.csv`,
      toCsv([header, ...rows]),
    );
  }

  return (
    <>
      <div className="panel">
        <span className="label">Computed, not coded</span>
        <p>
          {total} written response{total === 1 ? "" : "s"} scanned for
          observable features of the text. These are not judgments of whether
          an answer is correct &mdash; read the responses below for that.
        </p>
      </div>

      <div className="buttonrow">
        <button type="button" onClick={exportCsv}>
          Export responses and indicators (CSV)
        </button>
      </div>

      <h3>Length</h3>
      <p>
        Median <strong>{median(words)}</strong> words (mean {fmt(mean(words))},
        range {Math.min(...words)}&ndash;{Math.max(...words)}).
      </p>

      <h3>Indicators across all responses</h3>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Indicator</th>
              <th className="num">Responses</th>
              <th className="num">Share</th>
              <th>What it detects</th>
            </tr>
          </thead>
          <tbody>
            {features.map((f) => (
              <tr key={f.key}>
                <td>
                  <strong>{f.label}</strong>
                </td>
                <td className="num">
                  {scanned.filter((s) => s.present[f.key]).length}
                </td>
                <td className="num">{Math.round(share(f.key) * 100)}%</td>
                <td>{f.definition}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>Indicators by item</h3>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th className="num">Responses</th>
              {features.map((f) => (
                <th className="num" key={f.key}>
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {questions.map((q, i) => {
              const subset = scanned.filter((s) => s.item === i + 1);
              return (
                <tr key={q.stem}>
                  <td>
                    <strong>Q{i + 1}</strong>
                  </td>
                  <td className="num">{subset.length}</td>
                  {features.map((f) => (
                    <td className="num" key={f.key}>
                      {subset.length
                        ? `${Math.round(share(f.key, subset) * 100)}%`
                        : "—"}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h3>Responses</h3>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Student ID</th>
              <th className="num">Item</th>
              <th>Response</th>
              <th>Indicators</th>
            </tr>
          </thead>
          <tbody>
            {scanned.map((s, i) => (
              <tr key={`${s.code}-${s.item}-${i}`}>
                <td>{s.code || "—"}</td>
                <td className="num">Q{s.item}</td>
                <td>{s.text}</td>
                <td>
                  {features
                    .filter((f) => s.present[f.key])
                    .map((f) => f.label)
                    .join("; ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel warn">
        <span className="label">Presence is not quality</span>
        <p>
          A response can name an invoice and still be wrong; a plain-language
          answer with no listed vocabulary can be right. Coding meaning needs
          a human coder and a reliability check{" "}
          <Cite k={["elo2008", "krippendorff2018"]} />.
        </p>
      </div>
    </>
  );
}
