"use client";

import { useEffect, useMemo, useState } from "react";
import Cite from "@/app/Cite";
import { classCode } from "@/lib/course";
import { domains, questions } from "@/lib/assessment";
import { type AssessmentRecord } from "@/lib/dashboard";
import { fmt, mean, median, sd } from "@/lib/stats";
import { downloadCsv, slug, toCsv, today } from "@/lib/csv";

type Scores = { compound: number; pos: number; neu: number; neg: number };
type Analyzer = (text: string) => Scores;

/**
 * Hedging and certainty markers, counted alongside sentiment. Confidence
 * explanations carry little affect, so epistemic stance is usually the more
 * informative signal in this corpus.
 */
const HEDGES = [
  "maybe",
  "perhaps",
  "possibly",
  "might",
  "may",
  "could",
  "somewhat",
  "unsure",
  "unclear",
  "not sure",
  "i think",
  "i guess",
  "probably",
  "seems",
  "kind of",
  "sort of",
  "a little",
  "vague",
  "confusing",
  "confused",
  "don't know",
  "do not know",
];

const CERTAINTY = [
  "definitely",
  "certainly",
  "clearly",
  "always",
  "must",
  "will",
  "confident",
  "know",
  "understand",
  "can explain",
  "can apply",
  "specifically",
  "precisely",
  "exactly",
  "demonstrate",
];

