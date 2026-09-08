import Link from "next/link";
import Archive from "./Archive";
import { course } from "@/lib/course";

export const metadata = { title: "Archive" };

export default function ArchivePage() {
  return (
    <>
      <div className="pagehead">
        <p className="eyebrow">Instructor archive</p>
        <h1>Hidden submissions</h1>
        <p className="lede">
          Work hidden from the dashboard, grouped by cohort and instrument.
          Nothing here is deleted. Reactivate puts a cohort back on the
          dashboard exactly as it was.
        </p>
      </div>

      <Archive />

      <nav className="pagenav">
        <Link href={`${course.basePath}/dashboard`}>&larr; Dashboard</Link>
      </nav>
    </>
  );
}
