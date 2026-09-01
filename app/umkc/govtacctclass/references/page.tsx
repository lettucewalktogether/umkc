import Link from "next/link";
import { course } from "@/lib/course";
import { doiUrl, primarySources, references } from "@/lib/references";

export const metadata = { title: "References" };

export default function References() {
  return (
    <>
      <div className="pagehead">
        <p className="eyebrow">Sources</p>
        <h1>References</h1>
        <p className="lede">
          Every analytic procedure this site reports, and every external claim it
          makes, names its source here in APA 7 form. Citations elsewhere on the
          site link to these entries.
        </p>
      </div>

      <div className="panel">
        <span className="label">Before you submit</span>
        <p>
          Confirm each entry against the publisher record. DOIs below resolve to
          the work cited, but pagination, edition, and author lists should be
          verified against the version you actually consulted, and anything you
          add to an analysis needs its own citation added here.
        </p>
      </div>

      <h2>Methods and statistics</h2>
      <ol className="reflist">
        {references.map((r) => (
          <li key={r.key} id={r.key}>
            <p className="refentry">
              {r.full}{" "}
              {doiUrl(r) && (
                <a href={doiUrl(r)} rel="noreferrer">
                  {r.doi ? `https://doi.org/${r.doi}` : r.url}
                </a>
              )}
            </p>
            <p className="refuse">{r.usedFor}</p>
          </li>
        ))}
      </ol>

      <h2>Primary sources in the challenge materials</h2>
      <ol className="reflist">
        {primarySources.map((r) => (
          <li key={r.key} id={r.key}>
            <p className="refentry">
              {r.full}{" "}
              {doiUrl(r) && (
                <a href={doiUrl(r)} rel="noreferrer">
                  {r.url}
                </a>
              )}
            </p>
            <p className="refuse">{r.usedFor}</p>
          </li>
        ))}
      </ol>

      <h2>Course materials</h2>
      <p>
        Cite the instruments themselves as unpublished course materials. Add the
        year and any revision designation the instructor assigns:
      </p>
      <ol className="reflist">
        <li>
          <p className="refentry">
            Huber, M. (2026). <em>Kansas City Public Innovation Challenge</em>{" "}
            [Unpublished course materials]. {course.name}, {course.school}.
          </p>
        </li>
        <li>
          <p className="refentry">
            Huber, M. (2026).{" "}
            <em>
              Public Innovation Challenge pre- and post-assessment
            </em>{" "}
            [Unpublished assessment instrument]. {course.name}, {course.school}.
          </p>
        </li>
      </ol>

      <nav className="pagenav">
        <Link href={course.basePath}>&larr; Challenge</Link>
      </nav>
    </>
  );
}
