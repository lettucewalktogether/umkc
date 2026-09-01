"use client";

import { useEffect, useMemo, useState } from "react";
import {
  bandForScore,
  criteria,
  reasonsByBand,
  totalWeight,
  weightedPoints,
} from "@/lib/rubric";
import { downloadCsv, slug, toCsv, today } from "@/lib/csv";
import { classCode } from "@/lib/course";

type CriterionEntry = {
  score: number | null;
  reason: string;
  evidence: string;
};

type Evaluation = {
  id: string;
  evaluator: string;
  team: string;
  date: string;
  entries: Record<string, CriterionEntry>;
  strength: string;
  concern: string;
  recommendation: string;
};

const STORAGE_KEY = "umkc-govtacct-eval-v1";

function emptyEntries(): Record<string, CriterionEntry> {
  return Object.fromEntries(
    criteria.map((c) => [c.key, { score: null, reason: "", evidence: "" }]),
  );
}

function emptyEvaluation(evaluator = ""): Evaluation {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    evaluator,
    team: "",
    date: today(),
    entries: emptyEntries(),
    strength: "",
    concern: "",
    recommendation: "",
  };
}

/** Weighted total out of 100, or null until every criterion is scored. */
function totalFor(ev: Evaluation): number | null {
  let sum = 0;
  for (const c of criteria) {
    const score = ev.entries[c.key]?.score;
    if (score === null || score === undefined) return null;
    sum += weightedPoints(score, c.weight);
  }
  return sum;
}

/** Everything the rubric requires before an evaluation counts as complete. */
function missingFrom(ev: Evaluation): string[] {
  const missing: string[] = [];
  if (!ev.team.trim()) missing.push("team evaluated");
  if (!ev.evaluator.trim()) missing.push("your student ID");
  for (const c of criteria) {
    const e = ev.entries[c.key];
    if (e?.score === null || e?.score === undefined) {
      missing.push(`score for ${c.name.toLowerCase()}`);
      continue;
    }
    if (!e.reason) missing.push(`reason for ${c.name.toLowerCase()}`);
    if (!e.evidence.trim()) missing.push(`evidence for ${c.name.toLowerCase()}`);
  }
  if (!ev.strength.trim()) missing.push("one strength");
  if (!ev.concern.trim()) missing.push("one concern or unresolved question");
  if (!ev.recommendation.trim()) missing.push("overall recommendation");
  return missing;
}

function csvRows(evaluations: Evaluation[]): (string | number)[][] {
  const header = [
    "Class code",
    "Evaluator student ID",
    "Team evaluated",
    "Date",
    ...criteria.flatMap((c) => [
      `${c.name} - score (0-5)`,
      `${c.name} - weight %`,
      `${c.name} - weighted points`,
      `${c.name} - primary reason`,
      `${c.name} - presentation evidence`,
    ]),
    "Weighted total (of 100)",
    "One strength",
    "One concern or unresolved question",
    "Overall recommendation",
    "Complete",
  ];

  const rows = evaluations.map((ev) => {
    const total = totalFor(ev);
    return [
      classCode,
      ev.evaluator,
      ev.team,
      ev.date,
      ...criteria.flatMap((c) => {
        const e = ev.entries[c.key] ?? { score: null, reason: "", evidence: "" };
        return [
          e.score ?? "",
          c.weight,
          e.score === null ? "" : Number(weightedPoints(e.score, c.weight).toFixed(2)),
          e.reason,
          e.evidence,
        ];
      }),
      total === null ? "" : Number(total.toFixed(2)),
      ev.strength,
      ev.concern,
      ev.recommendation,
      missingFrom(ev).length === 0 ? "yes" : "no",
    ];
  });

  return [header, ...rows];
}

