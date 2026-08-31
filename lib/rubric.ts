/**
 * The presentation evaluation rubric, shared by the rubric reference page and
 * the /eval scoring tool so the two cannot drift apart.
 */

export type Criterion = {
  /** Stable key used in exported spreadsheet column names. */
  key: string;
  name: string;
  /** Percent of the total score. The six weights sum to 100. */
  weight: number;
  low: string;
  medium: string;
  high: string;
};

export const criteria: Criterion[] = [
  {
    key: "understanding",
    name: "Understanding of the issued challenge and proposed approach",
    weight: 20,
    low: "Misstates the challenge, responds to a different problem, assumes AI is the complete answer, or omits important workflow needs.",
    medium:
      "Generally understands the challenge and presents a plausible approach, but assumptions or links among process, people, data, technology, and AI remain incomplete.",
    high: "Accurately interprets the challenge, addresses the full QCR workflow, compares practical options, and gives AI a specific, justified role.",
  },
  {
    key: "performance",
    name: "Expected operational performance",
    weight: 20,
    low: "Offers little usable evidence or meaningful measurement and makes unsupported claims.",
    medium:
      "Provides reasonable measures and partial evidence, but important limits, errors, or assumptions remain.",
    high: "Defines credible measures for accuracy, misses, false positives, verification time, workload, resubmissions, and applicant clarity.",
  },
  {
    key: "staff_control",
    name: "Staff control and explainability",
    weight: 15,
    low: "Does not show how staff verify, change, reject, explain, or stop findings.",
    medium:
      "Includes some staff controls and source support, but use may be inconsistent or burdensome.",
    high: "Clearly preserves City authority and shows efficient verification, source references, uncertainty, correction, and escalation.",
  },
  {
    key: "workflow",
    name: "Workflow usefulness and adoption",
    weight: 15,
    low: "Poor fit, unclear outputs, added work, or little attention to users and exceptions.",
    medium:
      "Partial fit and plausible benefit, but notable manual work, exceptions, or training needs remain.",
    high: "Shows a practical workflow, reduced rework, clear outputs, staff usability, applicant benefit, and a sustainable operating approach.",
  },
  {
    key: "delivery",
    name: "Delivery, evidence, and presentation",
    weight: 15,
    low: "Work plan is weak, claims are unsupported, presentation is unclear, or the team cannot explain material content.",
    medium:
      "Most activities and evidence are present, but some milestones, dependencies, or explanations remain incomplete.",
    high: "Presents a clear, achievable plan; uses specific evidence; explains tradeoffs; and responds effectively to evaluator questions.",
  },
  {
    key: "cost_governance",
    name: "Cost, governance, and long-term practicality",
    weight: 15,
    low: "Costs, data, security, ownership, portability, dependencies, or future needs are materially unclear.",
    medium:
      "Most information is present, but important cost, control, or dependency questions remain.",
    high: "Clearly explains cost, accounting assumptions, data, controls, ownership, portability, support, dependencies, and long-term practicality.",
  },
];

export const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

export type Band = "low" | "medium" | "high";

export const bands: { band: Band; label: string; standardReason: string }[] = [
  {
    band: "low",
    label: "0-1 Low",
    standardReason:
      "Incomplete response; does not meet expectations; missing or mismatched attributes; poor detail; unsupported claims; other.",
  },
  {
    band: "medium",
    label: "2-3 Medium",
    standardReason:
      "Mostly complete response; partially meets expectations; partial fit; medium detail; partly supported claims; other.",
  },
  {
    band: "high",
    label: "4-5 High",
    standardReason:
      "Meets or exceeds expectations; strong fit; high detail; well-supported claims; other.",
  },
];

/** The standard reasons an evaluator may select, split out by score band. */
export const reasonsByBand: Record<Band, string[]> = {
  low: [
    "Incomplete response",
    "Does not meet expectations",
    "Missing or mismatched attributes",
    "Poor detail",
    "Unsupported claims",
    "Other",
  ],
  medium: [
    "Mostly complete response",
    "Partially meets expectations",
    "Partial fit",
    "Medium detail",
    "Partly supported claims",
    "Other",
  ],
  high: [
    "Meets or exceeds expectations",
    "Strong fit",
    "High detail",
    "Well-supported claims",
    "Other",
  ],
};

export function bandForScore(score: number): Band {
  if (score <= 1) return "low";
  if (score <= 3) return "medium";
  return "high";
}

/** Weighted points = score / 5 * weight, per the published rubric. */
export function weightedPoints(score: number, weight: number): number {
  return (score / 5) * weight;
}
