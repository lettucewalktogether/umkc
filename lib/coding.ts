/**
 * Codebook for the deductive content analysis of the open responses.
 *
 * The categories are the ones the assessment instrument itself specifies, so
 * the coding frame is fixed in advance rather than derived from the data
 * (Elo & Kyngäs, 2008). Codes are not mutually exclusive: one paragraph can
 * show an applied example and a misconception at once.
 */

export type Code = {
  key: string;
  label: string;
  definition: string;
};

export const codebook: Code[] = [
  {
    key: "accurate",
    label: "Accurate understanding",
    definition:
      "States the concept correctly, with the distinctions the item calls for intact.",
  },
  {
    key: "partial",
    label: "Partial understanding",
    definition:
      "Gets part of the concept right but omits or blurs a distinction the item asks for.",
  },
  {
    key: "misconception",
    label: "Misconception",
    definition:
      "States something incorrect about the concept, process, or accounting treatment.",
  },
  {
    key: "applied",
    label: "Applied example",
    definition:
      "Gives a concrete instance, procedure, or worked case rather than a definition alone.",
  },
  {
    key: "evidence",
    label: "Evidence-based judgment",
    definition:
      "Reaches a judgment and grounds it in a document, record, control, measure, or observation.",
  },
  {
    key: "question",
    label: "Remaining question",
    definition:
      "Names something the respondent still does not know or cannot yet do.",
  },
  {
    key: "attributed",
    label: "Change attributed to a simulation activity",
    definition:
      "Credits a specific activity in the simulation with the respondent's change in understanding.",
  },
];

export const codebookMap: Record<string, Code> = Object.fromEntries(
  codebook.map((c) => [c.key, c]),
);

/** Unit of analysis: one respondent's paragraph on one item at one point. */
export type Unit = {
  id: string;
  code: string;
  point: "Pre" | "Post";
  question: number;
  text: string;
};

/** codes[unitId][coder] = set of applied code keys. */
export type Coding = Record<string, Record<string, string[]>>;
