/**
 * The pre/post confidence instrument, shared by the assessment page and its
 * interactive form.
 */

/**
 * The source instrument uses a long label in the scale key and a short label in
 * each question's checkbox row, so both are carried here: [rating, short, long,
 * meaning].
 */
export const scale: [number, string, string, string][] = [
  [
    1,
    "Not at all",
    "Not at all confident",
    "I cannot yet explain or apply this area.",
  ],
  [
    2,
    "Minimal",
    "Minimally confident",
    "I recognize a few terms or ideas but need substantial assistance.",
  ],
  [
    3,
    "Slight",
    "Slightly confident",
    "I understand parts of the area but cannot apply them consistently.",
  ],
  [
    4,
    "Moderate",
    "Moderately confident",
    "I can explain and apply the basics with some support.",
  ],
  [
    5,
    "Confident",
    "Confident",
    "I can explain and apply the area in familiar situations.",
  ],
  [
    6,
    "Very",
    "Very confident",
    "I can apply the area in most situations and support my judgment.",
  ],
  [
    7,
    "Highly",
    "Highly confident",
    "I can explain, apply, and defend a judgment using specific evidence.",
  ],
];

export const questions: { stem: string; prompt: string }[] = [
  {
    stem: "I can explain the difference among vendor selection, contract execution, purchase-order issuance, deliverable acceptance, recognition of an expenditure and payable, invoice approval, and payment.",
    prompt:
      "Explain when you believe the City has a financial obligation and identify any part of the sequence that remains unclear.",
  },
  {
    stem: "I can identify the documents, approvals, and internal controls the City would need before authorizing a vendor to begin work and before paying the vendor.",
    prompt:
      "Describe the records you would expect to review, including the agreement, funding confirmation, purchase order, acceptance record, invoice, and payment approval.",
  },
  {
    stem: "I can develop and explain credible cost, pricing, licensing, staffing, and payment assumptions for a public-sector vendor proposal.",
    prompt:
      "Describe the financial information a Vendor Team should provide and explain how the City could identify unclear, incomplete, or potentially costly assumptions.",
  },
  {
    stem: "I can distinguish a limited feasibility or professional-service cost from later implementation costs that may require a different fund-level or government-wide accounting analysis.",
    prompt:
      "Explain what facts you would need before deciding whether a permitting-modernization cost is a current expenditure or may require another accounting treatment.",
  },
  {
    stem: "I can analyze a government service workflow by identifying its steps, roles, decisions, handoffs, delays, exceptions, and effects on applicants and staff.",
    prompt:
      "Using Quality Control Review, or QCR, as an example, describe what you would need to understand before proposing a change.",
  },
  {
    stem: "I can compare process, guidance, staffing, training, data, rules-based technology, automation, and AI options without assuming that one tool is the complete solution.",
    prompt:
      "Explain how a Vendor Team should determine which parts of the QCR problem require process changes, staff judgment, ordinary technology, or AI.",
  },
  {
    stem: "I can evaluate a vendor presentation using published criteria, assign a score, identify the primary reason for the score, and cite specific evidence.",
    prompt:
      "Explain what makes an evaluation fair, consistent, and supported, and identify the types of comments that would be insufficient.",
  },
  {
    stem: "I can present and defend a vendor proposal that has a clear thesis, responds to the issued QCR challenge, and remains consistent with the written proposal.",
    prompt:
      "Describe what evidence should appear in the presentation and how the team should respond when evaluators question an assumption, cost, risk, or performance claim.",
  },
  {
    stem: "I can explain what AI can and cannot do and identify the specific role AI should play within a broader QCR improvement approach.",
    prompt:
      "Give one QCR function for which AI may be useful and one function that should remain staff-led, rules-based, or addressed through another method. Explain why.",
  },
  {
    stem: "I can evaluate an AI-assisted government proposal for performance, human oversight, privacy, security, records, accessibility, cost, ownership, portability, third-party dependence, and long-term practicality.",
    prompt:
      "Identify the evidence or vendor information you would need before recommending that the City proceed, revise the approach, test further, or stop.",
  },
];

export type Domain = {
  name: string;
  /** Inclusive 1-based question range. */
  from: number;
  to: number;
  possible: string;
};

export const domains: Domain[] = [
  {
    name: "Government accounting and financial controls",
    from: 1,
    to: 4,
    possible: "4-28",
  },
  {
    name: "Government service, vendor response, and evaluation",
    from: 5,
    to: 8,
    possible: "4-28",
  },
  {
    name: "AI understanding and responsible application",
    from: 9,
    to: 10,
    possible: "2-14",
  },
];
