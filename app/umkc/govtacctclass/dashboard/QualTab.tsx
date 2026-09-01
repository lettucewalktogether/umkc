"use client";

import { useMemo, useState } from "react";
import Cite from "@/app/Cite";
import { classCode } from "@/lib/course";
import { questions } from "@/lib/assessment";
import { codebook, type Coding, type Unit } from "@/lib/coding";
import { type AssessmentRecord } from "@/lib/dashboard";
import { cohensKappa, fmt, formatP, mcNemarExact } from "@/lib/stats";
import { downloadCsv, slug, toCsv, today } from "@/lib/csv";

const CODERS = ["Coder 1", "Coder 2"] as const;

function buildUnits(records: AssessmentRecord[]): Unit[] {
  const units: Unit[] = [];
  for (const r of records) {
    if (r.point !== "Pre" && r.point !== "Post") continue;
    r.explanations.forEach((text, i) => {
      if (!text.trim()) return;
      units.push({
        id: `${r.code.trim().toLowerCase()}::${r.point}::${i + 1}`,
        code: r.code.trim().toLowerCase(),
        point: r.point as "Pre" | "Post",
        question: i + 1,
        text,
      });
    });
  }
  return units;
}

export default function QualTab({
  records,
  coding,
  setCoding,
}: {
  records: AssessmentRecord[];
  coding: Coding;
  setCoding: (updater: (prev: Coding) => Coding) => void;
}) {
  const [coder, setCoder] = useState<string>(CODERS[0]);
  const [questionFilter, setQuestionFilter] = useState<number | "all">("all");
  const [pointFilter, setPointFilter] = useState<"all" | "Pre" | "Post">("all");
  const [uncodedOnly, setUncodedOnly] = useState(false);

  const units = useMemo(() => buildUnits(records), [records]);

  const visible = units.filter(
    (u) =>
      (questionFilter === "all" || u.question === questionFilter) &&
      (pointFilter === "all" || u.point === pointFilter) &&
      (!uncodedOnly || (coding[u.id]?.[coder] ?? []).length === 0),
  );

  if (records.length === 0) {
    return (
      <p className="saved-empty">
        No assessments yet. Open responses appear here for coding as students submit them.
      </p>
    );
  }

  function toggle(unitId: string, codeKey: string) {
    setCoding((prev) => {
      const forUnit = { ...(prev[unitId] ?? {}) };
      const current = new Set(forUnit[coder] ?? []);
      if (current.has(codeKey)) current.delete(codeKey);
      else current.add(codeKey);
      forUnit[coder] = [...current];
      return { ...prev, [unitId]: forUnit };
    });
  }

  function has(unitId: string, codeKey: string, who: string): boolean {
    return (coding[unitId]?.[who] ?? []).includes(codeKey);
  }

  // Reliability: units both coders have touched, per code, as presence/absence.
  const doubleCoded = units.filter(
    (u) =>
      coding[u.id]?.[CODERS[0]] !== undefined &&
      coding[u.id]?.[CODERS[1]] !== undefined,
  );

  const reliability = codebook.map((c) => {
    const a = doubleCoded.map((u) => (has(u.id, c.key, CODERS[0]) ? "1" : "0"));
    const b = doubleCoded.map((u) => (has(u.id, c.key, CODERS[1]) ? "1" : "0"));
    return { code: c, kappa: cohensKappa(a, b) };
  });

  // Frequency and paired change, using Coder 1 as the reference coding.
  const codesByStudent = new Map<
    string,
    { pre?: Set<string>; post?: Set<string> }
  >();
  for (const u of units) {
    const applied = new Set(coding[u.id]?.[CODERS[0]] ?? []);
    if (applied.size === 0 && coding[u.id]?.[CODERS[0]] === undefined) continue;
    const entry = codesByStudent.get(u.code) ?? {};
    const key = u.point === "Pre" ? "pre" : "post";
    entry[key] = new Set([...(entry[key] ?? []), ...applied]);
    codesByStudent.set(u.code, entry);
  }
  const pairedStudents = [...codesByStudent.entries()].filter(
    ([, v]) => v.pre !== undefined && v.post !== undefined,
  );

  const frequency = codebook.map((c) => {
    const preFlags = pairedStudents.map(([, v]) => v.pre!.has(c.key));
    const postFlags = pairedStudents.map(([, v]) => v.post!.has(c.key));
    return {
      code: c,
      nPre: preFlags.filter(Boolean).length,
      nPost: postFlags.filter(Boolean).length,
      mcnemar: mcNemarExact(preFlags, postFlags),
    };
  });

  const codedCount = units.filter(
    (u) => coding[u.id]?.[coder] !== undefined,
  ).length;

  function exportCoding() {
    const rows: (string | number)[][] = [
      [
        "Class code",
        "Matching code",
        "Assessment point",
        "Question",
        "Response text",
        ...CODERS.flatMap((c) => codebook.map((k) => `${c}: ${k.label}`)),
      ],
    ];
    for (const u of units) {
      rows.push([
        classCode,
        u.code,
        u.point,
        u.question,
        u.text,
        ...CODERS.flatMap((who) =>
          codebook.map((k) => (has(u.id, k.key, who) ? 1 : 0)),
        ),
      ]);
    }

    rows.push([]);
    rows.push(["Inter-coder reliability (Cohen's kappa), double-coded units only"]);
    rows.push([
      "Code",
      "Double-coded units",
      "Observed agreement",
      "Expected agreement",
      "Kappa",
      "Interpretation",
    ]);
    for (const r of reliability) {
      rows.push([
        r.code.label,
        r.kappa?.n ?? 0,
        r.kappa ? Number(r.kappa.observedAgreement.toFixed(3)) : "",
        r.kappa ? Number(r.kappa.expectedAgreement.toFixed(3)) : "",
        r.kappa && !isNaN(r.kappa.kappa)
          ? Number(r.kappa.kappa.toFixed(3))
          : "",
        r.kappa?.interpretation ?? "",
      ]);
    }

    rows.push([]);
    rows.push([
      `Code frequency and paired change (Coder 1), ${pairedStudents.length} students with both points coded`,
    ]);
    rows.push([
      "Code",
      "Students showing code at pre",
      "Students showing code at post",
      "Lost (pre only)",
      "Gained (post only)",
      "McNemar exact p",
    ]);
    for (const f of frequency) {
      rows.push([
        f.code.label,
        f.nPre,
        f.nPost,
        f.mcnemar?.b ?? "",
        f.mcnemar?.c ?? "",
        f.mcnemar ? Number(f.mcnemar.p.toFixed(6)) : "",
      ]);
    }

    downloadCsv(
      `${slug(classCode, "class")}-qualitative-coding-${today()}.csv`,
      toCsv(rows),
    );
  }

  return (
    <>
      <div className="panel">
        <span className="label">Method</span>
        <p>
          Deductive content analysis <Cite k={["elo2008", "krippendorff2018"]} />
          : the coding frame below is fixed in advance from the categories the
          assessment instrument specifies, rather than derived from the
          responses. The unit of analysis is one respondent&rsquo;s paragraph on
          one item at one assessment point. Codes are not mutually exclusive.
        </p>
        <p>
          Code a subset twice, once as each coder, to produce the agreement
          statistics <Cite k={["cohen1960", "landis1977"]} />. Coder 1 is treated
          as the reference coding for the frequency and change table.
        </p>
      </div>

      <div className="fieldrow form-ui">
        <label className="field">
          <span>Coding as</span>
          <select value={coder} onChange={(e) => setCoder(e.target.value)}>
            {CODERS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Item</span>
          <select
            value={questionFilter}
            onChange={(e) =>
              setQuestionFilter(
                e.target.value === "all" ? "all" : Number(e.target.value),
              )
            }
          >
            <option value="all">All items</option>
            {questions.map((_, i) => (
              <option key={i} value={i + 1}>
                Q{i + 1}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Assessment point</span>
          <select
            value={pointFilter}
            onChange={(e) =>
              setPointFilter(e.target.value as "all" | "Pre" | "Post")
            }
          >
            <option value="all">Both</option>
            <option value="Pre">Pre only</option>
            <option value="Post">Post only</option>
          </select>
        </label>
      </div>
      <div className="buttonrow">
        <label className="checkline">
          <input
            type="checkbox"
            checked={uncodedOnly}
            onChange={(e) => setUncodedOnly(e.target.checked)}
          />
          Show only responses I have not coded
        </label>
        <button type="button" onClick={exportCoding}>
          Export coding and reliability (CSV)
        </button>
      </div>
      <p className="status">
        {units.length} codeable responses loaded · {codedCount} coded by {coder}{" "}
        · {doubleCoded.length} double-coded · showing {visible.length}
      </p>

      <details className="disclosure">
        <summary>Codebook definitions</summary>
        <dl className="codebook">
          {codebook.map((c) => (
            <div key={c.key}>
              <dt>{c.label}</dt>
              <dd>{c.definition}</dd>
            </div>
          ))}
        </dl>
      </details>

      <h3>Code the responses</h3>
      {visible.length === 0 ? (
        <p className="saved-empty">No responses match these filters.</p>
      ) : (
        visible.slice(0, 200).map((u) => (
          <div className="unit" key={u.id}>
            <div className="unit-meta">
              <span>
                <strong>{u.code || "(no code)"}</strong> · {u.point} · Q
                {u.question}
              </span>
            </div>
            <p className="unit-text">{u.text}</p>
            <div className="codechips">
              {codebook.map((c) => (
                <label
                  className={`chip${has(u.id, c.key, coder) ? " on" : ""}`}
                  key={c.key}
                  title={c.definition}
                >
                  <input
                    type="checkbox"
                    checked={has(u.id, c.key, coder)}
                    onChange={() => toggle(u.id, c.key)}
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </div>
        ))
      )}
      {visible.length > 200 && (
        <p className="status">
          Showing the first 200 of {visible.length}. Filter by item or
          assessment point to reach the rest.
        </p>
      )}

      <h3>Inter-coder reliability</h3>
      {doubleCoded.length === 0 ? (
        <p className="saved-empty">
          No units have been coded by both coders yet. Switch the coder selector
          and code the same responses again to produce kappa.
        </p>
      ) : (
        <>
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th className="num">Units</th>
                  <th className="num">Agreement</th>
                  <th className="num sym">κ</th>
                  <th>Interpretation</th>
                </tr>
              </thead>
              <tbody>
                {reliability.map((r) => (
                  <tr key={r.code.key}>
                    <td>{r.code.label}</td>
                    <td className="num">{r.kappa?.n ?? 0}</td>
                    <td className="num">
                      {r.kappa
                        ? `${(r.kappa.observedAgreement * 100).toFixed(0)}%`
                        : "—"}
                    </td>
                    <td className="num">
                      {r.kappa ? fmt(r.kappa.kappa, 3) : "—"}
                    </td>
                    <td>{r.kappa?.interpretation ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="status">
            Bands follow <Cite k="landis1977" parens={false} />. Kappa is
            unstable when a code is very rare, so read it next to the unit count
            and the raw agreement.
          </p>
        </>
      )}

      <h3>Code frequency and paired change</h3>
      {pairedStudents.length === 0 ? (
        <p className="saved-empty">
          No student has coded responses at both assessment points yet.
        </p>
      ) : (
        <>
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th className="num">Pre</th>
                  <th className="num">Post</th>
                  <th className="num">Lost</th>
                  <th className="num">Gained</th>
                  <th className="num sym">McNemar p</th>
                </tr>
              </thead>
              <tbody>
                {frequency.map((f) => (
                  <tr key={f.code.key}>
                    <td>{f.code.label}</td>
                    <td className="num">{f.nPre}</td>
                    <td className="num">{f.nPost}</td>
                    <td className="num">{f.mcnemar?.b ?? "—"}</td>
                    <td className="num">{f.mcnemar?.c ?? "—"}</td>
                    <td className="num">
                      {f.mcnemar ? formatP(f.mcnemar.p) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="status">
            Counts are students, not responses: a student shows a code if any of
            their coded paragraphs at that point carries it. The exact binomial
            McNemar test <Cite k="mcnemar1947" /> asks whether the students who
            gained a code outnumber those who lost it, among the{" "}
            {pairedStudents.length} with both points coded.
          </p>
        </>
      )}
    </>
  );
}
