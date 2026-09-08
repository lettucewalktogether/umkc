import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth";
import { cohortForDate, validateCohorts } from "@/lib/cohorts";
import { readCohorts, writeCohorts } from "@/lib/submissions";

/**
 * Cohort definitions, readable and editable by a signed-in instructor.
 *
 * These live in the blob store rather than in an environment variable so a
 * new semester can be added without a redeploy.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireInstructor(): Promise<boolean> {
  const store = await cookies();
  return isValidSession(store.get(SESSION_COOKIE)?.value);
}

export async function GET() {
  if (!(await requireInstructor())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const cohorts = await readCohorts();
  return NextResponse.json({
    cohorts,
    current: cohortForDate(cohorts)?.id ?? null,
  });
}

export async function PUT(request: Request) {
  if (!(await requireInstructor())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const { cohorts, error } = validateCohorts(
    (body as { cohorts?: unknown })?.cohorts,
  );
  if (error || !cohorts) {
    return NextResponse.json({ error: error ?? "Invalid." }, { status: 400 });
  }

  // Renaming an id would orphan everything already filed under the old one,
  // so ids already carrying submissions cannot be dropped silently — the
  // caller keeps them and edits the label or dates instead.
  await writeCohorts(cohorts);
  return NextResponse.json({
    ok: true,
    cohorts,
    current: cohortForDate(cohorts)?.id ?? null,
  });
}
