import Link from "next/link";
import { course } from "@/lib/course";
import { bands, criteria, totalWeight } from "@/lib/rubric";

export const metadata = { title: "Rubric" };

export default function Rubric() {
  return (
    <>
      <div className="pagehead">
        <p className="eyebrow">Presentation evaluation</p>
        <h1>Rubric and evaluator score sheet</h1>
        <p className="lede">
          The professor and students acting as CPD evaluators use this rubric for
          the slide deck, oral presentation, demonstration or prototype if
          provided, and question responses. The same rubric applies to every
          team.
        </p>
      </div>

      <div className="panel">
        <span className="label">How a score becomes points</span>
        <p>
          Weighted points = score &divide; 5 &times; the criterion weight. Every
          score requires a primary reason and specific evidence. Student
          evaluators also identify one strength, one concern or unresolved
          question, and an overall recommendation.
        </p>
      </div>

      <h2>Weights</h2>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Criterion</th>
              <th className="num">Weight</th>
            </tr>
          </thead>
          <tbody>
            {criteria.map((c) => (
              <tr key={c.key}>
                <td>{c.name}</td>
                <td className="num">{c.weight}%</td>
              </tr>
            ))}
            <tr>
              <td>
                <strong>Total</strong>
              </td>
              <td className="num">
                <strong>{totalWeight}%</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Score bands and required reasons</h2>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Score</th>
              <th>Standard reason</th>
            </tr>
          </thead>
          <tbody>
            {bands.map((b) => (
              <tr key={b.band}>
                <td className="num">
                  <strong>{b.label}</strong>
                </td>
                <td>{b.standardReason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Criterion standards</h2>
      {criteria.map((c) => (
        <section key={c.key}>
          <h3>
            {c.name} ({c.weight}%)
          </h3>
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Score</th>
                  <th>Presentation standard</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="num">0-1 Low</td>
                  <td>{c.low}</td>
                </tr>
                <tr>
                  <td className="num">2-3 Medium</td>
                  <td>{c.medium}</td>
                </tr>
                <tr>
                  <td className="num">4-5 High</td>
                  <td>{c.high}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <h2>Evaluator score sheet</h2>
      <p className="noprint">
        Print this page to use the sheet on paper. One sheet per team you
        evaluate, submitted before group discussion.
      </p>
      <div className="headerfields tablewrap">
        <table>
          <tbody>
            <tr>
              <th style={{ width: "30%" }}>Team evaluated</th>
              <td>&nbsp;</td>
            </tr>
            <tr>
              <th>Evaluator</th>
              <td>&nbsp;</td>
            </tr>
            <tr>
              <th>Date</th>
              <td>&nbsp;</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Criterion</th>
              <th className="num">Weight</th>
              <th className="num">Score</th>
              <th>Primary reason</th>
              <th>Presentation evidence</th>
            </tr>
          </thead>
          <tbody>
            {criteria.map((c) => (
              <tr key={c.key}>
                <td>{c.name}</td>
                <td className="num">{c.weight}%</td>
                <td className="num">[0-5]</td>
                <td>[SELECT]</td>
                <td>[SPECIFIC OBSERVATION]</td>
              </tr>
            ))}
            <tr>
              <td>
                <strong>Total</strong>
              </td>
              <td className="num">100%</td>
              <td className="num">[CALCULATE]</td>
              <td colSpan={2}>&nbsp;</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Required narrative</h3>
      <div className="tablewrap">
        <table>
          <tbody>
            <tr>
              <th style={{ width: "30%" }}>One strength</th>
              <td style={{ height: "3.2rem" }}>&nbsp;</td>
            </tr>
            <tr>
              <th>One concern or unresolved question</th>
              <td style={{ height: "3.2rem" }}>&nbsp;</td>
            </tr>
            <tr>
              <th>Overall recommendation</th>
              <td style={{ height: "3.2rem" }}>&nbsp;</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="panel warn">
        <span className="label">Evaluation integrity</span>
        <p>
          Students do not score their own team. Individual scores are submitted
          before group discussion. The professor reviews scoring quality and may
          exclude incomplete, unsupported, or competitively distorted
          evaluations.
        </p>
      </div>

      <nav className="pagenav">
        <Link href={`${course.basePath}/challenge`}>
          &larr; The issued challenge
        </Link>
        <Link href={`${course.basePath}/accounting`}>
          The accounting exercise &rarr;
        </Link>
      </nav>
    </>
  );
}
