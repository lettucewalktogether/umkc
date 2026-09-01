"use client";

import { useEffect, useMemo, useState } from "react";
import { downloadCsv, slug, toCsv, today } from "@/lib/csv";
import { classCode } from "@/lib/course";
import { domains, questions, scale, type Domain } from "@/lib/assessment";

type Answer = { rating: number | null; explanation: string };

type Response = {
  id: string;
  point: "Pre" | "Post" | "";
  code: string;
  team: string;
  date: string;
  answers: Answer[];
};

const STORAGE_KEY = "umkc-govtacct-assessment-v1";

function emptyResponse(code = ""): Response {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    point: "",
    code,
    team: "",
    date: today(),
    answers: questions.map(() => ({ rating: null, explanation: "" })),
  };
}

/** Sum of ratings across a question range, or null until all are answered. */
function subtotal(r: Response, domain: Domain): number | null {
  let sum = 0;
  for (let i = domain.from - 1; i <= domain.to - 1; i++) {
    const rating = r.answers[i]?.rating;
    if (rating === null || rating === undefined) return null;
    sum += rating;
  }
  return sum;
}

function answeredCount(r: Response): number {
  return r.answers.filter((a) => a.rating !== null).length;
}

function csvRows(responses: Response[]): (string | number)[][] {
  const header = [
    "Class code",
    "Anonymous matching code",
    "Assessment point",
    "Vendor Team",
    "Date",
    ...questions.flatMap((q, i) => [
      `Q${i + 1} rating (1-7)`,
      `Q${i + 1} explanation`,
    ]),
    ...domains.map((d) => `${d.name} (Q${d.from}-${d.to})`),
    "Questions answered",
  ];

  const rows = responses.map((r) => [
    classCode,
    r.code,
    r.point,
    r.team,
    r.date,
    ...r.answers.flatMap((a) => [a.rating ?? "", a.explanation]),
    ...domains.map((d) => subtotal(r, d) ?? ""),
    answeredCount(r),
  ]);

  return [header, ...rows];
}

