import { classToday } from "./course";

/**
 * Class cohorts.
 *
 * A cohort is one run of the class: a label and the window during which its
 * students submit. Every submission is filed under the cohort whose window
 * contains the day it arrived, so the instructor can tell which run a
 * response belongs to without relying on a student to say.
 *
 * Cohorts are stored in the blob store rather than in an environment
 * variable, so the instructor can add next semester's without a redeploy.
 */

export type Cohort = {
  /** Path-safe id, used as the storage segment. */
  id: string;
  label: string;
  /** Inclusive, YYYY-MM-DD in the class timezone. */
  startsOn: string;
  /** Inclusive, YYYY-MM-DD in the class timezone. */
  endsOn: string;
};

/** Where submissions land when no cohort window covers the day. */
export const UNASSIGNED_COHORT = "unassigned";


export const DEFAULT_COHORTS: Cohort[] = [
  {
    id: "2026-fall",
    label: "Fall 2026",
    startsOn: "2026-08-01",
    endsOn: "2026-12-31",
  },
];

/** Path-safe segment, shared by cohort ids and student ids. */
export function segment(value: string, fallback: string): string {
  const s = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return s || fallback;
}

/**
 * The cohort a submission arriving now belongs to. Windows are inclusive on
 * both ends; the first match wins, so overlapping windows resolve to the one
 * listed first rather than failing.
 */
export function cohortForDate(
  cohorts: Cohort[],
  now: Date = new Date(),
): Cohort | null {
  const today = classToday(now);
  return (
    cohorts.find((c) => today >= c.startsOn && today <= c.endsOn) ?? null
  );
}

export function cohortLabel(cohorts: Cohort[], id: string): string {
  if (id === UNASSIGNED_COHORT) return "Outside every cohort window";
  const known = cohorts.find((c) => c.id === id);
  if (known) return known.label;
  // An id with no definition is usually data filed before its cohort existed.
  // Say so rather than printing a bare slug that reads like a real cohort.
  return `Unrecognised cohort (${id})`;
}


/** Rejects malformed cohorts before they are stored. */
export function validateCohorts(input: unknown): {
  cohorts?: Cohort[];
  error?: string;
} {
  if (!Array.isArray(input)) return { error: "Expected a list of cohorts." };
  const seen = new Set<string>();
  const cohorts: Cohort[] = [];
  for (const raw of input) {
    const c = (raw ?? {}) as Partial<Cohort>;
    const label = String(c.label ?? "").trim();
    if (!label) return { error: "Every cohort needs a name." };
    const id = segment(String(c.id ?? label), "");
    if (!id) return { error: `Could not derive an id for "${label}".` };
    if (id === UNASSIGNED_COHORT) {
      return { error: `"${id}" is reserved and cannot be a cohort id.` };
    }
    if (seen.has(id)) return { error: `Two cohorts share the id "${id}".` };
    seen.add(id);
    const startsOn = String(c.startsOn ?? "").trim();
    const endsOn = String(c.endsOn ?? "").trim();
    const iso = /^\d{4}-\d{2}-\d{2}$/;
    if (!iso.test(startsOn) || !iso.test(endsOn)) {
      return { error: `${label}: dates must be YYYY-MM-DD.` };
    }
    if (endsOn < startsOn) {
      return { error: `${label}: the end date is before the start date.` };
    }
    cohorts.push({ id, label, startsOn, endsOn });
  }
  return { cohorts };
}
