import { get, list, put, del } from "@vercel/blob";
import {
  DEFAULT_COHORTS,
  validateCohorts,
  type Cohort,
} from "./cohorts";

/**
 * Blob layout for student submissions.
 *
 * Paths are `<stage>/<kind>/<cohort>/<file>`, so a stage or a cohort can be
 * listed with a prefix rather than by reading every blob and filtering.
 *
 * Stages:
 *   active   what the dashboard reports on
 *   archived set aside once a cohort is finished, still readable on the
 *            archive page
 *   deep     removed from every view, kept in the store
 *
 * Nothing is ever deleted. "Delete" in the archive means deep, which is why
 * this module has no destructive path for submissions.
 */

export const STAGES = ["active", "archived", "deep"] as const;
export type Stage = (typeof STAGES)[number];

export const KINDS = ["eval", "assessment"] as const;
export type Kind = (typeof KINDS)[number];

export function isStage(v: unknown): v is Stage {
  return typeof v === "string" && (STAGES as readonly string[]).includes(v);
}

export function isKind(v: unknown): v is Kind {
  return typeof v === "string" && (KINDS as readonly string[]).includes(v);
}

/** Active keeps the original bare prefixes, so blobs written before stages
 *  existed are still found without a migration. */
export function prefixFor(stage: Stage, kind: Kind, cohort?: string): string {
  const base = stage === "active" ? `${kind}/` : `${stage}/${kind}/`;
  return cohort ? `${base}${cohort}/` : base;
}

export function pathFor(
  stage: Stage,
  kind: Kind,
  cohort: string,
  file: string,
): string {
  return `${prefixFor(stage, kind, cohort)}${file}`;
}

export type StoredSubmission = {
  pathname: string;
  stage: Stage;
  kind: Kind;
  cohort: string;
  /** File name within the cohort, e.g. "s12345678.csv". */
  file: string;
  uploadedAt: string;
  csv: string;
};

/** Splits a stored path back into its parts. */
export function describePath(
  pathname: string,
): { stage: Stage; kind: Kind; cohort: string; file: string } | null {
  const parts = pathname.split("/");
  if (parts.length === 3 && isKind(parts[0])) {
    return { stage: "active", kind: parts[0], cohort: parts[1], file: parts[2] };
  }
  if (parts.length === 4 && isStage(parts[0]) && isKind(parts[1])) {
    return {
      stage: parts[0],
      kind: parts[1],
      cohort: parts[2],
      file: parts[3],
    };
  }
  return null;
}

const CSV_BLOB = {
  access: "private",
  contentType: "text/csv; charset=utf-8",
  allowOverwrite: true,
  addRandomSuffix: false,
} as const;

export async function putSubmission(
  stage: Stage,
  kind: Kind,
  cohort: string,
  file: string,
  csv: string,
): Promise<string> {
  const pathname = pathFor(stage, kind, cohort, file);
  await put(pathname, csv, CSV_BLOB);
  return pathname;
}

/** Reads one stage, optionally one kind, with each blob's CSV. */
export async function listSubmissions(
  stage: Stage,
  kind?: Kind,
): Promise<StoredSubmission[]> {
  const kinds = kind ? [kind] : [...KINDS];
  const listed = await Promise.all(
    kinds.map((k) => list({ prefix: prefixFor(stage, k), limit: 1000 })),
  );

  const blobs = listed
    .flatMap((l) => l.blobs)
    // An active listing of "eval/" cannot match "archived/eval/", but guard
    // anyway so a future prefix change cannot silently mix stages.
    .filter((b) => describePath(b.pathname)?.stage === stage);

  return Promise.all(
    blobs.map(async (b) => {
      const parts = describePath(b.pathname)!;
      const result = await get(b.pathname, { access: "private" });
      return {
        pathname: b.pathname,
        ...parts,
        uploadedAt:
          typeof b.uploadedAt === "string"
            ? b.uploadedAt
            : new Date(b.uploadedAt).toISOString(),
        csv: result ? await new Response(result.stream).text() : "",
      };
    }),
  );
}

/**
 * Moves blobs between stages by copy-then-delete. The delete removes the blob
 * at its old path only; the content survives at the new one.
 */
export async function moveSubmissions(
  pathnames: string[],
  to: Stage,
): Promise<{ moved: number }> {
  let moved = 0;
  for (const pathname of pathnames) {
    const parts = describePath(pathname);
    if (!parts || parts.stage === to) continue;
    const result = await get(pathname, { access: "private" });
    if (!result) continue;
    const csv = await new Response(result.stream).text();
    await putSubmission(to, parts.kind, parts.cohort, parts.file, csv);
    await del(pathname);
    moved += 1;
  }
  return { moved };
}

// ---------------------------------------------------------------------------
// Cohort configuration, stored alongside the submissions
// ---------------------------------------------------------------------------

const COHORTS_PATH = "config/cohorts.json";

export async function readCohorts(): Promise<Cohort[]> {
  try {
    const result = await get(COHORTS_PATH, { access: "private" });
    if (!result) return DEFAULT_COHORTS;
    const parsed: unknown = JSON.parse(await new Response(result.stream).text());
    const { cohorts } = validateCohorts(parsed);
    return cohorts ?? DEFAULT_COHORTS;
  } catch {
    // A missing or unreadable config must not stop students submitting.
    return DEFAULT_COHORTS;
  }
}

export async function writeCohorts(cohorts: Cohort[]): Promise<void> {
  await put(COHORTS_PATH, JSON.stringify(cohorts, null, 2), {
    access: "private",
    contentType: "application/json; charset=utf-8",
    allowOverwrite: true,
    addRandomSuffix: false,
  });
}

// ---------------------------------------------------------------------------
// Class roster, used to tell who has not submitted
// ---------------------------------------------------------------------------

const ROSTER_PATH = "config/roster.json";

/** Student ids per cohort. Only used to report who is missing. */
export type Roster = Record<string, string[]>;

export async function readRoster(): Promise<Roster> {
  try {
    const result = await get(ROSTER_PATH, { access: "private" });
    if (!result) return {};
    const parsed: unknown = JSON.parse(await new Response(result.stream).text());
    if (!parsed || typeof parsed !== "object") return {};
    const out: Roster = {};
    for (const [cohort, ids] of Object.entries(parsed as Roster)) {
      if (Array.isArray(ids)) {
        out[cohort] = [
          ...new Set(ids.map((i) => String(i).trim()).filter(Boolean)),
        ];
      }
    }
    return out;
  } catch {
    return {};
  }
}

export async function writeRoster(roster: Roster): Promise<void> {
  await put(ROSTER_PATH, JSON.stringify(roster, null, 2), {
    access: "private",
    contentType: "application/json; charset=utf-8",
    allowOverwrite: true,
    addRandomSuffix: false,
  });
}