export default function AssessmentForm() {
  const [current, setCurrent] = useState<Response>(() => emptyResponse());
  const [saved, setSaved] = useState<Response[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [submitPasscode, setSubmitPasscode] = useState("");
  const [submitState, setSubmitState] = useState<{
    status: "idle" | "sending" | "sent" | "error";
    message?: string;
  }>({ status: "idle" });

  // Restoring lets a student complete the pre-assessment now and the post
  // months later on the same browser, so one export carries both rows.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          saved?: Response[];
          current?: Response;
        };
        if (Array.isArray(parsed.saved)) setSaved(parsed.saved);
        if (parsed.current?.answers?.length === questions.length) {
          setCurrent(parsed.current);
        }
      }
    } catch {
      /* start with an empty form */
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
      /* the form still works without persistence */
    }
  }, [saved, current, loaded]);

  const overall = useMemo(() => {
    let sum = 0;
    for (const a of current.answers) {
      if (a.rating === null) return null;
      sum += a.rating;
    }
    return sum;
  }, [current]);

  function setAnswer(index: number, patch: Partial<Answer>) {
    setCurrent((prev) => {
      const answers = [...prev.answers];
      answers[index] = { ...answers[index], ...patch };
      return { ...prev, answers };
    });
  }

  function saveCurrent() {
    setSaved((prev) => {
      const idx = prev.findIndex((r) => r.id === current.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = current;
        return next;
      }
      return [...prev, current];
    });
    setCurrent(emptyResponse(current.code));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function currentRows() {
    const rows = [...saved];
    if (answeredCount(current) > 0) rows.push(current);
    return rows;
  }

  async function submitAll() {
    const rows = currentRows();
    if (rows.length === 0) return;
    setSubmitState({ status: "sending" });
    try {
      const res = await fetch("/umkc/govtacctclass/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passcode: submitPasscode,
          csv: toCsv(csvRows(rows)),
        }),
      });
      const data = (await res.json()) as { error?: string; rows?: number };
      if (!res.ok) {
        setSubmitState({
          status: "error",
          message: data.error ?? "Submission failed.",
        });
        return;
      }
      setSubmitState({
        status: "sent",
        message: `Sent ${data.rows ?? rows.length} response${
          (data.rows ?? rows.length) === 1 ? "" : "s"
        }. Your pre- and post-assessments are stored separately, so submitting one never replaces the other.`,
      });
    } catch {
      setSubmitState({
        status: "error",
        message:
          "Could not reach the server. Export the CSV and hand it in instead.",
      });
    }
  }

  function exportAll() {
    const rows = [...saved];
    if (answeredCount(current) > 0) rows.push(current);
    if (rows.length === 0) return;
    const code = slug(current.code || saved[0]?.code || "", "response");
    downloadCsv(
      `${slug(classCode, "class")}-assessment-${code}-${today()}.csv`,
      toCsv(csvRows(rows)),
    );
  }

  const canExport = saved.length > 0 || answeredCount(current) > 0;
  const canSubmit = canExport && submitPasscode.trim() !== "";
  const missingExplanations = current.answers.filter(
    (a) => a.rating !== null && !a.explanation.trim(),
  ).length;

  return (
    <div className="form-ui" data-clarity-mask="true">
      <h2>Assessment information</h2>
      <div className="fieldrow">
        <label className="field">
          <span>Assessment point</span>
          <select
            value={current.point}
            onChange={(e) =>
              setCurrent((p) => ({
                ...p,
                point: e.target.value as Response["point"],
              }))
            }
          >
            <option value="">Select</option>
            <option value="Pre">Pre-assessment</option>
            <option value="Post">Post-assessment</option>
          </select>
        </label>
        <label className="field">
          <span>Anonymous matching code</span>
          <input
            type="text"
            value={current.code}
            onChange={(e) =>
              setCurrent((p) => ({ ...p, code: e.target.value }))
            }
            placeholder="Use the same code both times"
            autoComplete="off"
          />
        </label>
        <label className="field">
          <span>Vendor Team</span>
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
        Choose a code you will remember but that does not identify you, and use
        the identical code on the post-assessment. Matching the two is what makes
        the change measurable.
      </p>

      <h2>Assessment questions</h2>
      {questions.map((q, i) => (
        <section className="q" key={i}>
          <p className="q-stem">
            <span className="n">{i + 1}.</span>
            {q.stem}
          </p>
          <div
            className="optgroup seven"
            role="radiogroup"
            aria-label={`Question ${i + 1} confidence rating`}
          >
            {scale.map(([n, short]) => (
              <label className="opt" key={n}>
                <input
                  type="radio"
                  name={`q-${i}`}
                  value={n}
                  checked={current.answers[i]?.rating === n}
                  onChange={() => setAnswer(i, { rating: n })}
                />
                <span className="rating">{n}</span>
                <span className="word">{short}</span>
              </label>
            ))}
          </div>
          <p className="q-prompt">
            <strong>Explain your rating:</strong> {q.prompt}
          </p>
          <textarea
            value={current.answers[i]?.explanation ?? ""}
            onChange={(e) => setAnswer(i, { explanation: e.target.value })}
            aria-label={`Question ${i + 1} explanation`}
            rows={4}
          />
        </section>
      ))}

      <h2>Your totals</h2>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Domain</th>
              <th className="num">Questions</th>
              <th className="num">Possible</th>
              <th className="num">Your total</th>
            </tr>
          </thead>
          <tbody>
            {domains.map((d) => (
              <tr key={d.name}>
                <td>{d.name}</td>
                <td className="num">
                  {d.from}-{d.to}
                </td>
                <td className="num">{d.possible}</td>
                <td className="num">{subtotal(current, d) ?? "—"}</td>
              </tr>
            ))}
            <tr>
              <td>
                <strong>Overall self-reported confidence</strong>
              </td>
              <td className="num">1-10</td>
              <td className="num">10-70</td>
              <td className="num">
                <strong>{overall ?? "—"}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="buttonrow">
        <button
          type="button"
          className="primary"
          onClick={saveCurrent}
          disabled={answeredCount(current) === 0}
        >
          Save this response
        </button>
        <button type="button" onClick={exportAll} disabled={!canExport}>
          Export to spreadsheet (CSV)
        </button>
      </div>

      <div className="tally">
        <span className="status">
          {answeredCount(current)} of {questions.length} questions answered
          {missingExplanations > 0
            ? ` · ${missingExplanations} still need a written explanation`
            : ""}
        </span>
        <span className="total">
          {overall ?? "—"} <small>/ 70</small>
        </span>
      </div>

      {saved.length > 0 && (
        <>
          <h2>Saved responses on this device</h2>
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th className="num">Point</th>
                  <th>Code</th>
                  <th className="num">Date</th>
                  <th className="num">Answered</th>
                  <th className="num">Overall</th>
                  <th className="num">Actions</th>
                </tr>
              </thead>
              <tbody>
                {saved.map((r) => (
                  <tr key={r.id}>
                    <td className="num">{r.point || "—"}</td>
                    <td>{r.code || "—"}</td>
                    <td className="num">{r.date}</td>
                    <td className="num">
                      {answeredCount(r)}/{questions.length}
                    </td>
                    <td className="num">
                      {r.answers.every((a) => a.rating !== null)
                        ? r.answers.reduce((s, a) => s + (a.rating ?? 0), 0)
                        : "—"}
                    </td>
                    <td className="num">
                      <button
                        type="button"
                        onClick={() => {
                          setSaved((prev) =>
                            prev.filter((x) => x.id !== r.id),
                          );
                          setCurrent(r);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        Edit
                      </button>{" "}
                      <button
                        type="button"
                        className="danger"
                        onClick={() =>
                          setSaved((prev) => prev.filter((x) => x.id !== r.id))
                        }
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <section className="intake">
        <h2>Submit to the instructor</h2>
        <p className="status">
          Sends your responses straight to the instructor dashboard, so there
          is no file to hand in. The class passcode is the one your professor
          reads out. Your pre- and post-assessments are stored separately, so
          submitting the post never overwrites the pre.
        </p>
        <div className="fieldrow">
          <label className="field">
            <span>Class passcode</span>
            <input
              type="password"
              value={submitPasscode}
              autoComplete="off"
              onChange={(e) => {
                setSubmitPasscode(e.target.value);
                setSubmitState({ status: "idle" });
              }}
            />
          </label>
        </div>
        <div className="buttonrow">
          <button
            type="button"
            className="primary"
            onClick={submitAll}
            disabled={!canSubmit || submitState.status === "sending"}
          >
            {submitState.status === "sending"
              ? "Submitting\u2026"
              : "Submit to instructor"}
          </button>
        </div>
        {submitState.message && (
          <p
            className={
              submitState.status === "sent" ? "status" : "status incomplete"
            }
            role="alert"
          >
            {submitState.message}
          </p>
        )}
      </section>

      <div className="buttonrow">
        <button
          type="button"
          className="danger"
          onClick={() => {
            if (
              window.confirm(
                "Clear this response and every saved response in this browser? Export first if you have not already.",
              )
            ) {
              setSaved([]);
              setCurrent(emptyResponse());
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
