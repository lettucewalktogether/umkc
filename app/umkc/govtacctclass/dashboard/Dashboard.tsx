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
import {
  dedupeAssessment,
  dedupeEval,
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
  const [submittedFiles, setSubmittedFiles] = useState<SubmittedFile[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [cohortFilter, setCohortFilter] = useState<string>(ALL_COHORTS);
  const [onlyComplete, setOnlyComplete] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");


  // Submissions are the only source; dedupe collapses a student who
  // resubmitted before the store overwrote their previous file.
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
        current?: string | null;
        files?: SubmittedFile[];
      };
      const files = data.files ?? [];
      setCohorts(data.cohorts ?? []);
      setSubmittedFiles(files);
      // Open on the cohort running today rather than on everything ever
      // collected. Only when no cohort window covers today does it fall back
      // to showing all of them.
      setCohortFilter((prev) =>
        prev === ALL_COHORTS ? (data.current ?? ALL_COHORTS) : prev,
      );
      setSubmitStatus("ready");
    } catch {
      setSubmitStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadSubmitted();
  }, [loadSubmitted]);

  /** Hides a whole cohort, both instruments, in one action. */
  async function hideCohort(cohort: string) {
    if (
      !window.confirm(
        `Hide everything in ${cohortLabel(
          cohorts,
          cohort,
        )} from this dashboard? Nothing is deleted — it moves to the archive, where you can bring it back at any time.`,
      )
    ) {
      return;
    }
    try {
      for (const kind of ["assessment", "eval"] as const) {
        const res = await fetch("/umkc/govtacctclass/api/submissions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "active",
            to: "archived",
            kind,
            cohort,
          }),
        });
        if (!res.ok) {
          setSubmitStatus("error");
          return;
        }
      }
      setCohortFilter(ALL_COHORTS);
      await loadSubmitted();
    } catch {
      setSubmitStatus("error");
    }
  }

  /** Sets a cohort aside. Nothing is deleted; the archive page still has it. */
  async function archive(kind: "eval" | "assessment", cohort: string | null) {
    const what =
      kind === "eval" ? "presentation evaluations" : "assessment responses";
    const where = cohort ? cohortLabel(cohorts, cohort) : "every cohort";
    if (
      !window.confirm(
        `Hide the ${what} for ${where}? Nothing is deleted — they move to the archive, where you can bring them back at any time.`,
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
      ]),
    [visibleFiles],
  );

  const assessmentRecords = useMemo(
    () =>
      dedupeAssessment([
        ...visibleFiles.flatMap((f) =>
          f.kind === "assessment" ? parseAssessmentCsv(f.csv) : [],
        ),
      ]),
    [visibleFiles],
  );

  /** Cohorts to offer: any with submissions, plus whichever is selected even
   *  when it is empty, so the current run is always reachable. */
  const presentCohorts = useMemo(() => {
    const ids = new Set(submittedFiles.map((f) => f.cohort));
    if (cohortFilter !== ALL_COHORTS) ids.add(cohortFilter);
    return [...ids].sort((a, b) =>
      cohortLabel(cohorts, a).localeCompare(cohortLabel(cohorts, b)),
    );
  }, [submittedFiles, cohorts, cohortFilter]);

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
                All cohorts &mdash; {submittedFiles.length}{" "}
                {submittedFiles.length === 1 ? "submission" : "submissions"}
              </option>
              {presentCohorts.map((id) => {
                const n = submittedFiles.filter((f) => f.cohort === id).length;
                return (
                  <option key={id} value={id}>
                    {cohortLabel(cohorts, id)} &mdash; {n}{" "}
                    {n === 1 ? "submission" : "submissions"}
                  </option>
                );
              })}
            </select>
          </label>
        )}

        {cohortFilter !== ALL_COHORTS && (
          <div className="buttonrow">
            <button
              type="button"
              onClick={() => void hideCohort(cohortFilter)}
              disabled={submittedCount === 0}
            >
              Hide this cohort from the dashboard
            </button>
          </div>
        )}
        <p className={submitStatus === "error" ? "status incomplete" : "status"}>
          {submitStatus === "loading" &&
            "Loading submitted evaluations and assessments\u2026"}
          {submitStatus === "ready" &&
            (submittedCount === 0
              ? "Nothing has been submitted yet."
              : `${submittedCount} submission${
                  submittedCount === 1 ? "" : "s"
                } loaded: ${assessmentRecords.length} assessment response${
                  assessmentRecords.length === 1 ? "" : "s"
                } and ${evalRecords.length} presentation evaluation${
                  evalRecords.length === 1 ? "" : "s"
                }.`)}
          {submitStatus === "error" &&
            "Could not load submissions. Try Refresh submissions."}
        </p>
      </section>

      {foreignCodes.length > 0 && (
        <p className="status incomplete">
          Some rows carry a different class code ({foreignCodes.join(", ")}) than
          this deployment ({classCode}). They are still included — check that
          they belong to this class before reporting.
        </p>
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
              Hide these assessment responses
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
              <QualTab records={assessmentRecords} />
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
              Hide these presentation evaluations
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
