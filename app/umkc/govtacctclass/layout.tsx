import ClassNav from "./ClassNav";
import { course } from "@/lib/course";

export const metadata = {
  title: {
    default: "Government Accounting",
    template: "%s · Govt Accounting",
  },
  description:
    "Public Innovation Challenge unit for the UMKC Government Accounting class: the issued Quality Control Review challenge, presentation rubric, pre/post assessment, and government accounting exercise.",
};

export default function ClassLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ClassNav />
      <main>{children}</main>
      <footer className="sitefoot">
        <div className="masthead-inner">
          <span>
            {course.school} · {course.name} · {course.instructor}
          </span>
          <span>
            Academic simulation using public information. Not a City of Kansas
            City publication or solicitation.
          </span>
        </div>
      </footer>
    </>
  );
}
