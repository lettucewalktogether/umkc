"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { type AssessmentRecord } from "@/lib/dashboard";

/**
 * Who has completed the assessment, and who has not.
 *
 * The submissions alone can only show who did submit. Anyone who never
 * submitted appears nowhere in them, so the missing students are only
 * knowable against a roster the instructor supplies.
 */

type Props = {
  records: AssessmentRecord[];
  /** Null while "all cohorts" is selected: a roster belongs to one cohort. */
  cohort: string | null;
};

type Row = {
  id: string;
  submitted: boolean;
  onRoster: boolean;
};

export default function CompletionTab({ records, cohort }: Props) {
  const [roster, setRoster] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  const loadRoster = useCallback(async () => {
    if (!cohort) return;
    try {
      const res = await fetch("/umkc/govtacctclass/api/roster", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { roster?: Record<string, string[]> };
      const ids = data.roster?.[cohort] ?? [];
      setRoster(ids);
      setDraft(ids.join("\n"));
    } catch {
      /* the completed list still works without a roster */
    }
  }, [cohort]);

  useEffect(() => {
    void loadRoster();
  }, [loadRoster]);

  async function saveRoster() {
    if (!cohort) return;
    setStatus("saving");
    const ids = draft
      .split(/[\n,;\t]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      const res = await fetch("/umkc/govtacctclass/api/roster", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cohort, ids }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setRoster(ids);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  const rows = useMemo<Row[]>(() => {
    const byId = new Map<string, Row>();
    const key = (id: string) => id.trim().toLowerCase();

    for (const id of roster) {
      byId.set(key(id), { id, submitted: false, onRoster: true });
    }
    for (const r of records) {
      const id = r.code.trim();
      if (!id) continue;
      const row = byId.get(key(id)) ?? {
        id,
        submitted: false,
        onRoster: false,
      };
      row.submitted = true;
      byId.set(key(id), row);
    }
    return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  }, [records, roster]);

  const done = rows.filter((r) => r.submitted).length;
  const missing = rows.filter((r) => !r.submitted);
  const offRoster = rows.filter((r) => !r.onRoster && roster.length > 0);

  function label(r: Row): string {
    return r.submitted ? "Submitted" : "Not submitted";
  }

  return (
    <>
      <h3>Completion</h3>
      {rows.length === 0 ? (
        <p className="saved-empty">
          No assessment responses yet, and no roster to compare against.
        </p>
      ) : roster.length === 0 ? (
        <p>
          {done} submitted. Add a roster below to see who has not.
        </p>
      ) : (
        <p>
          {done} of {roster.length} on the roster submitted.{" "}
          {missing.length} did not.
        </p>
      )}

      {offRoster.length > 0 && (
        <p className="status incomplete">
          Not on the roster: {offRoster.map((r) => r.id).join(", ")}
        </p>
      )}

      {rows.length > 0 && (
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{label(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3>Roster</h3>
      {cohort === null ? (
        <p className="status">
          Choose a single cohort above to edit its roster.
        </p>
      ) : (
        <>
          <p>Student IDs enrolled in this cohort, one per line.</p>
          <label className="field">
            <span>Student IDs</span>
            <textarea
              rows={6}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setStatus("idle");
              }}
              placeholder={"S12345678\nS12345679"}
            />
          </label>
          <div className="buttonrow">
            <button
              type="button"
              className="primary"
              onClick={saveRoster}
              disabled={status === "saving"}
            >
              {status === "saving" ? "Saving…" : "Save roster"}
            </button>
          </div>
          {status === "saved" && (
            <p className="status">Roster saved for this cohort.</p>
          )}
          {status === "error" && (
            <p className="status incomplete">Could not save the roster.</p>
          )}
        </>
      )}
    </>
  );
}
