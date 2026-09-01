import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { get, list, put } from "@vercel/blob";
import { SESSION_COOKIE, isValidSession, safeEqual } from "@/lib/auth";
import { detectKind, parseEvalCsv } from "@/lib/dashboard";

/**
 * Evaluation submissions.
 *
 * POST takes the same CSV the evaluation page exports, gated by the shared
 * class passcode, and stores it as one private blob per student. Storing the
 * export verbatim means the dashboard keeps a single parsing path and its
 * existing dedupe still applies.
 *
 * GET returns every stored submission to a signed-in instructor, using the
 * same session cookie that already guards the dashboard.
 */

export const runtime = "nodejs";
// Submissions must be read back immediately after they are written.
export const dynamic = "force-dynamic";

const PREFIX = "eval/";
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
  if (detectKind(csv) !== "eval") {
    return NextResponse.json(
      { error: "That is not a presentation-score export." },
      { status: 400 },
    );
  }

  const records = parseEvalCsv(csv);
  const studentId = records[0]?.evaluator?.trim();
  if (!studentId) {
    return NextResponse.json(
      { error: "Enter your student ID before submitting." },
      { status: 400 },
    );
  }
  const cls = records[0]?.classCode?.trim() ?? "";

  // One blob per student: resubmitting replaces that student's own scores and
  // never accumulates duplicates for the instructor to sort out.
  await put(
    `${PREFIX}${segment(cls, "class")}/${segment(studentId, "student")}.csv`,
    csv,
    {
      access: "private",
      contentType: "text/csv; charset=utf-8",
      allowOverwrite: true,
      addRandomSuffix: false,
    },
  );

  return NextResponse.json({ ok: true, evaluations: records.length });
}

export async function GET() {
  const store = await cookies();
  if (!(await isValidSession(store.get(SESSION_COOKIE)?.value))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { blobs } = await list({ prefix: PREFIX, limit: 1000 });
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
