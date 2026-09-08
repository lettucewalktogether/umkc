import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, isValidSession, safeEqual } from "@/lib/auth";
import { detectKind, parseEvalCsv } from "@/lib/dashboard";
import { parseCsv, toCsv } from "@/lib/csv";
import { cohortForDate, segment, UNASSIGNED_COHORT } from "@/lib/cohorts";
import {
  isKind,
  isStage,
  listSubmissions,
  moveSubmissions,
  putSubmission,
  readCohorts,
  type Stage,
} from "@/lib/submissions";

/**
 * Student submissions for both instruments.
 *
 * POST takes the same CSV the page exports, gated by the shared class
 * passcode, and files it under the cohort whose window covers today. Storing
 * the export verbatim keeps one parsing path in the dashboard.
 *
 * GET returns one stage to a signed-in instructor. PATCH moves submissions
 * between stages. There is no destructive operation: the archive's "delete"
 * is a move to the deep stage.
 */

export const runtime = "nodejs";
// Submissions must be readable immediately after they are written.
export const dynamic = "force-dynamic";

const MAX_BYTES = 512 * 1024;

function classPasscode(): string | null {
  const value = process.env.STUDENT_PASSCODE?.trim();
  return value ? value : null;
}

async function requireInstructor(): Promise<boolean> {
  const store = await cookies();
  return isValidSession(store.get(SESSION_COOKIE)?.value);
}

export async function POST(request: Request) {
  const passcode = classPasscode();
  if (!passcode) {
    return NextResponse.json(
      { error: "Submission is not configured for this deployment." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }
  const payload = (body ?? {}) as { passcode?: unknown; csv?: unknown };

  // Trimmed on both sides, so a passcode read aloud and typed with a stray
  // space is not rejected as wrong.
  const submitted = String(payload.passcode ?? "").trim();
  if (!safeEqual(submitted, passcode)) {
    return NextResponse.json(
      { error: "That class passcode was not recognized." },
      { status: 401 },
    );
  }

  const csv = String(payload.csv ?? "");
  if (!csv.trim()) {
    return NextResponse.json({ error: "Nothing to submit." }, { status: 400 });
  }
  if (csv.length > MAX_BYTES) {
    return NextResponse.json({ error: "Submission too large." }, { status: 413 });
  }

  // Whichever cohort's window covers today owns this submission.
  const cohort =
    cohortForDate(await readCohorts())?.id ?? UNASSIGNED_COHORT;

  const kind = detectKind(csv);
  if (kind === "eval") return submitEval(csv, cohort);
  if (kind === "assessment") return submitAssessment(csv, cohort);
  return NextResponse.json(
    { error: "That is not an export from the scoring or assessment page." },
    { status: 400 },
  );
}

async function submitEval(csv: string, cohort: string) {
  const records = parseEvalCsv(csv);
  const studentId = records[0]?.evaluator?.trim();
  if (!studentId) {
    return NextResponse.json(
      { error: "Enter your student ID before submitting." },
      { status: 400 },
    );
  }

  // One blob per student per cohort: resubmitting replaces that student's own
  // scores rather than accumulating duplicates.
  await putSubmission(
    "active",
    "eval",
    cohort,
    `${segment(studentId, "student")}.csv`,
    csv,
  );
  return NextResponse.json({
    ok: true,
    kind: "eval",
    cohort,
    rows: records.length,
  });
}

async function submitAssessment(csv: string, cohort: string) {
  const rows = parseCsv(csv);
  const header = rows[0] ?? [];
  const iCode = (() => {
    const i = header.indexOf("Student ID");
    return i >= 0 ? i : header.indexOf("Anonymous matching code");
  })();
  if (iCode < 0) {
    return NextResponse.json(
      { error: "That assessment export is missing its header row." },
      { status: 400 },
    );
  }

  const body = rows.slice(1).filter((r) => r.some((c) => c.trim() !== ""));
  if (body.length === 0) {
    return NextResponse.json({ error: "Nothing to submit." }, { status: 400 });
  }

  for (const row of body) {
    if (!(row[iCode] ?? "").trim()) {
      return NextResponse.json(
        { error: "Enter your student ID before submitting." },
        { status: 400 },
      );
    }
  }

  // One blob per student per cohort: resubmitting corrects a response rather
  // than accumulating duplicates.
  await Promise.all(
    body.map((row) =>
      putSubmission(
        "active",
        "assessment",
        cohort,
        `${segment(row[iCode] ?? "", "student")}.csv`,
        toCsv([header, row]),
      ),
    ),
  );

  return NextResponse.json({
    ok: true,
    kind: "assessment",
    cohort,
    rows: body.length,
  });
}

export async function GET(request: Request) {
  if (!(await requireInstructor())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const stageParam = params.get("stage") ?? "active";
  if (!isStage(stageParam)) {
    return NextResponse.json({ error: "Unknown stage." }, { status: 400 });
  }
  const kindParam = params.get("kind");
  if (kindParam !== null && !isKind(kindParam)) {
    return NextResponse.json({ error: "Unknown kind." }, { status: 400 });
  }

  const [files, cohorts] = await Promise.all([
    listSubmissions(stageParam, kindParam ?? undefined),
    readCohorts(),
  ]);

  return NextResponse.json({
    stage: stageParam,
    cohorts,
    current: cohortForDate(cohorts)?.id ?? null,
    files,
  });
}

/**
 * Moves submissions between stages. Used to archive a finished cohort and,
 * from the archive page, to move a batch out of sight into deep.
 */
export async function PATCH(request: Request) {
  if (!(await requireInstructor())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }
  const payload = (body ?? {}) as {
    to?: unknown;
    pathnames?: unknown;
    from?: unknown;
    kind?: unknown;
    cohort?: unknown;
  };

  const to = payload.to;
  if (!isStage(to) || to === "active") {
    return NextResponse.json(
      { error: "Move submissions to 'archived' or 'deep'." },
      { status: 400 },
    );
  }

  // Either an explicit list of paths, or every file in one stage/kind/cohort.
  let pathnames: string[];
  if (Array.isArray(payload.pathnames)) {
    pathnames = payload.pathnames.map(String);
  } else {
    const from = payload.from ?? "active";
    if (!isStage(from)) {
      return NextResponse.json({ error: "Unknown stage." }, { status: 400 });
    }
    const kind = payload.kind;
    if (!isKind(kind)) {
      return NextResponse.json({ error: "Unknown kind." }, { status: 400 });
    }
    const cohort = payload.cohort ? String(payload.cohort) : null;
    const all = await listSubmissions(from as Stage, kind);
    pathnames = all
      .filter((f) => !cohort || f.cohort === cohort)
      .map((f) => f.pathname);
  }

  const { moved } = await moveSubmissions(pathnames, to);
  return NextResponse.json({ ok: true, to, moved });
}
