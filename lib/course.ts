/**
 * Course metadata for the UMKC Government Accounting class section of
 * innovation.vercel.app. Values marked TBD are set by the instructor in the
 * course calendar and are intentionally not guessed here.
 */

export const course = {
  name: "Government Accounting",
  school: "University of Missouri-Kansas City",
  instructor: "Marsha Huber",
  instructorTitle: "Professor",
  unit: "Public AI Innovation Challenge",
  basePath: "/umkc/govtacctclass",
} as const;

/**
 * Identifier stamped onto every exported spreadsheet and used in export
 * filenames, so the instructor can tell which class and section a file came
 * from. Set NEXT_PUBLIC_CLASS_CODE in the Vercel project to change it; the
 * value below is the fallback.
 */
export const classCode =
  process.env.NEXT_PUBLIC_CLASS_CODE?.trim() || "UMKC-GOVTACCT-HUBER";

export type NavItem = {
  href: string;
  label: string;
};

/** The masthead sections. The challenge is the section home page. */
export const nav: NavItem[] = [
  { href: `${course.basePath}`, label: "Challenge" },
  { href: `${course.basePath}/rubric`, label: "Rubric" },
  { href: `${course.basePath}/accounting`, label: "Exercise" },
];

/** Source documents mirrored under /public for download. */
export const sourceDocs = [
  {
    href: "/umkc/govtacctclass/2026_0831_Kansas_City_Public_Innovation_Challenge_R2.docx",
    label: "Kansas City Public Innovation Challenge (R2)",
    note: "Challenge brief, roles, submission requirements, and rubric.",
  },
  {
    href: "/umkc/govtacctclass/2026_0831_Govt_Acct_Class_Pre_Post_Assessment_R1.docx",
    label: "Pre- and Post-Assessment (R1)",
    note: "Ten-question confidence instrument, with the instructor scoring section.",
  },
] as const;
