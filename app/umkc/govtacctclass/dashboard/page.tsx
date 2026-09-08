import Link from "next/link";
import Dashboard from "./Dashboard";
import { logout } from "./actions";
import { classCode, course, referencesPath } from "@/lib/course";

export const metadata = { title: "Instructor Dashboard" };

export default function DashboardPage() {
  return (
    <>
      <div className="pagehead">
        <p className="eyebrow">Instructor dashboard · {classCode}</p>
        <h1>Class results</h1>
        <p className="lede">
          Two separate instruments, reported separately. The{" "}
          <strong>class assessment</strong> measures confidence in government
          accounting and government process before and after the unit; the{" "}
          <strong>presentation evaluations</strong> record how teams scored
          under the rubric. Submissions arrive here on their own, with the
          statistics reported the way a paper would report them.
        </p>
      </div>

      <Dashboard />

      <nav className="pagenav">
        <Link href={course.basePath}>&larr; Challenge</Link>
        <Link href={referencesPath}>References</Link>
        <form action={logout}>
          <button type="submit">Sign out</button>
        </form>
      </nav>
    </>
  );
}
