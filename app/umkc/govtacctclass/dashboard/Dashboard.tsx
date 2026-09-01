"use client";

import { useCallback, useEffect, useState } from "react";
import TeamScores from "./TeamScores";
import QuantTab from "./QuantTab";
import QualTab from "./QualTab";
import SentimentTab from "./SentimentTab";
import MethodsTab from "./MethodsTab";
import { classCode } from "@/lib/course";
import { type Coding } from "@/lib/coding";
import {
  dedupeAssessment,
  dedupeEval,
  detectKind,
  parseAssessmentCsv,
  parseEvalCsv,
  type AssessmentRecord,
  type EvalRecord,
} from "@/lib/dashboard";

const TABS = [
  { key: "teams", label: "Team scores" },
  { key: "quant", label: "Quantitative" },
  { key: "qual", label: "Qualitative" },
  { key: "sentiment", label: "Sentiment" },
  { key: "methods", label: "Methods" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const CODING_KEY = "umkc-govtacct-coding-v1";

type LoadedFile = { name: string; kind: string; rows: number };

export default function Dashboard() {
  const [tab, setTab] = useState<TabKey>("teams");
  const [evalRecords, setEvalRecords] = useState<EvalRecord[]>([]);
  const [assessmentRecords, setAssessmentRecords] = useState<
    AssessmentRecord[]
  >([]);
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [onlyComplete, setOnlyComplete] = useState(false);
  const [coding, setCodingState] = useState<Coding>({});
  const [codingLoaded, setCodingLoaded] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [submittedCount, setSubmittedCount] = useState(0);

  // Coding is slow to redo, so it persists in this browser between sessions.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CODING_KEY);
      if (raw) setCodingState(JSON.parse(raw) as Coding);
    } catch {
      /* start with no coding */
    }
    setCodingLoaded(true);
  }, []);

  useEffect(() => {
    if (!codingLoaded) return;
    try {
      window.localStorage.setItem(CODING_KEY, JSON.stringify(coding));
    } catch {
      /* coding still works for this session */
    }
  }, [coding, codingLoaded]);

  // Submitted evaluations arrive from the blob store; uploaded files still
  // work alongside them, and dedupeEval collapses any overlap.
  const loadSubmitted = useCallback(async () => {
    setSubmitStatus("loading");
    try {
      const res = await fetch("/api/eval", { cache: "no-store" });
      if (!res.ok) {
        setSubmitStatus("error");
        return;
      }
      const data = (await res.json()) as {
        files?: { pathname: string; csv: string }[];
      };
      const rows = (data.files ?? []).flatMap((f) =>
        detectKind(f.csv) === "eval" ? parseEvalCsv(f.csv) : [],
      );
      setSubmittedCount(data.files?.length ?? 0);
      if (rows.length) setEvalRecords((prev) => dedupeEval([...prev, ...rows]));
      setSubmitStatus("ready");
    } catch {
      setSubmitStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadSubmitted();
  }, [loadSubmitted]);

  async function clearSubmitted() {
    if (
      !window.confirm(
        "Permanently delete every submitted evaluation from the server? Export anything you still need first. Files you loaded by hand are not affected.",
      )
    ) {
      return;
    }
    try {
      const res = await fetch("/api/eval", { method: "DELETE" });
      if (!res.ok) {
        setSubmitStatus("error");
        return;
      }
      setSubmittedCount(0);
      setEvalRecords([]);
      setSubmitStatus("ready");
    } catch {
      setSubmitStatus("error");
    }
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const nextErrors: string[] = [];
    const nextFiles: LoadedFile[] = [];
    let newEval: EvalRecord[] = [];
    let newAssessment: AssessmentRecord[] = [];

    for (const file of Array.from(fileList)) {
      let text: string;
      try {
        text = await file.text();
      } catch {
        nextErrors.push(`${file.name}: could not be read.`);
        continue;
      }

      const kind = detectKind(text);
      if (kind === "eval") {
        const rows = parseEvalCsv(text);
        newEval = newEval.concat(rows);
        nextFiles.push({ name: file.name, kind: "Presentation scores", rows: rows.length });
      } else if (kind === "assessment") {
        const rows = parseAssessmentCsv(text);
        newAssessment = newAssessment.concat(rows);
        nextFiles.push({ name: file.name, kind: "Assessment", rows: rows.length });
      } else {
        nextErrors.push(
          `${file.name}: not recognized. Load the CSV files exported from the evaluation or assessment pages, unedited.`,
        );
      }
    }

    if (newEval.length) {
      setEvalRecords((prev) => dedupeEval([...prev, ...newEval]));
    }
    if (newAssessment.length) {
      setAssessmentRecords((prev) =>
        dedupeAssessment([...prev, ...newAssessment]),
      );
    }
    setFiles((prev) => [...prev, ...nextFiles]);
    setErrors(nextErrors);
  }

  const foreignCodes = [
    ...new Set(
      [...evalRecords, ...assessmentRecords]
        .map((r) => r.classCode)
        .filter((c) => c && c !== classCode),
    ),
  ];

  return (
    <div className="form-ui">
      <section className="intake">
        <div className="buttonrow">
          <button
            type="button"
            onClick={() => void loadSubmitted()}
            disabled={submitStatus === "loading"}
          >
            {submitStatus === "loading"
              ? "Checking submissions\u2026"
              : "Refresh submitted evaluations"}
          </button>
          <button
            type="button"
            className="danger"
            onClick={clearSubmitted}
            disabled={submittedCount === 0}
          >
            Delete submitted evaluations
          </button>
        </div>
        <p className={submitStatus === "error" ? "status incomplete" : "status"}>
          {submitStatus === "loading" &&
            "Loading evaluations submitted from the scoring page\u2026"}
          {submitStatus === "ready" &&
            (submittedCount === 0
              ? "No evaluations have been submitted yet. Students can still hand in CSV files below."
              : `${submittedCount} student${
                  submittedCount === 1 ? " has" : "s have"
                } submitted directly. Load CSV files below for anyone who has not.`)}
          {submitStatus === "error" &&
            "Could not load submitted evaluations. Load the CSV files below instead."}
        </p>
      </section>

      <section className="intake">
        <label className="field">
          <span>Load exported spreadsheets</span>
          <input
            type="file"
            accept=".csv,text/csv"
            multiple
            onChange={(e) => {
              void handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        <p className="status">
          Select every CSV your students exported; presentation scores and
          assessments can be loaded together and in any order. Files are read in
          this browser and never uploaded. Duplicate rows are collapsed
          automatically.
        </p>
      </section>

      {files.length > 0 && (
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Type</th>
                <th className="num">Rows</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f, i) => (
                <tr key={`${f.name}-${i}`}>
                  <td>{f.name}</td>
                  <td>{f.kind}</td>
                  <td className="num">{f.rows}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={2}>
                  <strong>After removing duplicates</strong>
                </td>
                <td className="num">
                  <strong>
                    {evalRecords.length + assessmentRecords.length}
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {errors.length > 0 && (
        <div className="panel warn">
          <span className="label">Files not loaded</span>
          <ul>
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {foreignCodes.length > 0 && (
        <p className="status incomplete">
          Some rows carry a different class code ({foreignCodes.join(", ")}) than
          this deployment ({classCode}). They are still included — check that
          they belong to this class before reporting.
        </p>
      )}

      {(evalRecords.length > 0 || assessmentRecords.length > 0) && (
        <div className="buttonrow">
          <button
            type="button"
            className="danger"
            onClick={() => {
              setEvalRecords([]);
              setAssessmentRecords([]);
              setFiles([]);
              setErrors([]);
            }}
          >
            Clear loaded files
          </button>
        </div>
      )}

      <nav className="tabs" aria-label="Dashboard sections">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={tab === t.key ? "tab on" : "tab"}
            aria-current={tab === t.key ? "page" : undefined}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="tabpanel">
        {tab === "teams" && (
          <TeamScores
            records={evalRecords}
            onlyComplete={onlyComplete}
            setOnlyComplete={setOnlyComplete}
          />
        )}
        {tab === "quant" && <QuantTab records={assessmentRecords} />}
        {tab === "qual" && (
          <QualTab
            records={assessmentRecords}
            coding={coding}
            setCoding={(updater) => setCodingState((prev) => updater(prev))}
          />
        )}
        {tab === "sentiment" && <SentimentTab records={assessmentRecords} />}
        {tab === "methods" && (
          <MethodsTab
            evalRecords={evalRecords}
            assessmentRecords={assessmentRecords}
          />
        )}
      </div>
    </div>
  );
}
