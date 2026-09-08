import Link from "next/link";
import AssessmentForm from "./AssessmentForm";
import { course, sourceDocs } from "@/lib/course";
import { domains, scale } from "@/lib/assessment";

export const metadata = { title: "Assessment" };


export default function Assessment() {
  const assessmentDoc = sourceDocs[1];

  return (
    <>
      <div className="pagehead">
        <p className="eyebrow">Government Accounting class</p>
        <h1>Confidence assessment</h1>
        <p className="lede">
          Ten identical questions on government accounting, public-service
          process, vendor evaluation, and AI. The same questions are administered
          before and after the simulation, identified both times by your student
          ID.
        </p>
      </div>

      <div className="panel warn">
        <span className="label">Do not use AI</span>
        <p>
          Do not use Copilot, ChatGPT, Gemini, Claude, or any other AI system to
          draft, revise, summarize, or otherwise help complete this assessment.
          Complete it using only your own current knowledge and experience. Do
          not search online, consult course materials, compare answers with
          classmates, or ask another person to prepare a response.
        </p>
        <p>
          An uncertain or incomplete response is useful. The point is to
          record where you actually stand, not to be right.
        </p>
      </div>

      <div className="panel noprint">
        <span className="label">How to complete this</span>
        <p>
          Fill it in below, then use <strong>Submit to instructor</strong> with
          the class passcode your professor reads out. Your answers go straight
          to the instructor dashboard, so there is no file to hand in.
          Submitting again replaces what you sent, so a mistake can be
          corrected.
        </p>
        <p>
          Enter your student ID so your response can be identified.{" "}
          <strong>Export to spreadsheet</strong> is still there if you would
          rather hand in a file, or if submitting fails.
        </p>
        <p>
          You can also print this page for a paper copy, or download the{" "}
          <a href={assessmentDoc.href}>Word version</a>, which contains the
          instructor scoring section.
        </p>
        <p>
          This page carries no product analytics and no session recording.
        </p>
      </div>

      <h2>Seven-point confidence scale</h2>
      <p>
        For each question, select one confidence rating from 1 through 7 and
        write a short paragraph explaining the rating. The paragraph should show
        the basis for the rating by explaining the concept, giving an example,
        describing the steps you would take, or identifying what remains unclear.
      </p>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th className="num">Rating</th>
              <th>Meaning</th>
            </tr>
          </thead>
          <tbody>
            {scale.map(([n, , long, meaning]) => (
              <tr key={n}>
                <td className="num">
                  <strong>{n}</strong>
                </td>
                <td>
                  <strong>{long}:</strong> {meaning}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AssessmentForm />

      <h2>Instructor use: scoring and comparison</h2>
      <p className="noprint">
        Questions 1 through 4 measure government accounting and financial
        controls. Questions 5 through 8 measure government service, vendor
        response, presentation, and evaluation. Questions 9 and 10 measure AI
        understanding and responsible application.
      </p>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Domain</th>
              <th className="num">Questions</th>
              <th className="num">Possible score</th>
            </tr>
          </thead>
          <tbody>
            {domains.map((d) => (
              <tr key={d.name}>
                <td>{d.name}</td>
                <td className="num">
                  {d.from}-{d.to}
                </td>
                <td className="num">{d.possible}</td>
              </tr>
            ))}
            <tr>
              <td>Overall self-reported confidence</td>
              <td className="num">1-10</td>
              <td className="num">10-70</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The dashboard summarises every item and domain as responses arrive, and
        scans the written paragraphs for observable features such as concrete
        examples and references to records. Read the paragraphs themselves for
        accuracy: confidence is self-reported and is not by itself proof of
        knowledge.
      </p>
      <p className="noprint">
        Exported CSV files stack cleanly: each student&rsquo;s export is one row
        with the student ID, per-question ratings and paragraphs, and domain
        subtotals already calculated.
      </p>

      <nav className="pagenav">
        <Link href={course.basePath}>&larr; Challenge</Link>
        <Link href={`${course.basePath}/eval`}>Score a team &rarr;</Link>
      </nav>
    </>
  );
}
