import Link from "next/link";
import { course } from "@/lib/course";

const scope: [string, string][] = [
  [
    "Defined QCR and selected residential screening activities.",
    "Production deployment in the City permitting system.",
  ],
  [
    "Public source materials and simulated test cases.",
    "Official code interpretation or permit approval.",
  ],
  [
    "Proposed process, workflow, and technology approach.",
    "Unattended decisions or automated applicant notices.",
  ],
  [
    "Optional demonstration or conceptual prototype.",
    "A requirement to build working production software.",
  ],
  [
    "Performance, cost, accounting, and governance assumptions.",
    "Use of information outside the public or simulation materials provided.",
  ],
];

const roles: [string, string][] = [
  ["Proposal coordinator", "Manages the complete response and submission requirements."],
  ["QCR workflow lead", "Analyzes the current process and the proposed future workflow."],
  [
    "Government accounting and cost lead",
    "Develops cost, milestone, invoice, acceptance, and accounting assumptions.",
  ],
  ["Technology and AI lead", "Explains the technical approach and the specific role of AI."],
  [
    "Governance and risk lead",
    "Addresses privacy, security, records, accessibility, ownership, portability, and accountability.",
  ],
  [
    "Presentation and evidence lead",
    "Coordinates slides, sources, demonstration materials, and question responses.",
  ],
];

const maturity: [string, string, string][] = [
  [
    "1. Baseline",
    "Written proposal, slide deck, 10-minute presentation, and 5-minute question period.",
    "Meets the minimum submission requirements.",
  ],
  [
    "2. Midrange",
    "All baseline requirements plus a relevant limited demonstration or mock-up.",
    "Provides additional evidence showing how part of the approach would work.",
  ],
  [
    "3. Top",
    "All baseline requirements plus a relevant conceptual prototype.",
    "Shows how the proposed future QCR workflow or solution would operate in practice.",
  ],
];

const slop = [
  "Generic language that could apply to any city or project.",
  "Restating the challenge without analyzing it.",
  "Unsupported claims about accuracy, cost, savings, or public benefit.",
  "Unverified or invented facts, policies, statistics, requirements, or technical conditions.",
  "Fabricated or irrelevant citations.",
  "Technical terms without an explanation of how the approach works.",
  "AI presented as the answer without analysis of the workflow.",
  "Long lists without priorities, decisions, evidence, or tradeoffs.",
  "Inconsistent costs, timelines, staffing, or technical assumptions.",
  "Material that team members cannot explain during questions.",
];

