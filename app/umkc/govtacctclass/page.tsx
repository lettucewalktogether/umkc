import Link from "next/link";
import { course, nav, sourceDocs } from "@/lib/course";

export default function Overview() {
  return (
    <>
      <div className="pagehead">
        <p className="eyebrow">
          {course.school} · {course.name}
        </p>
        <h1>Public Innovation Challenge</h1>
        <p className="lede">
          How can the City improve Quality Control Review, and what role should
          AI play? Student Vendor Teams answer the same City-issued challenge,
          then score one another as simulated City Planning and Development
          evaluators.
        </p>
      </div>

      <div className="panel">
        <span className="label">Public-information boundary</span>
        <p>
          This is an academic simulation built on public information, simplified
          challenge materials, and team assumptions. Teams must clearly
          distinguish City-provided challenge facts, publicly sourced facts,
          team assumptions, illustrative estimates, and proposed future
          conditions.
        </p>
      </div>

      <h2>Start here</h2>
      <div className="cards">
        {nav
          .filter((item) => item.href !== course.basePath)
          .map((item) => (
            <Link key={item.href} href={item.href} className="card">
              <h3>{item.label}</h3>
              <p>{item.blurb}</p>
            </Link>
          ))}
      </div>

      <h2>What every student owes</h2>
      <p>
        Every student has two roles. Each student contributes to a Vendor Team
        proposal and presentation, and each student acts as a simulated City
        Planning and Development evaluator while watching other teams present.
      </p>
      <div className="twocol">
        <div>
          <h3>As a Vendor Team member</h3>
          <ul>
            <li>A documented contribution to the written proposal.</li>
            <li>A speaking part in the team&rsquo;s 10-minute presentation.</li>
            <li>
              The ability to explain the assigned work during the 5-minute
              question period.
            </li>
            <li>A share of the team&rsquo;s AI-use declaration.</li>
          </ul>
        </div>
        <div>
          <h3>As a CPD evaluator</h3>
          <ul>
            <li>
              An individual score for every other team, submitted before group
              discussion.
            </li>
            <li>A primary reason and specific evidence for each score.</li>
            <li>One strength, one concern, and an overall recommendation.</li>
            <li>
              A separate own-team group-work assessment, which does not affect
              the vendor-selection score.
            </li>
          </ul>
        </div>
      </div>

      <h2>Milestones</h2>
      <p>
        Dates are set by {course.instructor} in the course calendar. The
        sequence and the hard cutoffs below do not change.
      </p>
      <ul className="milestones">
        <li>
          <strong>
            Pre-assessment <span className="tbd">date TBD</span>
          </strong>
          <span>
            Ten questions, completed individually without AI or outside sources.
            Record your anonymous matching code and keep it.
          </span>
        </li>
        <li>
          <strong>
            Teams and roles assigned <span className="tbd">date TBD</span>
          </strong>
          <span>
            Number and size of Vendor Teams are set based on class enrollment.
          </span>
        </li>
        <li>
          <strong>
            Written proposal and AI-use declaration due &mdash; one week before
            presentations
          </strong>
          <span>
            Hard milestone. One searchable PDF, 20 pages maximum. The professor
            reviews each approach and prepares questions.
          </span>
        </li>
        <li>
          <strong>
            Final slide decks due &mdash; before the first team presents
          </strong>
          <span>
            Hard milestone. PDF, 12 slides maximum. No revisions after watching
            another team unless the same opportunity is given to all teams.
          </span>
        </li>
        <li>
          <strong>
            Presentations <span className="tbd">dates TBD</span>
          </strong>
          <span>
            10 minutes presenting, 5 minutes of questions. Non-presenting
            students submit CPD evaluations before discussion.
          </span>
        </li>
        <li>
          <strong>
            Winning Vendor confirmed <span className="tbd">date TBD</span>
          </strong>
          <span>
            The professor confirms the selection using the presentation rubric
            and any evaluator weighting announced beforehand.
          </span>
        </li>
        <li>
          <strong>
            Post-assessment <span className="tbd">date TBD</span>
          </strong>
          <span>
            The same ten questions, same matching code, so change can be
            measured per item and per domain.
          </span>
        </li>
        <li>
          <strong>
            Compressed post-selection exercise (optional){" "}
            <span className="tbd">dates TBD</span>
          </strong>
          <span>
            The selected team works a short contract and government accounting
            exercise; other teams act as City reviewers.
          </span>
        </li>
      </ul>

      <h2>Why a government accounting class runs a vendor simulation</h2>
      <p>
        The challenge is a procurement, and a procurement is where accounting
        judgment actually gets made. The sequence from vendor selection to
        payment is the spine of the unit: selection creates no liability, the
        purchase order creates an encumbrance, acceptance drives recognition of
        an expenditure and payable, and only then does cash move. The QCR
        problem supplies the facts that make those questions concrete rather
        than definitional.
      </p>
      <p>
        The assessment measures three domains: government accounting and
        financial controls, government service and vendor evaluation, and AI
        understanding and responsible application.
      </p>

      <h2>Course documents</h2>
      <ul className="doclinks">
        {sourceDocs.map((doc) => (
          <li key={doc.href}>
            <a href={doc.href}>{doc.label}</a>
            <span className="note">{doc.note}</span>
          </li>
        ))}
      </ul>

      <div className="panel warn">
        <span className="label">Prize and stipend</span>
        <p>
          The default classroom plan is a $500 prize for the team confirmed as
          the Winning Vendor, subject to UMKC requirements. That classroom prize
          is separate from the fictional $20,000 Stage 1 stipend used in the
          simulation, and it does not fund any actual City work.
        </p>
      </div>
    </>
  );
}
