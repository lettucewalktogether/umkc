/**
 * Parsing and aggregation for the instructor dashboard.
 *
 * Input is the CSV files students export from the evaluation and assessment
 * pages. Files are read in the browser; nothing is uploaded.
 */

import { parseCsvRecords } from "./csv";
import { criteria, type Criterion } from "./rubric";
import { domains, questions } from "./assessment";
import { mean, sd } from "./stats";

export type EvalRecord = {
  classCode: string;
  evaluator: string;
  team: string;
  date: string;
  scores: Record<string, number | null>;
  reasons: Record<string, string>;
  evidence: Record<string, string>;
  weightedTotal: number | null;
  strength: string;
  concern: string;
  recommendation: string;
  complete: boolean;
};

export type AssessmentRecord = {
  classCode: string;
  code: string;
  point: "Pre" | "Post" | "";
  team: string;
  date: string;
  ratings: (number | null)[];
  explanations: string[];
};

export type FileKind = "eval" | "assessment" | "unknown";

export function detectKind(text: string): FileKind {
  const first = text.slice(0, 4000);
  if (first.includes("Team evaluated")) return "eval";
  if (first.includes("Anonymous matching code")) return "assessment";
  return "unknown";
}

function num(value: string | undefined): number | null {
  if (value === undefined || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function parseEvalCsv(text: string): EvalRecord[] {
  return parseCsvRecords(text).map((r) => {
    const scores: Record<string, number | null> = {};
    const reasons: Record<string, string> = {};
    const evidence: Record<string, string> = {};
    for (const c of criteria) {
      scores[c.key] = num(r[`${c.name} - score (0-5)`]);
      reasons[c.key] = r[`${c.name} - primary reason`] ?? "";
      evidence[c.key] = r[`${c.name} - presentation evidence`] ?? "";
    }
    return {
      classCode: r["Class code"] ?? "",
      evaluator: r["Evaluator"] ?? "",
      team: r["Team evaluated"] ?? "",
      date: r["Date"] ?? "",
      scores,
      reasons,
      evidence,
      weightedTotal: num(r["Weighted total (of 100)"]),
      strength: r["One strength"] ?? "",
      concern: r["One concern or unresolved question"] ?? "",
      recommendation: r["Overall recommendation"] ?? "",
      complete: (r["Complete"] ?? "").toLowerCase() === "yes",
    };
  });
}

export function parseAssessmentCsv(text: string): AssessmentRecord[] {
  return parseCsvRecords(text).map((r) => {
    const ratings: (number | null)[] = [];
    const explanations: string[] = [];
    for (let i = 1; i <= questions.length; i++) {
      ratings.push(num(r[`Q${i} rating (1-7)`]));
      explanations.push(r[`Q${i} explanation`] ?? "");
    }
    const rawPoint = (r["Assessment point"] ?? "").trim();
    const point: AssessmentRecord["point"] =
      rawPoint === "Pre" || rawPoint === "Post" ? rawPoint : "";
    return {
      classCode: r["Class code"] ?? "",
      code: r["Anonymous matching code"] ?? "",
      point,
      team: r["Vendor Team"] ?? "",
      date: r["Date"] ?? "",
      ratings,
      explanations,
    };
  });
}

/** De-duplicates rows that arrive twice because a student exported twice. */
export function dedupeEval(records: EvalRecord[]): EvalRecord[] {
  const seen = new Map<string, EvalRecord>();
  for (const r of records) {
    const key = [
      r.classCode,
      r.evaluator.toLowerCase().trim(),
      r.team.toLowerCase().trim(),
      criteria.map((c) => r.scores[c.key]).join("|"),
    ].join("::");
    seen.set(key, r);
  }
  return [...seen.values()];
}

export function dedupeAssessment(
  records: AssessmentRecord[],
): AssessmentRecord[] {
  const seen = new Map<string, AssessmentRecord>();
  for (const r of records) {
    const key = [
      r.classCode,
      r.code.toLowerCase().trim(),
      r.point,
      r.ratings.join("|"),
    ].join("::");
    seen.set(key, r);
  }
  return [...seen.values()];
}

// ---------------------------------------------------------------------------
// Team aggregation
// ---------------------------------------------------------------------------

export type CriterionSummary = {
  criterion: Criterion;
  meanScore: number;
  sdScore: number;
  meanWeighted: number;
  n: number;
};

export type TeamSummary = {
  team: string;
  nEvaluations: number;
  nComplete: number;
  meanTotal: number;
  sdTotal: number;
  minTotal: number;
  maxTotal: number;
  byCriterion: CriterionSummary[];
  evaluators: string[];
  strengths: string[];
  concerns: string[];
  recommendations: string[];
};

export function summarizeTeams(records: EvalRecord[]): TeamSummary[] {
  const byTeam = new Map<string, EvalRecord[]>();
  for (const r of records) {
    const team = r.team.trim() || "(unnamed team)";
    if (!byTeam.has(team)) byTeam.set(team, []);
    byTeam.get(team)!.push(r);
  }

  const summaries: TeamSummary[] = [];
  for (const [team, rows] of byTeam) {
    const totals = rows
      .map((r) => r.weightedTotal)
      .filter((t): t is number => t !== null);

    summaries.push({
      team,
      nEvaluations: rows.length,
      nComplete: rows.filter((r) => r.complete).length,
      meanTotal: mean(totals),
      sdTotal: totals.length > 1 ? sd(totals) : NaN,
      minTotal: totals.length ? Math.min(...totals) : NaN,
      maxTotal: totals.length ? Math.max(...totals) : NaN,
      byCriterion: criteria.map((c) => {
        const scores = rows
          .map((r) => r.scores[c.key])
          .filter((s): s is number => s !== null);
        return {
          criterion: c,
          meanScore: mean(scores),
          sdScore: scores.length > 1 ? sd(scores) : NaN,
          meanWeighted: (mean(scores) / 5) * c.weight,
          n: scores.length,
        };
      }),
      evaluators: [...new Set(rows.map((r) => r.evaluator).filter(Boolean))],
      strengths: rows.map((r) => r.strength).filter(Boolean),
      concerns: rows.map((r) => r.concern).filter(Boolean),
      recommendations: rows.map((r) => r.recommendation).filter(Boolean),
    });
  }

  return summaries.sort((a, b) => (b.meanTotal || 0) - (a.meanTotal || 0));
}

// ---------------------------------------------------------------------------
// Pre/post matching
// ---------------------------------------------------------------------------

export type MatchedPair = {
  code: string;
  pre: AssessmentRecord;
  post: AssessmentRecord;
};

export type MatchResult = {
  pairs: MatchedPair[];
  preOnly: AssessmentRecord[];
  postOnly: AssessmentRecord[];
  /** Codes appearing more than once at the same assessment point. */
  duplicates: string[];
};

/** Matches pre to post responses on the anonymous code, case-insensitively. */
export function matchPrePost(records: AssessmentRecord[]): MatchResult {
  const pre = new Map<string, AssessmentRecord[]>();
  const post = new Map<string, AssessmentRecord[]>();

  for (const r of records) {
    const key = r.code.trim().toLowerCase();
    if (!key) continue;
    const target = r.point === "Pre" ? pre : r.point === "Post" ? post : null;
    if (!target) continue;
    if (!target.has(key)) target.set(key, []);
    target.get(key)!.push(r);
  }

  const duplicates = [
    ...new Set(
      [...pre.entries(), ...post.entries()]
        .filter(([, v]) => v.length > 1)
        .map(([k]) => k),
    ),
  ];

  const pairs: MatchedPair[] = [];
  const preOnly: AssessmentRecord[] = [];
  const postOnly: AssessmentRecord[] = [];

  for (const [key, rows] of pre) {
    const match = post.get(key);
    if (match) pairs.push({ code: key, pre: rows[0], post: match[0] });
    else preOnly.push(rows[0]);
  }
  for (const [key, rows] of post) {
    if (!pre.has(key)) postOnly.push(rows[0]);
  }

  return { pairs, preOnly, postOnly, duplicates };
}

/** Sum of a respondent's ratings across a domain, or null if any are missing. */
export function domainSum(
  record: AssessmentRecord,
  from: number,
  to: number,
): number | null {
  let total = 0;
  for (let i = from - 1; i <= to - 1; i++) {
    const r = record.ratings[i];
    if (r === null || r === undefined) return null;
    total += r;
  }
  return total;
}

export function overallSum(record: AssessmentRecord): number | null {
  return domainSum(record, 1, questions.length);
}

export { criteria, domains, questions };