export default function Challenge() {
  return (
    <>
      <div className="pagehead">
        <p className="eyebrow">{course.unit}</p>
        <h1>Quality Control Review, and the role of AI</h1>
        <p className="lede">
          Students work in competing Vendor Teams and respond to the same
          City-issued Quality Control Review challenge. The number and size of
          teams is set by the professor based on class enrollment.
        </p>
      </div>

      <div className="panel">
        <span className="label">Central question</span>
        <p>
          How can the City solve the QCR and residential permitting challenge as
          efficiently and effectively as possible, and what role should AI play
          in that approach?
        </p>
      </div>

      <p>
        Each team must propose a complete approach. Teams should consider process
        changes, applicant guidance, submission requirements, staff procedures,
        training, data, workflow, ordinary technology, automation, and AI. AI is
        part of the assignment, but AI should not be treated as the answer to
        every part of the problem.
      </p>

      <h2>The problem</h2>
      <p>
        Quality Control Review is the initial completeness and quality check
        before a residential permit submission enters detailed technical review.
        The current process requires substantial manual work and may identify
        missing or inconsistent information later than desired. That creates
        repeated staff work, additional correction cycles for applicants, and
        longer review times.
      </p>
      <p>
        Each proposal must explain what should change, why the approach is
        appropriate, how City staff remain in control, how results will be
        measured, and which functions should use AI, ordinary technology, rules,
        process changes, or staff judgment.
      </p>

      <h3>Required outcomes</h3>
      <ol>
        <li>Help applicants understand what must be submitted.</li>
        <li>Identify missing, unreadable, or inconsistent material earlier.</li>
        <li>Apply approved intake requirements more consistently.</li>
        <li>
          Separate clear omissions from issues requiring professional judgment.
        </li>
        <li>
          Direct staff to the relevant document, page, drawing, detail, or
          requirement.
        </li>
        <li>Produce clear and traceable findings.</li>
        <li>
          Reduce repetitive work without creating excessive verification work.
        </li>
        <li>
          Preserve City responsibility for code interpretation and permit
          decisions.
        </li>
        <li>
          Measure effects on time, accuracy, resubmissions, workload, applicant
          clarity, and downstream rework.
        </li>
      </ol>

      <h3>Scope boundary</h3>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Included</th>
              <th>Excluded unless expressly stated</th>
            </tr>
          </thead>
          <tbody>
            {scope.map(([inc, exc]) => (
              <tr key={inc}>
                <td>{inc}</td>
                <td>{exc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Federal supporting material</h2>
      <p>
        Section 208 of H.R. 6644 provides federal policy context. The section
        recognizes shorter regulatory processes, increased permitting capacity,
        zoning reform, and other initiatives that reduce barriers to housing
        supply, and it emphasizes objective improvement in housing-supply
        growth.
      </p>
      <p>
        Use this material to explain how immediate QCR measures may connect to
        permitting capacity and later housing outcomes. Teams are not preparing a
        federal grant application and must not assume that the City has received
        or will receive federal funding.
      </p>
      <div className="panel warn">
        <span className="label">Accounting distinction</span>
        <p>
          Federal authorization is not the same as an appropriation, grant award,
          receivable, or local spending authority.
        </p>
        <p>
          Primary source:{" "}
          <a
            href="https://www.congress.gov/bill/119th-congress/house-bill/6644/text#H942E032183DE4D569D14C3EA9A789A81"
            rel="noreferrer"
          >
            H.R. 6644, 119th Congress &mdash; text of Section 208
          </a>
          .
        </p>
      </div>

      <h2>Student roles</h2>
      <p>
        The professor may combine or divide roles based on team size. Every
        student must make a documented contribution and must be able to explain
        the assigned work.
      </p>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Vendor Team role</th>
              <th>Responsibility</th>
            </tr>
          </thead>
          <tbody>
            {roles.map(([role, duty]) => (
              <tr key={role}>
                <td>
                  <strong>{role}</strong>
                </td>
                <td>{duty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>Evaluator role during presentations</h3>
      <ul>
        <li>Students do not score their own team under the presentation rubric.</li>
        <li>Students watching another team act as CPD evaluators.</li>
        <li>Evaluators use the same published rubric for every team.</li>
        <li>Evaluators submit individual scores before group discussion.</li>
        <li>Each score requires a reason and specific presentation evidence.</li>
        <li>
          The professor may exclude incomplete, unsupported, or competitively
          distorted evaluations.
        </li>
      </ul>
      <p>
        Students also separately evaluate participation and contributions within
        their own team. That group-work assessment is separate from the simulated
        vendor-selection score.
      </p>

      <h2>Written proposal</h2>
      <div className="panel warn">
        <span className="label">Hard milestone</span>
        <p>
          The written proposal and AI-use declaration are due one week before the
          presentation period, so the professor has time to review each
          team&rsquo;s approach and prepare questions.
        </p>
      </div>

      <div className="twocol">
        <div>
          <h3>Format</h3>
          <ul>
            <li>Maximum 20 pages.</li>
            <li>One searchable PDF.</li>
            <li>One-inch margins.</li>
            <li>Minimum 9-point Arial type.</li>
            <li>Single spacing is permitted.</li>
            <li>Page numbers are required.</li>
            <li>Cover page is excluded from the 20-page limit.</li>
            <li>The one-paragraph abstract counts toward the limit.</li>
            <li>
              Tables, diagrams, screenshots, citations, and mock-ups count toward
              the limit.
            </li>
            <li>The AI-use declaration is excluded from the limit.</li>
          </ul>
        </div>
        <div>
          <h3>Organization</h3>
          <ol>
            <li>One-paragraph abstract.</li>
            <li>Understanding of the issued QCR challenge.</li>
            <li>Proposed QCR workflow and service changes.</li>
            <li>
              Applicant guidance, staffing, training, data, process, and
              technology changes.
            </li>
            <li>
              Role of AI, and functions that remain staff-led, rules-based, or
              non-AI.
            </li>
            <li>Human review and City decision authority.</li>
            <li>Stage 1 work plan and deliverables.</li>
            <li>Performance measurement plan.</li>
            <li>Cost and government accounting assumptions.</li>
            <li>
              Privacy, security, accessibility, records, ownership, and
              portability.
            </li>
            <li>Risks, limitations, dependencies, and proposed next steps.</li>
          </ol>
        </div>
      </div>

      <h3>The one-paragraph abstract</h3>
      <p>
        The proposal must begin with a one-paragraph abstract stating the
        team&rsquo;s central thesis, the proposed approach, what makes the
        approach distinct, the specific role of AI, and why the approach should
        solve the issued QCR challenge. The abstract is the basis for the
        presentation and must be understandable without reading the rest of the
        proposal. Student evaluators receive the abstract and the slide deck.
      </p>

      <h3>How the proposal is used</h3>
      <p>
        The written proposal is reviewed by the professor but is not separately
        scored. It provides the factual and analytical basis for the slides,
        presentation, and questions; the professor evaluates the team through the
        presentation and question period. A team may not use the presentation to
        replace the proposal with a materially different approach.
      </p>

      <h2>Submission maturity levels</h2>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Level</th>
              <th>Required material</th>
              <th>Meaning</th>
            </tr>
          </thead>
          <tbody>
            {maturity.map(([level, material, meaning]) => (
              <tr key={level}>
                <td>
                  <strong>{level}</strong>
                </td>
                <td>{material}</td>
                <td>{meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        A demonstration or conceptual prototype does not automatically receive a
        higher score. The professor and student evaluators assess whether the
        additional material is relevant, accurate, usable, and supported. Working
        production software is not required.
      </p>

      <h2>Presentation</h2>
      <div className="panel warn">
        <span className="label">Hard milestone</span>
        <p>
          Final presentation slides must be submitted before the first team
          presents. Teams may not revise slides after viewing another
          presentation unless the professor gives the same opportunity to all
          teams.
        </p>
      </div>
      <ul>
        <li>Maximum 10 content slides.</li>
        <li>A title slide does not count toward the 10-slide limit.</li>
        <li>A reference slide does not count toward the 10-slide limit.</li>
        <li>
          Maximum total deck size is 12 slides: one title, up to 10 content, one
          reference.
        </li>
        <li>Slides must be submitted as a PDF.</li>
        <li>Presentation length is 10 minutes; the question period is 5 minutes.</li>
        <li>Every team member must participate.</li>
        <li>
          Any demonstration or prototype must fit within the 10-minute
          presentation.
        </li>
        <li>No backup slides beyond the permitted title, content, and reference slides.</li>
      </ul>
      <p>
        During the question period the professor may ask one common question of
        every team. Student evaluator questions must relate to the published{" "}
        <Link href={`${course.basePath}/rubric`}>rubric</Link>. Answers may
        clarify the submitted approach but may not replace it with a materially
        different approach.
      </p>

      <h2>Use of AI and academic quality</h2>
      <p>
        Students may use AI tools to support research, brainstorming, drafting,
        editing, data analysis, code, mock-ups, and presentations if the use
        follows course rules. AI use does not reduce the team&rsquo;s
        responsibility for accuracy, relevance, evidence, citations,
        calculations, and recommendations.
      </p>

      <h3>AI-use declaration</h3>
      <ul>
        <li>Name each AI tool used.</li>
        <li>Describe the purpose of each tool.</li>
        <li>
          Identify the proposal, slide, code, image, analysis, or demonstration
          material receiving material assistance.
        </li>
        <li>Describe the human review and revision performed.</li>
        <li>
          Identify how facts, sources, calculations, and citations were
          independently checked.
        </li>
        <li>
          Confirm that the team used only public information, simulation facts,
          and clearly labeled assumptions when using AI tools.
        </li>
      </ul>

      <h3>Avoiding AI slop</h3>
      <p>
        For this exercise, AI slop means generic, superficial, inaccurate,
        repetitive, or weakly supported AI-assisted content submitted without
        sufficient human analysis or review. Merriam-Webster defines AI slop as
        low-quality digital content produced, usually in quantity, by artificial
        intelligence. Research also notes that there is not yet one agreed
        technical definition, so this exercise evaluates observable quality
        &mdash; coherence, relevance, factual support, and responsiveness &mdash;
        rather than trying to detect whether AI wrote the text.
      </p>
      <ul>
        {slop.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p style={{ fontSize: "0.85rem", color: "var(--text-faint)" }}>
        Sources: Merriam-Webster,{" "}
        <a
          href="https://www.merriam-webster.com/dictionary/ai%20slop"
          rel="noreferrer"
        >
          &ldquo;AI slop&rdquo;
        </a>
        ; Shaib et al.,{" "}
        <a href="https://arxiv.org/abs/2509.19163" rel="noreferrer">
          &ldquo;Measuring AI Slop in Text,&rdquo; arXiv, 2025
        </a>
        .
      </p>

      <h2>Selection process</h2>
      <ol>
        <li>
          All teams submit proposals and AI-use declarations one week before
          presentations.
        </li>
        <li>All teams submit final slide decks before the first presentation.</li>
        <li>Each team presents for 10 minutes.</li>
        <li>Evaluators ask questions for 5 minutes.</li>
        <li>
          Students who are not presenting submit individual CPD evaluations
          before discussion.
        </li>
        <li>Students complete a separate own-team group-work assessment.</li>
        <li>
          The professor reviews scoring quality and may exclude incomplete or
          unsupported evaluations.
        </li>
        <li>
          The professor confirms the Winning Vendor using the presentation rubric
          and any evaluator weighting announced before presentations.
        </li>
      </ol>
      <p>
        The professor may revise the prize amount, distribution method, evaluator
        weighting, recognition categories, and tie-handling process as needed.
      </p>

      <nav className="pagenav">
        <Link href={`${course.basePath}/rubric`}>
          Next: how the presentation is scored &rarr;
        </Link>
      </nav>
    </>
  );
}
