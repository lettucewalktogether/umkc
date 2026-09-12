"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { type AssessmentRecord } from "@/lib/dashboard";
import { questions, ratingLabel } from "@/lib/assessment";

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
  const [openId, setOpenId] = useState<string | null>(null);

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

  /** IDs that have submitted but are not yet on the roster. */
  const submittedNotOnRoster = useMemo(() => {
    const listed = new Set(
      draft
        .split(/[\n,;\t]+/)
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean),
    );
    const ids = new Set<string>();
    for (const r of records) {
      const id = r.code.trim();
      if (id && !listed.has(id.toLowerCase())) ids.add(id);
    }
    return [...ids].sort((a, b) => a.localeCompare(b));
  }, [records, draft]);

  function addSubmitted() {
    const lines = draft.trim() ? draft.trimEnd().split(/\n/) : [];
    setDraft([...lines, ...submittedNotOnRoster].join("\n"));
    setStatus("idle");
  }

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
      <h3>Students who completed the assessment</h3>
      {rows.length === 0 ? (
        <p className="saved-empty">No responses yet.</p>
      ) : roster.length === 0 ? (
        <p>{done} completed. Click a student ID to read their answers.</p>
      ) : (
        <p>
          {done} of {roster.length} in the class completed it.{" "}
          {missing.length} did not.
        </p>
      )}

      {offRoster.length > 0 && (
        <p className="status incomplete">
          Not on your class list: {offRoster.map((r) => r.id).join(", ")}.
          Usually a mistyped ID.
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
              {rows.map((r) => {
                const key = r.id.trim().toLowerCase();
                const answer = records.find(
                  (x) => x.code.trim().toLowerCase() === key,
                );
                const open = openId === r.id;
                return (
                  <Fragment key={r.id}>
                    <tr>
                      <td>
                        {answer ? (
                          <button
                            type="button"
                            className="linklike"
                            aria-expanded={open}
                            onClick={() => setOpenId(open ? null : r.id)}
                          >
                            {r.id}
                          </button>
                        ) : (
                          r.id
                        )}
                      </td>
                      <td>{label(r)}</td>
                    </tr>
                    {open && answer && (
                      <tr>
                        <td colSpan={2}>
                          <div className="answers">
                            {questions.map((q, i) => {
                              const rating = answer.ratings[i];
                              const said = answer.explanations[i] ?? "";
                              return (
                                <div className="answer" key={q.stem}>
                                  <p className="answer-q">
                                    <strong>Q{i + 1}.</strong> {q.stem}
                                  </p>
                                  <p className="answer-rating">
                                    {rating === null
                                      ? "No rating"
                                      : `${rating} of 7 — ${ratingLabel(rating)}`}
                                  </p>
                                  <p className="answer-said">
                                    {said.trim() || "No explanation given."}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <details className="disclosure">
        <summary>Add your class list to see who has not completed it</summary>
      {cohort === null ? (
        <p className="status">
          Choose a single cohort above to edit its class list.
        </p>
      ) : (
        <>
          <p>
            Paste the student IDs in your class, one per line. Everyone who has
            already completed the assessment can be added with the button
            below, so you only type in the ones who have not.
          </p>
          <label className="field">
            <span>Student IDs in this class</span>
            <textarea
              rows={6}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setStatus("idle");
              }}
              placeholder="One student ID per line"
            />
          </label>
          <div className="buttonrow">
            <button
              type="button"
              onClick={addSubmitted}
              disabled={submittedNotOnRoster.length === 0}
            >
              {submittedNotOnRoster.length === 0
                ? "Everyone who completed it is listed"
                : `Add the ${submittedNotOnRoster.length} who completed it`}
            </button>
            <button
              type="button"
              className="primary"
              onClick={saveRoster}
              disabled={status === "saving"}
            >
              {status === "saving" ? "Saving…" : "Save class list"}
            </button>
          </div>
          {status === "saved" && (
            <p className="status">Class list saved.</p>
          )}
          {status === "error" && (
            <p className="status incomplete">Could not save the class list.</p>
          )}
        </>
      )}
      </details>
    </>
  );
}
