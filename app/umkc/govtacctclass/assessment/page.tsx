import Link from "next/link";
import AssessmentForm from "./AssessmentForm";
import { course, sourceDocs } from "@/lib/course";
import { domains, scale } from "@/lib/assessment";

export const metadata = { title: "Pre/Post Assessment" };

export default function Assessment() {
  const assessmentDoc = sourceDocs[1];

  return (
    <>
      <div className="pagehead">
        <p className="eyebrow">Government Accounting class</p>
        <h1>Pre- and post-assessment</h1>
        <p className="lede">
          Ten identical questions on government accounting, public-service
          process, vendor evaluation, and AI. The same questions are administered
          before and after the simulation, using the same anonymous matching
          code.
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
          An uncertain or incomplete response is useful, especially on the
          pre-assessment. The point is to measure change, not to be right the
          first time.
        </p>
      </div>

      <div className="panel noprint">
        <span className="label">How to complete this</span>
        <p>
          Fill it in below and use <strong>Export to spreadsheet</strong> to
          produce a CSV file to hand in. Nothing is sent over the network &mdash;
          your answers stay in this browser, so you can complete the
          pre-assessment now and return to the same browser for the
          post-assessment, and one export will then carry both rows for matching.
        </p>
        <p>
          You can also print this page for a paper copy, or download the{" "}
          <a href={assessmentDoc.href}>Word version</a>, which contains the
          instructor scoring section.
        </p>
        <p>
          This page carries no product analytics or session recording. The site
          counts page visits, but nothing you type here is measured, recorded,
          or transmitted.
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
        Recommended analysis: match pre- and post-responses using the anonymous
        code; calculate change for every item and domain; and review the
        paragraphs for accurate understanding, applied examples, evidence-based
        judgment, misconceptions, and remaining questions. Report confidence
        changes and qualitative findings together. Confidence is self-reported
        and should not be treated by itself as proof of knowledge.
      </p>
      <p>
        Suggested qualitative coding categories: accurate understanding; partial
        understanding; misconception; applied example; evidence-based judgment;
        remaining question; and change attributed to a specific simulation
        activity.
      </p>
      <p className="noprint">
        Exported CSV files stack cleanly: each student&rsquo;s export is one row
        per response, with the matching code, assessment point, per-question
        ratings and paragraphs, and domain subtotals already calculated. Paste
        them into one sheet and sort by matching code to place each
        student&rsquo;s pre and post rows together.
      </p>

      <nav className="pagenav">
        <Link href={course.basePath}>&larr; Challenge</Link>
        <Link href={`${course.basePath}/eval`}>Score a team &rarr;</Link>
      </nav>
    </>
  );
}