export default function EvalForm() {
  const [current, setCurrent] = useState<Evaluation>(() => emptyEvaluation());
  const [saved, setSaved] = useState<Evaluation[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Restore saved evaluations. Reading localStorage can throw in private or
  // restricted browsing contexts, so a failure just means starting empty.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          saved?: Evaluation[];
          current?: Evaluation;
        };
        if (Array.isArray(parsed.saved)) setSaved(parsed.saved);
        if (parsed.current) setCurrent(parsed.current);
      }
    } catch {
      /* start with an empty sheet */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ saved, current }),
      );
    } catch {
      /* scoring still works without persistence */
    }
  }, [saved, current, loaded]);

  const total = useMemo(() => totalFor(current), [current]);
  const missing = useMemo(() => missingFrom(current), [current]);
  const scoredCount = criteria.filter(
    (c) => current.entries[c.key]?.score !== null,
  ).length;

  function setEntry(key: string, patch: Partial<CriterionEntry>) {
    setCurrent((prev) => ({
      ...prev,
      entries: { ...prev.entries, [key]: { ...prev.entries[key], ...patch } },
    }));
  }

  function setScore(key: string, score: number) {
    const prevEntry = current.entries[key];
    // A reason belongs to a band; changing bands clears a now-invalid reason.
    const reasonStillValid =
      prevEntry.reason !== "" &&
      reasonsByBand[bandForScore(score)].includes(prevEntry.reason);
    setEntry(key, { score, reason: reasonStillValid ? prevEntry.reason : "" });
  }

  function saveCurrent() {
    setSaved((prev) => {
      const idx = prev.findIndex((e) => e.id === current.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = current;
        return next;
      }
      return [...prev, current];
    });
    setCurrent(emptyEvaluation(current.evaluator));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function exportAll() {
    const rows = [...saved];
    if (current.team.trim() || total !== null) rows.push(current);
    if (rows.length === 0) return;
    const who = slug(current.evaluator || saved[0]?.evaluator || "", "evaluator");
    downloadCsv(
      `${slug(classCode, "class")}-presentation-scores-${who}-${today()}.csv`,
      toCsv(csvRows(rows)),
    );
  }

  const canExport =
    saved.length > 0 || current.team.trim() !== "" || total !== null;

  return (
    <div className="form-ui" data-clarity-mask="true">
      <section>
        <h2>Evaluation header</h2>
        <div className="fieldrow">
          <label className="field">
            <span>Your student ID</span>
            <input
              type="text"
              value={current.evaluator}
              onChange={(e) =>
                setCurrent((p) => ({ ...p, evaluator: e.target.value }))
              }
              placeholder="Student ID, not your name"
              autoComplete="off"
            />
          </label>
          <label className="field">
            <span>Team evaluated</span>
            <input
              type="text"
              value={current.team}
              onChange={(e) =>
                setCurrent((p) => ({ ...p, team: e.target.value }))
              }
              placeholder="Team name or number"
            />
          </label>
          <label className="field">
            <span>Date</span>
            <input
              type="date"
              value={current.date}
              onChange={(e) =>
                setCurrent((p) => ({ ...p, date: e.target.value }))
              }
            />
          </label>
        </div>
        <p className="status">
          Do not score your own team. Submit individual scores before group
          discussion.
        </p>
      </section>

      <h2>Criterion scores</h2>
      {criteria.map((c) => {
        const entry = current.entries[c.key];
        const band = entry.score === null ? null : bandForScore(entry.score);
        const standard =
          band === null
            ? null
            : band === "low"
              ? c.low
              : band === "medium"
                ? c.medium
                : c.high;

        return (
          <section className="crit" key={c.key}>
            <div className="crit-head">
              <h3>{c.name}</h3>
              <span className="crit-weight">
                Weight {c.weight}%
                {entry.score !== null &&
                  ` · ${weightedPoints(entry.score, c.weight).toFixed(1)} pts`}
              </span>
            </div>

            <div
              className="optgroup six"
              role="radiogroup"
              aria-label={`${c.name} score`}
            >
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <label className="opt" key={n}>
                  <input
                    type="radio"
                    name={`score-${c.key}`}
                    value={n}
                    checked={entry.score === n}
                    onChange={() => setScore(c.key, n)}
                  />
                  <span className="rating">{n}</span>
                  <span className="word">
                    {n <= 1 ? "Low" : n <= 3 ? "Medium" : "High"}
                  </span>
                </label>
              ))}
            </div>

            {standard && <p className="crit-standard">{standard}</p>}

            <label className="field">
              <span>Primary reason (required)</span>
              <select
                value={entry.reason}
                disabled={band === null}
                onChange={(e) => setEntry(c.key, { reason: e.target.value })}
              >
                <option value="">
                  {band === null
                    ? "Select a score first"
                    : "Select the primary reason"}
                </option>
                {band !== null &&
                  reasonsByBand[band].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
              </select>
            </label>

            <label className="field">
              <span>Presentation evidence (required)</span>
              <textarea
                value={entry.evidence}
                onChange={(e) => setEntry(c.key, { evidence: e.target.value })}
                placeholder="What you specifically saw or heard in the presentation or question period."
              />
            </label>
          </section>
        );
      })}

      <h2>Required narrative</h2>
      <label className="field">
        <span>One strength</span>
        <textarea
          value={current.strength}
          onChange={(e) =>
            setCurrent((p) => ({ ...p, strength: e.target.value }))
          }
        />
      </label>
      <label className="field">
        <span>One concern or unresolved question</span>
        <textarea
          value={current.concern}
          onChange={(e) =>
            setCurrent((p) => ({ ...p, concern: e.target.value }))
          }
        />
      </label>
      <label className="field">
        <span>Overall recommendation</span>
        <textarea
          value={current.recommendation}
          onChange={(e) =>
            setCurrent((p) => ({ ...p, recommendation: e.target.value }))
          }
        />
      </label>

      <div className="buttonrow">
        <button
          type="button"
          className="primary"
          onClick={saveCurrent}
          disabled={!current.team.trim() || total === null}
        >
          Save and score another team
        </button>
        <button type="button" onClick={exportAll} disabled={!canExport}>
          Export all to spreadsheet (CSV)
        </button>
      </div>

      <div className="tally">
        <span className="status">
          {scoredCount} of {criteria.length} criteria scored
          {current.team.trim() ? ` · ${current.team}` : ""}
        </span>
        <span className="total">
          {total === null ? "—" : total.toFixed(1)}{" "}
          <small>/ {totalWeight} weighted</small>
        </span>
      </div>

      {missing.length > 0 && (
        <p className="status incomplete">
          Still needed: {missing.slice(0, 4).join("; ")}
          {missing.length > 4 ? `; and ${missing.length - 4} more` : ""}.
        </p>
      )}

      <h2>Saved evaluations on this device</h2>
      {saved.length === 0 ? (
        <p className="saved-empty">
          None saved yet. Saved evaluations stay in this browser only and are
          included in the export.
        </p>
      ) : (
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Team</th>
                <th>Evaluator</th>
                <th className="num">Date</th>
                <th className="num">Weighted total</th>
                <th className="num">Complete</th>
                <th className="num">Actions</th>
              </tr>
            </thead>
            <tbody>
              {saved.map((ev) => {
                const t = totalFor(ev);
                return (
                  <tr key={ev.id}>
                    <td>{ev.team || "—"}</td>
                    <td>{ev.evaluator || "—"}</td>
                    <td className="num">{ev.date}</td>
                    <td className="num">{t === null ? "—" : t.toFixed(1)}</td>
                    <td className="num">
                      {missingFrom(ev).length === 0 ? "yes" : "no"}
                    </td>
                    <td className="num">
                      <button
                        type="button"
                        onClick={() => {
                          setSaved((prev) =>
                            prev.filter((e) => e.id !== ev.id),
                          );
                          setCurrent(ev);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        Edit
                      </button>{" "}
                      <button
                        type="button"
                        className="danger"
                        onClick={() =>
                          setSaved((prev) =>
                            prev.filter((e) => e.id !== ev.id),
                          )
                        }
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="buttonrow">
        <button type="button" onClick={exportAll} disabled={!canExport}>
          Export all to spreadsheet (CSV)
        </button>
        <button
          type="button"
          className="danger"
          onClick={() => {
            if (
              window.confirm(
                "Clear the current sheet and every saved evaluation in this browser? Export first if you have not already.",
              )
            ) {
              setSaved([]);
              setCurrent(emptyEvaluation());
            }
          }}
          disabled={!canExport}
        >
          Clear everything
        </button>
      </div>
    </div>
  );
}
