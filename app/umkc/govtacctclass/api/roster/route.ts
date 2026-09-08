import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth";
import { readRoster, writeRoster, type Roster } from "@/lib/submissions";

/**
 * The expected student ids for a cohort.
 *
 * Submissions alone can only show who did submit. Comparing them against a
 * roster is what makes "who has not" answerable.
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
  return NextResponse.json({ roster: await readRoster() });
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

  const payload = (body ?? {}) as { cohort?: unknown; ids?: unknown };
  const cohort = String(payload.cohort ?? "").trim();
  if (!cohort) {
    return NextResponse.json({ error: "Which cohort?" }, { status: 400 });
  }
  if (!Array.isArray(payload.ids)) {
    return NextResponse.json({ error: "Expected a list of ids." }, { status: 400 });
  }

  const ids = [
    ...new Set(payload.ids.map((i) => String(i).trim()).filter(Boolean)),
  ];

  const roster: Roster = await readRoster();
  if (ids.length === 0) delete roster[cohort];
  else roster[cohort] = ids;
  await writeRoster(roster);

  return NextResponse.json({ ok: true, roster });
}
