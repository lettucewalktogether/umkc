/**
 * Automatic indicators over the open responses.
 *
 * These replace hand coding. They are deliberately *observable* features of
 * the text — does the response give an example, cite a record, quantify
 * anything, hedge, say outright that the writer does not know — and not
 * judgments of whether the answer is correct.
 *
 * That distinction matters. Whether a paragraph shows an accurate
 * understanding or a misconception is a reading of meaning, and no keyword
 * rule decides it reliably; asserting otherwise would put a confident label
 * on a student's work that nothing in the data supports. What is reported
 * here is what can be counted without interpretation.
 */

export type Feature = {
  key: string;
  label: string;
  definition: string;
  /** Plain reading of the share, given "N% of responses". */
  reading: (percent: number, count: number, total: number) => string;
  patterns: string[];
};

export const features: Feature[] = [
  {
    key: "example",
    label: "Concrete example",
    definition:
      "Introduces an instance or case rather than staying at the level of definition.",
    reading: (p, c, t) =>
      p >= 60
        ? `Most gave an actual example (${c} of ${t}).`
        : p >= 25
          ? `About a quarter to a half gave an example (${c} of ${t}); the rest stayed with definitions.`
          : `Few gave an example (${c} of ${t}). Most answered in the abstract.`,
    patterns: [
      "for example",
      "for instance",
      "e\\.g\\.",
      "such as",
      "in one case",
      "an example",
      "like when",
      "say a",
      "suppose",
      "imagine",
    ],
  },
  {
    key: "evidence",
    label: "Cites a record or control",
    definition:
      "Names a document, record, approval, or control of the kind the accounting sequence turns on.",
    reading: (p, c, t) =>
      p >= 50
        ? `Most named a document or control (${c} of ${t}).`
        : p >= 20
          ? `Some named a document or control (${c} of ${t}).`
          : `Almost none named a document or control (${c} of ${t}). Answers are not yet tied to the paperwork.`,
    patterns: [
      "invoice",
      "purchase order",
      "receipt",
      "ledger",
      "journal entry",
      "record",
      "document",
      "documentation",
      "report",
      "statement",
      "contract",
      "audit",
      "approval",
      "signature",
      "acceptance",
      "control",
      "log",
      "three-way match",
    ],
  },
  {
    key: "vocabulary",
    label: "Uses government accounting vocabulary",
    definition:
      "Uses at least one term specific to governmental accounting or procurement.",
    reading: (p, c, t) =>
      p >= 50
        ? `Most are using the subject's own terms (${c} of ${t}).`
        : p >= 20
          ? `Some are using the subject's own terms (${c} of ${t}).`
          : `Few used any government accounting term (${c} of ${t}). Expect everyday wording rather than the vocabulary.`,
    patterns: [
      "encumbrance",
      "encumber",
      "appropriation",
      "expenditure",
      "payable",
      "receivable",
      "accrual",
      "fund balance",
      "budget authority",
      "procurement",
      "requisition",
      "disbursement",
      "liability",
      "reconciliation",
      "obligation",
      "vendor",
      "solicitation",
      "quality control review",
      "qcr",
    ],
  },
  {
    key: "quantified",
    label: "Quantifies something",
    definition:
      "Contains a figure, amount, or percentage rather than only description.",
    reading: (p, c, t) =>
      p >= 40
        ? `Many put a figure or amount in (${c} of ${t}).`
        : `Few used any figure (${c} of ${t}); answers are mostly descriptive.`,
    patterns: ["\\$\\s?\\d", "\\d+\\s?%", "\\b\\d{2,}\\b", "percent"],
  },
  {
    key: "uncertainty",
    label: "States not knowing",
    definition:
      "Says outright that the writer cannot yet explain or apply the area.",
    reading: (p, c, t) =>
      p >= 30
        ? `A lot say plainly they do not know yet (${c} of ${t}). Worth reading these directly.`
        : p > 0
          ? `${c} of ${t} say plainly they do not know yet.`
          : "Nobody said outright that they do not know.",
    patterns: [
      "i don't know",
      "i do not know",
      "not sure",
      "no idea",
      "not familiar",
      "unsure",
      "never done",
      "never had",
      "cannot explain",
      "can't explain",
      "would need to look",
      "no experience",
    ],
  },
  {
    key: "hedged",
    label: "Hedged",
    definition:
      "Qualifies the claim with a hedge, which in this corpus tracks confidence more closely than affect does.",
    reading: (p, c, t) =>
      p >= 50
        ? `Most hedge their answers (${c} of ${t}), which usually means low confidence.`
        : p >= 20
          ? `Some hedge their answers (${c} of ${t}).`
          : `Little hedging (${c} of ${t}); answers are stated fairly firmly.`,
    patterns: [
      "maybe",
      "perhaps",
      "possibly",
      "might",
      "somewhat",
      "unclear",
      "i think",
      "i guess",
      "probably",
      "seems",
      "kind of",
      "sort of",
    ],
  },
  {
    key: "committed",
    label: "Stated with commitment",
    definition:
      "Asserts without hedging, using definite or capability language.",
    reading: (p, c, t) =>
      p >= 50
        ? `Most state things firmly (${c} of ${t}).`
        : p >= 20
          ? `Some state things firmly (${c} of ${t}).`
          : `Few state anything firmly (${c} of ${t}).`,
    patterns: [
      "definitely",
      "certainly",
      "clearly",
      "always",
      "must",
      "i know",
      "i can explain",
      "i can apply",
      "specifically",
      "precisely",
      "i understand",
    ],
  },
];

function compile(patterns: string[]): RegExp {
  // Word boundaries where the pattern is plain text; the few regex patterns
  // above already carry their own anchoring.
  const parts = patterns.map((p) =>
    /[\\$%]/.test(p) ? p : `\\b${p.replace(/[.*+?^${}()|[\]]/g, "\\$&")}\\b`,
  );
  return new RegExp(parts.join("|"), "gi");
}

const compiled = new Map<string, RegExp>(
  features.map((f) => [f.key, compile(f.patterns)]),
);

/** How many times each feature appears in one response. */
export function featureCounts(text: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const f of features) {
    const re = compiled.get(f.key)!;
    re.lastIndex = 0;
    out[f.key] = text ? (text.match(re)?.length ?? 0) : 0;
  }
  return out;
}

/** Which features a response shows at all. */
export function featurePresence(text: string): Record<string, boolean> {
  const counts = featureCounts(text);
  const out: Record<string, boolean> = {};
  for (const f of features) out[f.key] = counts[f.key] > 0;
  return out;
}

export function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}
