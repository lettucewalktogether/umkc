import Link from "next/link";
import EvalForm from "./EvalForm";
import { course } from "@/lib/course";
import { criteria, totalWeight } from "@/lib/rubric";

export const metadata = { title: "Score a Team" };

export default function Evaluate() {
  return (
    <>
      <div className="pagehead">
        <p className="eyebrow">CPD evaluator score sheet</p>
        <h1>Score a presentation</h1>
        <p className="lede">
          Score one team against the six published criteria, then export every
          evaluation you have entered as a spreadsheet for the professor to
          review. Weighted points are calculated for you as score &divide; 5
          &times; the criterion weight.
        </p>
      </div>

      <div className="panel">
        <span className="label">How this works</span>
        <p>
          Nothing is submitted over the network. Your entries stay in this
          browser, so finish a team, save it, and score the next one. When you
          are done, use <strong>Export all to spreadsheet</strong> and hand the
          CSV file to {course.instructor}. Opening it in Excel, Numbers, or
          Google Sheets gives one row per evaluation, with a column for every
          score, reason, and piece of evidence.
        </p>
        <p>
          This page carries no product analytics or session recording. The site
          counts page visits, but nothing you type here is measured, recorded,
          or transmitted.
        </p>
      </div>

      <div className="panel warn">
        <span className="label">Before you start</span>
        <p>
          Students do not score their own team. Every score requires a primary
          reason and specific presentation evidence, and individual scores are
          submitted before group discussion. The professor may exclude
          incomplete, unsupported, or competitively distorted evaluations.
        </p>
      </div>

      <p>
        The full criterion standards for each score band are on the{" "}
        <Link href={`${course.basePath}/rubric`}>rubric page</Link>; the standard
        for the band you pick also appears inline below as you score. The{" "}
        {criteria.length} criteria carry {totalWeight}% in total.
      </p>

      <EvalForm />

      <nav className="pagenav">
        <Link href={`${course.basePath}/rubric`}>&larr; Full rubric</Link>
        <Link href={course.basePath}>Challenge</Link>
      </nav>
    </>
  );
}
