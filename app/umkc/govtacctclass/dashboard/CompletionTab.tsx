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
  pre: boolean;
  post: boolean;
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
      byId.set(key(id), { id, pre: false, post: false, onRoster: true });
    }
    for (const r of records) {
      const id = r.code.trim();
      if (!id) continue;
      const row = byId.get(key(id)) ?? {
        id,
        pre: false,
        post: false,
        onRoster: false,
      };
      if (r.point === "Pre") row.pre = true;
      if (r.point === "Post") row.post = true;
      byId.set(key(id), row);
    }
    return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  }, [records, roster]);

  const done = rows.filter((r) => r.pre && r.post).length;
  const partial = rows.filter((r) => (r.pre || r.post) && !(r.pre && r.post));
  const missing = rows.filter((r) => !r.pre && !r.post);
  const offRoster = rows.filter((r) => !r.onRoster && roster.length > 0);

  function label(r: Row): string {
    if (r.pre && r.post) return "Both";
    if (r.pre) return "Pre only";
    if (r.post) return "Post only";
    return "Nothing submitted";
  }

  return (
    <>
      <h3>Completion</h3>
      {rows.length === 0 ? (
        <p className="saved-empty">
          No assessment responses yet, and no roster to compare against.
        </p>
      ) : (
        <p>
          {done} of {rows.length} {rows.length === 1 ? "student has" : "students have"}{" "}
          completed both. {partial.length} started but did not finish, and{" "}
          {missing.length} submitted nothing.
        </p>
      )}

      {offRoster.length > 0 && (
        <p className="status incomplete">
          {offRoster.length} student{offRoster.length === 1 ? "" : "s"} submitted
          without appearing on the roster ({offRoster.map((r) => r.id).join(", ")}
          ). Check for a mistyped ID.
        </p>
      )}

      {rows.length > 0 && (
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Pre</th>
                <th>Post</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.pre ? "Yes" : "—"}</td>
                  <td>{r.post ? "Yes" : "—"}</td>
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
          Choose a single cohort above to enter or edit its roster. A roster
          belongs to one cohort, so it cannot be edited while all cohorts are
          shown.
        </p>
      ) : (
        <>
          <p>
            Paste the student IDs enrolled in this cohort, one per line. Anyone
            listed here who has not submitted shows above as{" "}
            <strong>Nothing submitted</strong>. Without a roster the table can
            only show who did submit.
          </p>
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
