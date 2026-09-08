"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import TeamScores from "./TeamScores";
import QuantTab from "./QuantTab";
import QualTab from "./QualTab";
import SentimentTab from "./SentimentTab";
import MethodsTab from "./MethodsTab";
import CompletionTab from "./CompletionTab";
import { classCode, course } from "@/lib/course";
import { cohortLabel, type Cohort } from "@/lib/cohorts";
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

const SECTIONS = [
  { key: "assessment", label: "Class assessment" },
  { key: "evals", label: "Presentation evaluations" },
  { key: "methods", label: "Methods" },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

const ASSESSMENT_TABS = [
  { key: "completion", label: "Completion" },
  { key: "quant", label: "Quantitative" },
  { key: "qual", label: "Qualitative" },
  { key: "sentiment", label: "Sentiment" },
] as const;

type AssessmentTabKey = (typeof ASSESSMENT_TABS)[number]["key"];

const CODING_KEY = "umkc-govtacct-coding-v1";

type LoadedFile = { name: string; kind: string; rows: number };

/** One stored submission, as the API returns it. */
type SubmittedFile = {
  pathname: string;
  kind: "eval" | "assessment";
  cohort: string;
  uploadedAt: string;
  csv: string;
};

/** Shown in the cohort filter when submissions span more than one. */
const ALL_COHORTS = "__all__";

export default function Dashboard() {
  const [section, setSection] = useState<SectionKey>("assessment");
  const [assessmentTab, setAssessmentTab] =
    useState<AssessmentTabKey>("completion");
  const [uploadedEval, setUploadedEval] = useState<EvalRecord[]>([]);
  const [uploadedAssessment, setUploadedAssessment] = useState<
    AssessmentRecord[]
  >([]);
  const [submittedFiles, setSubmittedFiles] = useState<SubmittedFile[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [cohortFilter, setCohortFilter] = useState<string>(ALL_COHORTS);
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [onlyComplete, setOnlyComplete] = useState(false);
  const [coding, setCodingState] = useState<Coding>({});
  const [codingLoaded, setCodingLoaded] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");


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
      const res = await fetch("/umkc/govtacctclass/api/submissions", { cache: "no-store" });
      if (!res.ok) {
        setSubmitStatus("error");
        return;
      }
      const data = (await res.json()) as {
        cohorts?: Cohort[];
        files?: SubmittedFile[];
      };
      setCohorts(data.cohorts ?? []);
      setSubmittedFiles(data.files ?? []);
      setSubmitStatus("ready");
    } catch {
      setSubmitStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadSubmitted();
  }, [loadSubmitted]);

  /** Sets a cohort aside. Nothing is deleted; the archive page still has it. */
  async function archive(kind: "eval" | "assessment", cohort: string | null) {
    const what =
      kind === "eval" ? "presentation evaluations" : "assessment responses";
    const where = cohort ? cohortLabel(cohorts, cohort) : "every cohort";
    if (
      !window.confirm(
        `Archive the ${what} for ${where}? They leave this dashboard but stay readable on the archive page.`,
      )
    ) {
      return;
    }
    try {
      const res = await fetch("/umkc/govtacctclass/api/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: "active", to: "archived", kind, cohort }),
      });
      if (!res.ok) {
        setSubmitStatus("error");
        return;
      }
      await loadSubmitted();
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
      setUploadedEval((prev) => dedupeEval([...prev, ...newEval]));
    }
    if (newAssessment.length) {
      setUploadedAssessment((prev) =>
        dedupeAssessment([...prev, ...newAssessment]),
      );
    }
    setFiles((prev) => [...prev, ...nextFiles]);
    setErrors(nextErrors);
  }

  const visibleFiles = useMemo(
    () =>
      submittedFiles.filter(
        (f) => cohortFilter === ALL_COHORTS || f.cohort === cohortFilter,
      ),
    [submittedFiles, cohortFilter],
  );

  const evalRecords = useMemo(
    () =>
      dedupeEval([
        ...visibleFiles.flatMap((f) =>
          f.kind === "eval" ? parseEvalCsv(f.csv) : [],
        ),
        ...uploadedEval,
      ]),
    [visibleFiles, uploadedEval],
  );

  const assessmentRecords = useMemo(
    () =>
      dedupeAssessment([
        ...visibleFiles.flatMap((f) =>
          f.kind === "assessment" ? parseAssessmentCsv(f.csv) : [],
        ),
        ...uploadedAssessment,
      ]),
    [visibleFiles, uploadedAssessment],
  );

  /** Cohorts that actually have submissions, newest window first. */
  const presentCohorts = useMemo(() => {
    const ids = [...new Set(submittedFiles.map((f) => f.cohort))];
    return ids.sort((a, b) => cohortLabel(cohorts, a).localeCompare(cohortLabel(cohorts, b)));
  }, [submittedFiles, cohorts]);

  const submittedCount = visibleFiles.length;

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
              : "Refresh submissions"}
          </button>
          <a className="buttonlink" href={`${course.basePath}/dashboard/archive`}>
            Open archive
          </a>
        </div>

        {presentCohorts.length > 0 && (
          <label className="field">
            <span>Cohort</span>
            <select
              value={cohortFilter}
              onChange={(e) => setCohortFilter(e.target.value)}
            >
              <option value={ALL_COHORTS}>
                All cohorts ({submittedFiles.length})
              </option>
              {presentCohorts.map((id) => (
                <option key={id} value={id}>
                  {cohortLabel(cohorts, id)} (
                  {submittedFiles.filter((f) => f.cohort === id).length})
                </option>
              ))}
            </select>
          </label>
        )}
        <p className={submitStatus === "error" ? "status incomplete" : "status"}>
          {submitStatus === "loading" &&
            "Loading submitted evaluations and assessments\u2026"}
          {submitStatus === "ready" &&
            (submittedCount === 0
              ? "Nothing has been submitted yet. Students can still hand in CSV files below."
              : `${submittedCount} submission${
                  submittedCount === 1 ? "" : "s"
                } loaded: ${assessmentRecords.length} assessment response${
                  assessmentRecords.length === 1 ? "" : "s"
                } and ${evalRecords.length} presentation evaluation${
                  evalRecords.length === 1 ? "" : "s"
                }. Load CSV files below for anyone who has not submitted.`)}
          {submitStatus === "error" &&
            "Could not load submissions. Load the CSV files below instead."}
        </p>
      </section>

      <details className="intake">
        <summary>Load exported spreadsheets (only if someone could not submit)</summary>
        <label className="field">
          <span>Choose CSV files</span>
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
          Submitted work loads on its own; this is the fallback for a student
          whose submission failed. Presentation scores and assessments can be
          loaded together and in any order. Files are read in this browser and
          never uploaded, and rows already submitted are collapsed
          automatically.
        </p>
      </details>

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
              setUploadedEval([]);
              setUploadedAssessment([]);
              setFiles([]);
              setErrors([]);
            }}
          >
            Clear loaded files
          </button>
        </div>
      )}

      <nav className="sections" aria-label="Dashboard">
        {SECTIONS.map((sec) => (
          <button
            key={sec.key}
            type="button"
            className={section === sec.key ? "section on" : "section"}
            aria-current={section === sec.key ? "page" : undefined}
            onClick={() => setSection(sec.key)}
          >
            <span className="section-label">{sec.label}</span>
            <span className="section-count">
              {sec.key === "assessment" &&
                `${assessmentRecords.length} response${
                  assessmentRecords.length === 1 ? "" : "s"
                }`}
              {sec.key === "evals" &&
                `${evalRecords.length} evaluation${
                  evalRecords.length === 1 ? "" : "s"
                }`}
              {sec.key === "methods" && "Both instruments"}
            </span>
          </button>
        ))}
      </nav>

      {section === "assessment" && (
        <div className="tabpanel">
          <div className="pagehead">
            <p className="eyebrow">Instrument 1 of 2</p>
            <h2>Class assessment</h2>
            <p className="lede">
              Confidence in government accounting and government process,
              measured with the same ten questions before and after the unit.
              Nothing on this dashboard comes from the presentation
              evaluations.
            </p>
          </div>

          <div className="buttonrow">
            <button
              type="button"
              onClick={() =>
                void archive(
                  "assessment",
                  cohortFilter === ALL_COHORTS ? null : cohortFilter,
                )
              }
              disabled={assessmentRecords.length === 0}
            >
              Archive these assessment responses
            </button>
          </div>

          <nav className="tabs" aria-label="Class assessment views">
            {ASSESSMENT_TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                className={assessmentTab === t.key ? "tab on" : "tab"}
                aria-current={assessmentTab === t.key ? "page" : undefined}
                onClick={() => setAssessmentTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div className="tabpanel">
            {assessmentTab === "completion" && (
              <CompletionTab
                records={assessmentRecords}
                cohort={cohortFilter === ALL_COHORTS ? null : cohortFilter}
              />
            )}
            {assessmentTab === "quant" && (
              <QuantTab records={assessmentRecords} />
            )}
            {assessmentTab === "qual" && (
              <QualTab
                records={assessmentRecords}
                coding={coding}
                setCoding={(updater) => setCodingState((prev) => updater(prev))}
              />
            )}
            {assessmentTab === "sentiment" && (
              <SentimentTab records={assessmentRecords} />
            )}
          </div>
        </div>
      )}

      {section === "evals" && (
        <div className="tabpanel">
          <div className="pagehead">
            <p className="eyebrow">Instrument 2 of 2</p>
            <h2>Presentation evaluations</h2>
            <p className="lede">
              How each team scored under the six published rubric criteria,
              from the evaluations students submitted. Nothing on this
              dashboard comes from the class assessment.
            </p>
          </div>

          <div className="buttonrow">
            <button
              type="button"
              onClick={() =>
                void archive(
                  "eval",
                  cohortFilter === ALL_COHORTS ? null : cohortFilter,
                )
              }
              disabled={evalRecords.length === 0}
            >
              Archive these presentation evaluations
            </button>
          </div>

          <TeamScores
            records={evalRecords}
            onlyComplete={onlyComplete}
            setOnlyComplete={setOnlyComplete}
          />
        </div>
      )}

      {section === "methods" && (
        <div className="tabpanel">
          <div className="pagehead">
            <p className="eyebrow">Both instruments</p>
            <h2>Methods</h2>
            <p className="lede">
              A draft methods section covering the assessment and the
              presentation evaluations, with every test and source named.
            </p>
          </div>

          <MethodsTab
            evalRecords={evalRecords}
            assessmentRecords={assessmentRecords}
          />
        </div>
      )}
    </div>
  );
}
