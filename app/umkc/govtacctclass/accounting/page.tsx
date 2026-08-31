import Link from "next/link";
import { course } from "@/lib/course";

export const metadata = { title: "Accounting Exercise" };

const events: [string, string][] = [
  ["Vendor selection", "Why does selection alone create no liability?"],
  [
    "Contract and purchase order",
    "When is the fictional $20,000 encumbrance recorded?",
  ],
  [
    "Notice to proceed",
    "What work is authorized and what controls must be complete?",
  ],
  [
    "Deliverable acceptance",
    "When should an expenditure and payable be recognized?",
  ],
  ["Invoice approval", "What documents should be matched before payment?"],
  ["Payment", "How are cash and the payable affected?"],
  [
    "Possible Stage 2",
    "Why does discussion of later work create no liability without a new agreement?",
  ],
];

const postSelection = [
  "Revise the Stage 1 work plan.",
  "Identify milestone deliverables and acceptance criteria.",
  "Respond to selected contract and AI terms.",
  "Prepare one sample milestone package.",
  "Prepare an illustrative invoice.",
  "Provide acceptance support and proposed accounting treatment.",
];

const groupWork = [
  "Attendance and preparation.",
  "Completion of assigned work.",
  "Accuracy and quality.",
  "Contribution to the written proposal.",
  "Contribution to the presentation.",
  "Responsiveness to teammates.",
  "Responsible and disclosed use of AI.",
  "Ability to explain assigned work.",
];

export default function Accounting() {
  return (
    <>
      <div className="pagehead">
        <p className="eyebrow">Compressed post-selection exercise</p>
        <h1>Government accounting exercise</h1>
        <p className="lede">
          The class compresses activities that would take much longer in an
          actual government procurement. The selected team does not complete a
          literal 45-day implementation; it completes a short contract and
          government accounting exercise instead.
        </p>
      </div>

      <div className="panel">
        <span className="label">Who does what</span>
        <p>
          The selected team works the vendor side. Students from other teams act
          as City reviewers during the acceptance and payment exercise. Both
          exercises below are optional at the professor&rsquo;s discretion.
        </p>
      </div>

      <h2>The selected team&rsquo;s work</h2>
      <ol>
        {postSelection.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>

      <h2>Event sequence and the question at each step</h2>
      <p>
        This is the spine of the unit. Each row is a point in the procurement
        where an accounting judgment has to be made, and the question is the one
        City reviewers should be able to answer with reference to records rather
        than intuition.
      </p>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Student accounting question</th>
            </tr>
          </thead>
          <tbody>
            {events.map(([event, question]) => (
              <tr key={event}>
                <td>
                  <strong>{event}</strong>
                </td>
                <td>{question}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel warn">
        <span className="label">Two amounts, kept separate</span>
        <p>
          The <strong>fictional $20,000 Stage 1 stipend</strong> is the
          simulation&rsquo;s contract amount and the basis for the encumbrance,
          invoice, and acceptance work above. The <strong>$500 classroom
          prize</strong> for the Winning Vendor is a course matter, subject to
          UMKC requirements, and does not fund any actual City work. Do not mix
          them in any accounting answer.
        </p>
      </div>

      <div className="panel warn">
        <span className="label">Authorization is not appropriation</span>
        <p>
          Section 208 of H.R. 6644 supplies federal policy context only. Federal
          authorization is not the same as an appropriation, grant award,
          receivable, or local spending authority, and no team may assume the
          City has received or will receive federal funding.
        </p>
      </div>

      <h2>Own-team group-work assessment</h2>
      <p>
        Each student separately evaluates contributions within the student&rsquo;s
        own team. This assessment may inform individual course grades but does
        not affect the simulated CPD vendor-selection score.
      </p>
      <ul>
        {groupWork.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h2>Instructor administration notes</h2>
      <ul>
        <li>Set the number and size of Vendor Teams.</li>
        <li>Set the exact submission and presentation dates in the course calendar.</li>
        <li>Announce evaluator weighting before presentations.</li>
        <li>
          Confirm whether the $500 prize and distribution method are available
          under UMKC requirements.
        </li>
        <li>
          Provide all teams the same public challenge materials and written
          clarifications.
        </li>
        <li>
          Review proposals one week before presentations and prepare common
          questions.
        </li>
        <li>
          Separate group-work peer assessment from vendor-selection scoring.
        </li>
        <li>
          Retain the flexibility to revise administrative details while applying
          the same rules to all teams.
        </li>
      </ul>

      <nav className="pagenav">
        <Link href={`${course.basePath}/rubric`}>&larr; Rubric</Link>
        <Link href={`${course.basePath}/assessment`}>
          Pre/post assessment &rarr;
        </Link>
      </nav>
    </>
  );
}
