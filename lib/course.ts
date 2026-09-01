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
  unit: "Public Innovation Challenge",
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
  blurb: string;
  /** Whether the item appears in the masthead nav. Items set to false are
   * still linked from the "Start here" cards on the overview page. */
  inNav: boolean;
};

export const nav: NavItem[] = [
  {
    href: `${course.basePath}`,
    label: "Overview",
    blurb: "How the unit fits together, milestones, and what each student owes.",
    inNav: false,
  },
  {
    href: `${course.basePath}/references`,
    label: "References",
    blurb:
      "APA 7 entries for every statistical procedure, coding method, and external claim the site relies on.",
    inNav: false,
  },
  {
    href: `${course.basePath}/dashboard`,
    label: "Dashboard",
    blurb:
      "Instructor view. Load the exported spreadsheets to see how each team scored and how confidence changed.",
    inNav: false,
  },
  {
    href: `${course.basePath}/challenge`,
    label: "Challenge",
    blurb:
      "The issued Quality Control Review challenge, scope boundary, roles, and submission requirements.",
    inNav: true,
  },
  {
    href: `${course.basePath}/rubric`,
    label: "Rubric",
    blurb:
      "The six weighted criteria, score bands, and the evaluator score sheet used for every team.",
    inNav: true,
  },
  {
    href: `${course.basePath}/eval`,
    label: "Score a Team",
    blurb:
      "Fill in the evaluator score sheet on screen, with weighted totals calculated, and export every evaluation as a spreadsheet.",
    inNav: false,
  },
  {
    href: `${course.basePath}/assessment`,
    label: "Assessment",
    blurb:
      "Ten identical questions administered before and after the simulation, on a seven-point confidence scale. Fill in on screen and export, or print.",
    inNav: false,
  },
  {
    href: `${course.basePath}/accounting`,
    label: "Exercise",
    blurb:
      "The compressed post-selection procurement and government accounting sequence.",
    inNav: true,
  },
];

/** The subset of {@link nav} shown in the masthead. */
export const navBar: NavItem[] = nav.filter((item) => item.inNav);

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
