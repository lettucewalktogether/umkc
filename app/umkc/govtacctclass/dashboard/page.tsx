import Link from "next/link";
import Dashboard from "./Dashboard";
import { logout } from "./actions";
import { classCode, course } from "@/lib/course";

export const metadata = { title: "Instructor Dashboard" };

export default function DashboardPage() {
  return (
    <>
      <div className="pagehead">
        <p className="eyebrow">Instructor dashboard · {classCode}</p>
        <h1>Class results</h1>
        <p className="lede">
          Load the spreadsheets your students exported to see how each team
          scored and how confidence changed between the pre- and
          post-assessment, with the statistics reported the way a paper would
          report them.
        </p>
      </div>

      <Dashboard />

      <nav className="pagenav">
        <Link href={course.basePath}>&larr; Course overview</Link>
        <Link href={`${course.basePath}/references`}>References</Link>
        <form action={logout}>
          <button type="submit">Sign out</button>
        </form>
      </nav>
    </>
  );
}
