import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { del, get, list, put } from "@vercel/blob";
import { SESSION_COOKIE, isValidSession, safeEqual } from "@/lib/auth";
import { detectKind, parseEvalCsv } from "@/lib/dashboard";
import { parseCsv, toCsv } from "@/lib/csv";

/**
 * Student submissions, for both the evaluation score sheet and the pre/post
 * assessment.
 *
 * POST takes the same CSV the page exports, gated by the shared class
 * passcode. Storing the export verbatim keeps one parsing path in the
 * dashboard and lets its existing dedupe apply unchanged.
 *
 * GET returns every submission to a signed-in instructor, using the session
 * cookie that already guards the dashboard. DELETE clears them, since
 * submissions are kept only until grades are posted.
 */

export const runtime = "nodejs";
// Submissions must be readable immediately after they are written.
export const dynamic = "force-dynamic";

const EVAL_PREFIX = "eval/";
const ASSESSMENT_PREFIX = "assessment/";
const MAX_BYTES = 512 * 1024;

function classPasscode(): string | null {
  const value = process.env.STUDENT_PASSCODE?.trim();
  return value ? value : null;
}

/** Filesystem-safe path segment. */
function segment(value: string, fallback: string): string {
  const s = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return s || fallback;
}

const blobOptions = {
  access: "private",
  contentType: "text/csv; charset=utf-8",
  allowOverwrite: true,
  addRandomSuffix: false,
} as const;

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

  const kind = detectKind(csv);
  if (kind === "eval") return submitEval(csv);
  if (kind === "assessment") return submitAssessment(csv);
  return NextResponse.json(
    { error: "That is not an export from the scoring or assessment page." },
    { status: 400 },
  );
}

async function submitEval(csv: string) {
  const records = parseEvalCsv(csv);
  const studentId = records[0]?.evaluator?.trim();
  if (!studentId) {
    return NextResponse.json(
      { error: "Enter your student ID before submitting." },
      { status: 400 },
    );
  }
  const cls = records[0]?.classCode?.trim() ?? "";

  // One blob per student: resubmitting replaces that student's own scores
  // rather than accumulating duplicates.
  await put(
    `${EVAL_PREFIX}${segment(cls, "class")}/${segment(studentId, "student")}.csv`,
    csv,
    blobOptions,
  );
  return NextResponse.json({ ok: true, kind: "eval", rows: records.length });
}

async function submitAssessment(csv: string) {
  const rows = parseCsv(csv);
  const header = rows[0] ?? [];
  const iClass = header.indexOf("Class code");
  const iCode = header.indexOf("Anonymous matching code");
  const iPoint = header.indexOf("Assessment point");
  if (iCode < 0 || iPoint < 0) {
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
        { error: "Enter your anonymous matching code before submitting." },
        { status: 400 },
      );
    }
    const point = (row[iPoint] ?? "").trim();
    if (point !== "Pre" && point !== "Post") {
      return NextResponse.json(
        { error: "Choose Pre or Post for every response before submitting." },
        { status: 400 },
      );
    }
  }

  // Keyed by matching code AND point, so submitting the post-assessment never
  // overwrites the pre-assessment the pairing depends on.
  await Promise.all(
    body.map((row) => {
      const cls = iClass >= 0 ? (row[iClass] ?? "") : "";
      const code = segment(row[iCode] ?? "", "code");
      const point = segment(row[iPoint] ?? "", "point");
      return put(
        `${ASSESSMENT_PREFIX}${segment(cls, "class")}/${code}--${point}.csv`,
        toCsv([header, row]),
        blobOptions,
      );
    }),
  );

  return NextResponse.json({ ok: true, kind: "assessment", rows: body.length });
}

async function requireInstructor(): Promise<boolean> {
  const store = await cookies();
  return isValidSession(store.get(SESSION_COOKIE)?.value);
}

export async function GET() {
  if (!(await requireInstructor())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const prefixes = [EVAL_PREFIX, ASSESSMENT_PREFIX];
  const listed = await Promise.all(
    prefixes.map((prefix) => list({ prefix, limit: 1000 })),
  );
  const blobs = listed.flatMap((l) => l.blobs);

  const files = await Promise.all(
    blobs.map(async (b) => {
      const result = await get(b.pathname, { access: "private" });
      return {
        pathname: b.pathname,
        uploadedAt: b.uploadedAt,
        csv: result ? await new Response(result.stream).text() : "",
      };
    }),
  );

  return NextResponse.json({ files });
}

export async function DELETE() {
  if (!(await requireInstructor())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const listed = await Promise.all(
    [EVAL_PREFIX, ASSESSMENT_PREFIX].map((prefix) =>
      list({ prefix, limit: 1000 }),
    ),
  );
  const paths = listed.flatMap((l) => l.blobs.map((b) => b.pathname));
  if (paths.length) await del(paths);
  return NextResponse.json({ ok: true, deleted: paths.length });
}
