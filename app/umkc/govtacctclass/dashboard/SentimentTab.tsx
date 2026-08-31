"use client";

import { useEffect, useMemo, useState } from "react";
import Cite from "@/app/Cite";
import { classCode } from "@/lib/course";
import { questions } from "@/lib/assessment";
import { matchPrePost, type AssessmentRecord } from "@/lib/dashboard";
import {
  fmt,
  formatP,
  interpretD,
  mean,
  pairedT,
  wilcoxonSignedRank,
} from "@/lib/stats";
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
        const analyzerImpl =
          (mod as unknown as { SentimentIntensityAnalyzer?: unknown })
            .SentimentIntensityAnalyzer ??
          (mod as unknown as { default?: { SentimentIntensityAnalyzer?: unknown } })
            .default?.SentimentIntensityAnalyzer;
        const polarity = (
          analyzerImpl as {
            polarity_scores: (t: string) => Scores;
          }
        ).polarity_scores;
        setAnalyzer(() => (text: string) => polarity(text));
      })
      .catch((e: unknown) =>
        setLoadError(e instanceof Error ? e.message : String(e)),
      );
    return () => {
      active = false;
    };
  }, []);

  const match = useMemo(() => matchPrePost(records), [records]);

  const perStudent = useMemo(() => {
    if (!analyzer) return [];
    return match.pairs.map((p) => {
      const score = (r: AssessmentRecord) => {
        const texts = r.explanations.filter((t) => t.trim());
        const compounds = texts.map((t) => analyzer(t).compound);
        const words = texts.reduce((n, t) => n + wordCount(t), 0);
        return {
          nTexts: texts.length,
          meanCompound: texts.length ? mean(compounds) : NaN,
          words,
          hedges: texts.reduce((n, t) => n + countMarkers(t, HEDGES), 0),
          certainty: texts.reduce((n, t) => n + countMarkers(t, CERTAINTY), 0),
        };
      };
      return { code: p.code, pre: score(p.pre), post: score(p.post) };
    });
  }, [analyzer, match]);

  const usable = perStudent.filter(
    (s) => !isNaN(s.pre.meanCompound) && !isNaN(s.post.meanCompound),
  );

  const allTexts = useMemo(() => {
    if (!analyzer) return [];
    const out: {
      code: string;
      point: string;
      question: number;
      text: string;
      s: Scores;
    }[] = [];
    for (const r of records) {
      r.explanations.forEach((text, i) => {
        if (!text.trim()) return;
        out.push({
          code: r.code,
          point: r.point,
          question: i + 1,
          text,
          s: analyzer(text),
        });
      });
    }
    return out;
  }, [analyzer, records]);

  if (records.length === 0) {
    return (
      <p className="saved-empty">
        Load the assessment spreadsheets to run the sentiment analysis.
      </p>
    );
  }

  if (loadError) {
    return (
      <p className="status incomplete">
        The sentiment lexicon could not be loaded: {loadError}
      </p>
    );
  }

  if (!analyzer) {
    return <p className="status">Loading the VADER lexicon…</p>;
  }

  const compoundT = pairedT(
    usable.map((s) => s.pre.meanCompound),
    usable.map((s) => s.post.meanCompound),
  );
  const compoundW = wilcoxonSignedRank(
    usable.map((s) => s.pre.meanCompound),
    usable.map((s) => s.post.meanCompound),
  );
  const hedgeT = pairedT(
    usable.map((s) => s.pre.hedges),
    usable.map((s) => s.post.hedges),
  );
  const certaintyT = pairedT(
    usable.map((s) => s.pre.certainty),
    usable.map((s) => s.post.certainty),
  );
  const wordsT = pairedT(
    usable.map((s) => s.pre.words),
    usable.map((s) => s.post.words),
  );

  const dist = (point: string) => {
    const rows = allTexts.filter((t) => t.point === point);
    const counts = { positive: 0, neutral: 0, negative: 0 };
    for (const r of rows) counts[label(r.s.compound)]++;
    return { n: rows.length, ...counts };
  };
  const preDist = dist("Pre");
  const postDist = dist("Post");

  function exportSentiment() {
    const rows: (string | number)[][] = [
      [
        "Class code",
        "Matching code",
        "Assessment point",
        "Question",
        "VADER compound",
        "Positive",
        "Neutral",
        "Negative",
        "Label",
        "Word count",
        "Hedging markers",
        "Certainty markers",
        "Response text",
      ],
    ];
    for (const t of allTexts) {
      rows.push([
        classCode,
        t.code,
        t.point,
        t.question,
        Number(t.s.compound.toFixed(4)),
        Number(t.s.pos.toFixed(3)),
        Number(t.s.neu.toFixed(3)),
        Number(t.s.neg.toFixed(3)),
        label(t.s.compound),
        wordCount(t.text),
        countMarkers(t.text, HEDGES),
        countMarkers(t.text, CERTAINTY),
        t.text,
      ]);
    }

    rows.push([]);
    rows.push([`Paired pre/post comparison, ${usable.length} matched students`]);
    rows.push([
      "Measure",
      "n",
      "M pre",
      "SD pre",
      "M post",
      "SD post",
      "Mean difference",
      "95% CI lower",
      "95% CI upper",
      "t",
      "df",
      "p",
      "Cohen's d_z",
    ]);
    const add = (name: string, r: ReturnType<typeof pairedT>) => {
      if (!r) return;
      rows.push([
        name,
        r.n,
        Number(r.meanPre.toFixed(3)),
        Number(r.sdPre.toFixed(3)),
        Number(r.meanPost.toFixed(3)),
        Number(r.sdPost.toFixed(3)),
        Number(r.meanDiff.toFixed(3)),
        Number(r.ciLow.toFixed(3)),
        Number(r.ciHigh.toFixed(3)),
        isNaN(r.t) ? "" : Number(r.t.toFixed(3)),
        r.df,
        isNaN(r.p) ? "" : Number(r.p.toFixed(6)),
        isNaN(r.dz) ? "" : Number(r.dz.toFixed(3)),
      ]);
    };
    add("Mean VADER compound", compoundT);
    add("Hedging markers", hedgeT);
    add("Certainty markers", certaintyT);
    add("Words written", wordsT);

    downloadCsv(
      `${slug(classCode, "class")}-sentiment-${today()}.csv`,
      toCsv(rows),
    );
  }

  return (
    <>
      <div className="panel">
        <span className="label">Method</span>
        <p>
          Valence Aware Dictionary and sEntiment Reasoner (VADER){" "}
          <Cite k="hutto2014" />, a rule-based lexicon model built for short
          texts, which accounts for negation, degree modifiers, punctuation, and
          capitalization. Each response receives a compound score normalized to
          [-1, 1]; a response is labelled positive at ≥ 0.05 and negative at ≤
          -0.05, the thresholds published with the model. Scoring runs entirely
          in this browser, so the analysis is deterministic and rerunnable, and
          the per-response scores are in the export so any figure can be traced
          back to its text.
        </p>
      </div>

      <div className="buttonrow">
        <button type="button" onClick={exportSentiment}>
          Export sentiment scores (CSV)
        </button>
      </div>

      <h3>Distribution of responses</h3>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Assessment point</th>
              <th className="num">Responses</th>
              <th className="num">Positive</th>
              <th className="num">Neutral</th>
              <th className="num">Negative</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Pre", preDist],
              ["Post", postDist],
            ].map(([name, d]) => {
              const dd = d as ReturnType<typeof dist>;
              return (
                <tr key={name as string}>
                  <td>{name as string}</td>
                  <td className="num">{dd.n}</td>
                  <td className="num">
                    {dd.positive}
                    {dd.n ? ` (${((dd.positive / dd.n) * 100).toFixed(0)}%)` : ""}
                  </td>
                  <td className="num">
                    {dd.neutral}
                    {dd.n ? ` (${((dd.neutral / dd.n) * 100).toFixed(0)}%)` : ""}
                  </td>
                  <td className="num">
                    {dd.negative}
                    {dd.n ? ` (${((dd.negative / dd.n) * 100).toFixed(0)}%)` : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h3>Paired change</h3>
      {usable.length < 2 ? (
        <p className="status incomplete">
          At least two matched students with written responses at both points are
          needed. {usable.length} available.
        </p>
      ) : (
        <>
          <p className="status">
            Each student contributes the mean of their own responses at each
            point, so one talkative student does not dominate.
          </p>
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Measure</th>
                  <th className="num sym">n</th>
                  <th className="num sym">M pre (SD)</th>
                  <th className="num sym">M post (SD)</th>
                  <th className="num sym">ΔM [95% CI]</th>
                  <th className="num sym">t(df)</th>
                  <th className="num sym">p</th>
                  <th className="num sym">d<sub>z</sub></th>
                  <th>Magnitude</th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ["Mean VADER compound", compoundT],
                    ["Hedging markers per student", hedgeT],
                    ["Certainty markers per student", certaintyT],
                    ["Words written", wordsT],
                  ] as const
                ).map(([name, r]) => (
                  <tr key={name}>
                    <td>{name}</td>
                    <td className="num">{r?.n ?? "—"}</td>
                    <td className="num">
                      {r ? `${fmt(r.meanPre)} (${fmt(r.sdPre)})` : "—"}
                    </td>
                    <td className="num">
                      {r ? `${fmt(r.meanPost)} (${fmt(r.sdPost)})` : "—"}
                    </td>
                    <td className="num">
                      {r
                        ? `${fmt(r.meanDiff)} [${fmt(r.ciLow)}, ${fmt(r.ciHigh)}]`
                        : "—"}
                    </td>
                    <td className="num">
                      {r && !isNaN(r.t) ? `${fmt(r.t)}(${r.df})` : "—"}
                    </td>
                    <td className="num">{r ? formatP(r.p) : "—"}</td>
                    <td className="num">{r ? fmt(r.dz) : "—"}</td>
                    <td>{r ? interpretD(r.dz) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {compoundW && (
            <p className="status">
              Nonparametric check on the compound score: Wilcoxon W ={" "}
              {fmt(compoundW.W, 1)}, p = {formatP(compoundW.p)} (
              {compoundW.method}), rank-biserial r ={" "}
              {fmt(compoundW.rankBiserial)}.
            </p>
          )}
        </>
      )}

      <div className="panel warn">
        <span className="label">Limits of this measure</span>
        <p>
          VADER was developed and validated on social-media text, not on
          academic self-explanations, so its lexicon is only partly matched to
          this corpus <Cite k="hutto2014" />. Words like{" "}
          <em>unclear</em>, <em>confident</em>, and <em>problem</em> carry
          domain meanings here that differ from their affective valence in the
          lexicon. Treat the compound score as a descriptive summary of affective
          wording, never as a measure of learning, and report the hedging and
          certainty counts next to it, since epistemic stance is the more
          interpretable signal in explanations of confidence. Any claim made from
          this tab should be checked against the coded text in the qualitative
          tab.
        </p>
      </div>
    </>
  );
}
