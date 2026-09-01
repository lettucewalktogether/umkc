import Link from "next/link";
import { course } from "@/lib/course";

export default function Home() {
  return (
    <>
      <header className="masthead">
        <div className="masthead-inner">
          <Link href="/" className="wordmark">
            Public AI Innovation Challenge
          </Link>
        </div>
      </header>
      <main>
        <div className="pagehead">
          <p className="eyebrow">Course simulations</p>
          <h1>Public AI Innovation Challenge</h1>
          <p className="lede">
            Classroom simulations in which student teams respond to a real
            public-sector problem, then evaluate one another under a published
            rubric.
          </p>
        </div>

        <div className="cards">
          <Link href={course.basePath} className="card">
            <h3>UMKC · Government Accounting</h3>
            <p>
              The Kansas City Quality Control Review challenge, run with{" "}
              {course.instructor}. Challenge brief, rubric, pre/post assessment,
              and the government accounting exercise.
            </p>
          </Link>
        </div>
      </main>
      <footer className="sitefoot">
        <div className="masthead-inner">
          <span>
            Academic simulation. Not a City of Kansas City publication or
            solicitation.
          </span>
        </div>
      </footer>
    </>
  );
}
