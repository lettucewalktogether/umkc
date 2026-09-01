import Link from "next/link";
import { course } from "@/lib/course";

export const metadata = { title: "UMKC" };

export default function Umkc() {
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
          <p className="eyebrow">University of Missouri-Kansas City</p>
          <h1>UMKC course sections</h1>
        </div>
        <div className="cards">
          <Link href={course.basePath} className="card">
            <h3>Government Accounting</h3>
            <p>
              {course.instructor} · Public AI Innovation Challenge unit on Quality
              Control Review and residential permitting.
            </p>
          </Link>
        </div>
      </main>
    </>
  );
}