function countMarkers(text: string, markers: string[]): number {
  const t = ` ${text.toLowerCase()} `;
  return markers.reduce((n, m) => {
    const re = new RegExp(
      `\\b${m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "g",
    );
    return n + (t.match(re)?.length ?? 0);
  }, 0);
}

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/** VADER's published thresholds for labelling a compound score. */
function label(compound: number): "positive" | "neutral" | "negative" {
  if (compound >= 0.05) return "positive";
  if (compound <= -0.05) return "negative";
  return "neutral";
}

export default function SentimentTab({
  records,
}: {
  records: AssessmentRecord[];
}) {
  const [analyzer, setAnalyzer] = useState<Analyzer | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // VADER is loaded on demand so the rest of the dashboard is not held up by it.
  useEffect(() => {
    let active = true;
    import("vader-sentiment")
      .then((mod) => {
        if (!active) return;
        const impl =
          (mod as unknown as { SentimentIntensityAnalyzer?: unknown })
            .SentimentIntensityAnalyzer ??
          (mod as unknown as {
            default?: { SentimentIntensityAnalyzer?: unknown };
          }).default?.SentimentIntensityAnalyzer;
        const polarity = (
          impl as { polarity_scores?: (t: string) => Scores } | undefined
        )?.polarity_scores;
        if (typeof polarity !== "function") {
          setLoadError("The sentiment lexicon could not be loaded.");
          return;
        }
        setAnalyzer(() => (text: string) => polarity.call(impl, text));
      })
      .catch(() => setLoadError("The sentiment lexicon could not be loaded."));
    return () => {
      active = false;
    };
  }, []);

  const scored = useMemo(() => {
    if (!analyzer) return [];
    const out: {
      code: string;
      item: number;
      text: string;
      compound: number;
      hedges: number;
      certainty: number;
      words: number;
    }[] = [];
    for (const r of records) {
      r.explanations.forEach((text, i) => {
        if (!text.trim()) return;
        out.push({
          code: r.code,
          item: i + 1,
          text,
          compound: analyzer(text).compound,
          hedges: countMarkers(text, HEDGES),
          certainty: countMarkers(text, CERTAINTY),
          words: wordCount(text),
        });
      });
    }
    return out;
  }, [analyzer, records]);

  if (loadError) return <p className="status incomplete">{loadError}</p>;
  if (!analyzer) return <p className="status">Loading the VADER lexicon…</p>;
  if (scored.length === 0) {
    return (
      <p className="saved-empty">
        No written responses yet. Sentiment appears here as students submit
        them, and recalculates on every refresh.
      </p>
    );
  }

  const compounds = scored.map((s) => s.compound);
  const counts = {
    positive: scored.filter((s) => label(s.compound) === "positive").length,
    neutral: scored.filter((s) => label(s.compound) === "neutral").length,
    negative: scored.filter((s) => label(s.compound) === "negative").length,
  };
  const hedged = scored.filter((s) => s.hedges > 0).length;
  const committed = scored.filter((s) => s.certainty > 0).length;

  function exportCsv() {
    const header = [
      "Class code",
      "Student ID",
      "Item",
      "Tone score",
      "Label",
      "Hedging markers",
      "Certainty markers",
      "Words",
      "Response",
    ];
    const rows = scored.map((s) => [
      classCode,
      s.code,
      `Q${s.item}`,
      Number(s.compound.toFixed(4)),
      label(s.compound),
      s.hedges,
      s.certainty,
      s.words,
      s.text,
    ]);
    downloadCsv(
      `${slug(classCode, "class")}-sentiment-${today()}.csv`,
      toCsv([header, ...rows]),
    );
  }

  return (
    <>
      <div className="panel">
        <span className="label">How this works</span>
        <p>
          {scored.length} written response{scored.length === 1 ? "" : "s"}{" "}
          scored automatically for tone by VADER <Cite k="hutto2014" />, a
          word-list method that also reads negations, intensifiers, and
          punctuation. Nothing is set by hand.
        </p>
      </div>

      <div className="buttonrow">
        <button type="button" onClick={exportCsv}>
          Export sentiment (CSV)
        </button>
      </div>

      <h3>Tone</h3>
      <p>
        Tone is scored from &minus;1 (very negative) through 0 (neutral) to +1
        (very positive). The average across all responses is{" "}
        <strong>{fmt(mean(compounds), 2)}</strong> (middle value{" "}
        {fmt(median(compounds), 2)}). Anything between &minus;0.05 and +0.05
        counts as neutral.
      </p>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Label</th>
              <th className="num">Responses</th>
              <th className="num">Share</th>
            </tr>
          </thead>
          <tbody>
            {(["positive", "neutral", "negative"] as const).map((k) => (
              <tr key={k}>
                <td>{k[0].toUpperCase() + k.slice(1)}</td>
                <td className="num">{counts[k]}</td>
                <td className="num">
                  {Math.round((counts[k] / scored.length) * 100)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>How sure students sound</h3>
      <p>
        {hedged} of {scored.length} response
        {scored.length === 1 ? "" : "s"} (
        {Math.round((hedged / scored.length) * 100)}%) use uncertain wording
        such as &ldquo;maybe&rdquo;, &ldquo;I think&rdquo; or &ldquo;not
        sure&rdquo;. {committed} (
        {Math.round((committed / scored.length) * 100)}%) use definite wording
        such as &ldquo;definitely&rdquo;, &ldquo;I know&rdquo; or &ldquo;I can
        explain&rdquo;.
      </p>
      <p>
        This is usually the more useful number. Students explaining a
        confidence rating rarely write with much feeling either way, so most
        responses score as neutral on tone &mdash; that is normal, and not a
        result in itself.
      </p>

      <h3>By item</h3>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th className="num">Responses</th>
              <th className="num">Average tone</th>
              <th className="num">Uncertain wording</th>
              <th className="num">Definite wording</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q, i) => {
              const subset = scored.filter((s) => s.item === i + 1);
              return (
                <tr key={q.stem}>
                  <td>
                    <strong>Q{i + 1}</strong>
                  </td>
                  <td className="num">{subset.length}</td>
                  <td className="num">
                    {subset.length
                      ? fmt(mean(subset.map((s) => s.compound)), 3)
                      : "—"}
                  </td>
                  <td className="num">
                    {subset.filter((s) => s.hedges > 0).length || "—"}
                  </td>
                  <td className="num">
                    {subset.filter((s) => s.certainty > 0).length || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h3>By domain</h3>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Domain</th>
              <th className="num">Responses</th>
              <th className="num">Average tone</th>
            </tr>
          </thead>
          <tbody>
            {domains.map((d) => {
              const subset = scored.filter(
                (s) => s.item >= d.from && s.item <= d.to,
              );
              return (
                <tr key={d.name}>
                  <td>
                    {d.name}{" "}
                    <span className="subtle">
                      (Q{d.from}&ndash;Q{d.to})
                    </span>
                  </td>
                  <td className="num">{subset.length}</td>
                  <td className="num">
                    {subset.length
                      ? fmt(mean(subset.map((s) => s.compound)), 3)
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="panel warn">
        <span className="label">Treat tone loosely</span>
        <p>
          The word list behind these scores was built from social media, not
          from students explaining coursework <Cite k="hutto2014" />, so the
          tone figure is a rough signal. The wording counts above are the more
          dependable of the two.
        </p>
      </div>
    </>
  );
}
