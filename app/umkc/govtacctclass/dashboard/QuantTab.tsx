"use client";

import Cite from "@/app/Cite";
import { classCode } from "@/lib/course";
import { domains, questions } from "@/lib/assessment";
import {
  domainSum,
  matchPrePost,
  overallSum,
  type AssessmentRecord,
} from "@/lib/dashboard";
import {
  benjaminiHochberg,
  cronbachAlpha,
  fmt,
  formatP,
  holmAdjust,
  interpretD,
  pairedT,
  wilcoxonSignedRank,
  type PairedT,
  type Wilcoxon,
} from "@/lib/stats";
import { downloadCsv, slug, toCsv, today } from "@/lib/csv";

type Row = {
  label: string;
  scope: "item" | "domain" | "overall";
  t: PairedT | null;
  w: Wilcoxon | null;
};

function buildRows(pairs: { pre: AssessmentRecord; post: AssessmentRecord }[]) {
  const rows: Row[] = [];

  // Item-level: one row per question, using only pairs where both are answered.
  questions.forEach((q, i) => {
    const pre: number[] = [];
    const post: number[] = [];
    for (const p of pairs) {
      const a = p.pre.ratings[i];
      const b = p.post.ratings[i];
      if (a !== null && a !== undefined && b !== null && b !== undefined) {
        pre.push(a);
        post.push(b);
      }
    }
    rows.push({
      label: `Q${i + 1}. ${q.stem}`,
      scope: "item",
      t: pairedT(pre, post),
      w: wilcoxonSignedRank(pre, post),
    });
  });

  for (const d of domains) {
    const pre: number[] = [];
    const post: number[] = [];
    for (const p of pairs) {
      const a = domainSum(p.pre, d.from, d.to);
      const b = domainSum(p.post, d.from, d.to);
      if (a !== null && b !== null) {
        pre.push(a);
        post.push(b);
      }
    }
    rows.push({
      label: `${d.name} (Q${d.from}-${d.to})`,
      scope: "domain",
      t: pairedT(pre, post),
      w: wilcoxonSignedRank(pre, post),
    });
  }

  const preAll: number[] = [];
  const postAll: number[] = [];
  for (const p of pairs) {
    const a = overallSum(p.pre);
    const b = overallSum(p.post);
    if (a !== null && b !== null) {
      preAll.push(a);
      postAll.push(b);
    }
  }
  rows.push({
    label: "Overall self-reported confidence (Q1-10)",
    scope: "overall",
    t: pairedT(preAll, postAll),
    w: wilcoxonSignedRank(preAll, postAll),
  });

  return rows;
}

/** Item scores for one assessment point, transposed for Cronbach's alpha. */
function itemMatrix(
  records: AssessmentRecord[],
  from: number,
  to: number,
): number[][] {
  const complete = records.filter((r) => {
    for (let i = from - 1; i <= to - 1; i++) {
      const v = r.ratings[i];
      if (v === null || v === undefined) return false;
    }
    return true;
  });
  const items: number[][] = [];
  for (let i = from - 1; i <= to - 1; i++) {
    items.push(complete.map((r) => r.ratings[i] as number));
  }
  return items;
}

export default function QuantTab({
  records,
}: {
  records: AssessmentRecord[];
}) {
  if (records.length === 0) {
    return (
      <p className="saved-empty">
        No assessments yet. The pre/post analysis appears here as students submit them.
      </p>
    );
  }

  const match = matchPrePost(records);
  const { pairs } = match;

  if (pairs.length < 2) {
    return (
      <>
        <MatchingPanel match={match} />
        <p className="status incomplete">
          At least two matched pre/post pairs are needed before any test can be
          computed. {pairs.length} matched so far.
        </p>
      </>
    );
  }

  const rows = buildRows(pairs);
  const itemRows = rows.filter((r) => r.scope === "item");
  const itemPs = itemRows.map((r) => r.w?.p ?? NaN);
  const holm = holmAdjust(itemPs);
  const bh = benjaminiHochberg(itemPs);

  const preRecords = pairs.map((p) => p.pre);
  const postRecords = pairs.map((p) => p.post);

  const alphas = [
    ...domains.map((d) => ({
      label: `${d.name} (Q${d.from}-${d.to})`,
      k: d.to - d.from + 1,
      pre: cronbachAlpha(itemMatrix(preRecords, d.from, d.to)),
      post: cronbachAlpha(itemMatrix(postRecords, d.from, d.to)),
    })),
    {
      label: "Full instrument (Q1-10)",
      k: questions.length,
      pre: cronbachAlpha(itemMatrix(preRecords, 1, questions.length)),
      post: cronbachAlpha(itemMatrix(postRecords, 1, questions.length)),
    },
  ];

  function exportTable() {
    const out: (string | number)[][] = [
      [
        "Class code",
        "Scope",
        "Measure",
        "n pairs",
        "M pre",
        "SD pre",
        "M post",
        "SD post",
        "Mean difference",
        "95% CI lower",
        "95% CI upper",
        "t",
        "df",
        "p (t test)",
        "Cohen's d_z",
        "Wilcoxon W",
        "Wilcoxon z",
        "p (Wilcoxon)",
        "Wilcoxon method",
        "Rank-biserial r",
        "Holm-adjusted p",
        "BH-adjusted p",
      ],
    ];
    rows.forEach((r, i) => {
      const itemIndex = r.scope === "item" ? i : -1;
      out.push([
        classCode,
        r.scope,
        r.label,
        r.t?.n ?? "",
        r.t ? Number(r.t.meanPre.toFixed(3)) : "",
        r.t ? Number(r.t.sdPre.toFixed(3)) : "",
        r.t ? Number(r.t.meanPost.toFixed(3)) : "",
        r.t ? Number(r.t.sdPost.toFixed(3)) : "",
        r.t ? Number(r.t.meanDiff.toFixed(3)) : "",
        r.t ? Number(r.t.ciLow.toFixed(3)) : "",
        r.t ? Number(r.t.ciHigh.toFixed(3)) : "",
        r.t && !isNaN(r.t.t) ? Number(r.t.t.toFixed(3)) : "",
        r.t?.df ?? "",
        r.t && !isNaN(r.t.p) ? Number(r.t.p.toFixed(6)) : "",
        r.t && !isNaN(r.t.dz) ? Number(r.t.dz.toFixed(3)) : "",
        r.w?.W ?? "",
        r.w && !isNaN(r.w.z) ? Number(r.w.z.toFixed(3)) : "",
        r.w && !isNaN(r.w.p) ? Number(r.w.p.toFixed(6)) : "",
        r.w?.method ?? "",
        r.w ? Number(r.w.rankBiserial.toFixed(3)) : "",
        itemIndex >= 0 && !isNaN(holm[itemIndex])
          ? Number(holm[itemIndex].toFixed(6))
          : "",
        itemIndex >= 0 && !isNaN(bh[itemIndex])
          ? Number(bh[itemIndex].toFixed(6))
          : "",
      ]);
    });

    out.push([]);
    out.push(["Internal consistency (Cronbach's alpha)"]);
    out.push(["Scale", "Items", "Alpha pre", "Alpha post"]);
    for (const a of alphas) {
      out.push([
        a.label,
        a.k,
        isNaN(a.pre) ? "" : Number(a.pre.toFixed(3)),
        isNaN(a.post) ? "" : Number(a.post.toFixed(3)),
      ]);
    }

    downloadCsv(
      `${slug(classCode, "class")}-assessment-statistics-${today()}.csv`,
      toCsv(out),
    );
  }

  return (
    <>
      <MatchingPanel match={match} />

      <div className="buttonrow">
        <button type="button" onClick={exportTable}>
          Export statistics table (CSV)
        </button>
      </div>

      <h3>Item-level change</h3>
      <p className="status">
        Each row compares the same students&rsquo; pre and post rating on one
        item. The Wilcoxon signed-rank test <Cite k="wilcoxon1945" /> is the
        primary test because single items are ordinal; the paired t test is
        reported alongside it because both are conventional for Likert-type data{" "}
        <Cite k="norman2010" />. Adjusted p-values control for testing all ten
        items <Cite k={["holm1979", "benjamini1995"]} />.
      </p>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th className="num sym">n</th>
              <th className="num sym">M pre (SD)</th>
              <th className="num sym">M post (SD)</th>
              <th className="num sym">ΔM [95% CI]</th>
              <th className="num sym">W</th>
              <th className="num sym">p</th>
              <th className="num sym">p Holm</th>
              <th className="num sym">r</th>
              <th className="num sym">d<sub>z</sub></th>
            </tr>
          </thead>
          <tbody>
            {itemRows.map((r, i) => (
              <tr key={r.label}>
                <td title={r.label}>{r.label.split(".")[0]}</td>
                <td className="num">{r.t?.n ?? "—"}</td>
                <td className="num">
                  {r.t ? `${fmt(r.t.meanPre)} (${fmt(r.t.sdPre)})` : "—"}
                </td>
                <td className="num">
                  {r.t ? `${fmt(r.t.meanPost)} (${fmt(r.t.sdPost)})` : "—"}
                </td>
                <td className="num">
                  {r.t
                    ? `${fmt(r.t.meanDiff)} [${fmt(r.t.ciLow)}, ${fmt(r.t.ciHigh)}]`
                    : "—"}
                </td>
                <td className="num">{r.w ? fmt(r.w.W, 1) : "—"}</td>
                <td className="num">{r.w ? formatP(r.w.p) : "—"}</td>
                <td className="num">
                  {isNaN(holm[i]) ? "—" : formatP(holm[i])}
                </td>
                <td className="num">{r.w ? fmt(r.w.rankBiserial) : "—"}</td>
                <td className="num">{r.t ? fmt(r.t.dz) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details className="disclosure">
        <summary>Full item wording</summary>
        <ol>
          {questions.map((q) => (
            <li key={q.stem}>{q.stem}</li>
          ))}
        </ol>
      </details>

      <h3>Domain and overall change</h3>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Scale</th>
              <th className="num sym">n</th>
              <th className="num sym">M pre (SD)</th>
              <th className="num sym">M post (SD)</th>
              <th className="num sym">ΔM [95% CI]</th>
              <th className="num sym">t(df)</th>
              <th className="num sym">p</th>
              <th className="num sym">d<sub>z</sub></th>
              <th className="num">Magnitude</th>
            </tr>
          </thead>
          <tbody>
            {rows
              .filter((r) => r.scope !== "item")
              .map((r) => (
                <tr key={r.label}>
                  <td>{r.label}</td>
                  <td className="num">{r.t?.n ?? "—"}</td>
                  <td className="num">
                    {r.t ? `${fmt(r.t.meanPre)} (${fmt(r.t.sdPre)})` : "—"}
                  </td>
                  <td className="num">
                    {r.t ? `${fmt(r.t.meanPost)} (${fmt(r.t.sdPost)})` : "—"}
                  </td>
                  <td className="num">
                    {r.t
                      ? `${fmt(r.t.meanDiff)} [${fmt(r.t.ciLow)}, ${fmt(r.t.ciHigh)}]`
                      : "—"}
                  </td>
                  <td className="num">
                    {r.t && !isNaN(r.t.t)
                      ? `${fmt(r.t.t)}(${r.t.df})`
                      : "—"}
                  </td>
                  <td className="num">{r.t ? formatP(r.t.p) : "—"}</td>
                  <td className="num">{r.t ? fmt(r.t.dz) : "—"}</td>
                  <td className="num">
                    {r.t ? interpretD(r.t.dz) : "—"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <p className="status">
        d_z is the mean difference divided by the standard deviation of the
        differences, the effect size for a within-subjects comparison{" "}
        <Cite k={["cohen1988", "lakens2013"]} />.
      </p>

      <h3>Internal consistency</h3>
      <p className="status">
        Cronbach&rsquo;s alpha <Cite k="cronbach1951" /> for each scale, computed
        on respondents who answered every item in that scale. Alpha is sensitive
        to the number of items, so the two- and four-item domain scales will
        generally run lower than the full instrument.
      </p>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Scale</th>
              <th className="num">Items</th>
              <th className="num sym">α pre</th>
              <th className="num sym">α post</th>
            </tr>
          </thead>
          <tbody>
            {alphas.map((a) => (
              <tr key={a.label}>
                <td>{a.label}</td>
                <td className="num">{a.k}</td>
                <td className="num">{fmt(a.pre, 3)}</td>
                <td className="num">{fmt(a.post, 3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel warn">
        <span className="label">Interpretive limit</span>
        <p>
          Every number above describes <em>self-reported confidence</em>, not
          demonstrated knowledge. Self-assessment correlates only weakly with
          measured learning and tracks affect and motivation more closely{" "}
          <Cite k="sitzmann2010" />, and students with the least command of an
          area are the least able to judge it <Cite k="kruger1999" />. Report
          these results together with the qualitative coding, as the instrument
          itself directs, and do not present a confidence gain as evidence of a
          knowledge gain.
        </p>
      </div>
    </>
  );
}

function MatchingPanel({
  match,
}: {
  match: ReturnType<typeof matchPrePost>;
}) {
  const total =
    match.pairs.length * 2 + match.preOnly.length + match.postOnly.length;
  const rate = total ? (match.pairs.length * 2) / total : 0;

  return (
    <div className="panel">
      <span className="label">Matching</span>
      <p>
        {match.pairs.length} matched{" "}
        {match.pairs.length === 1 ? "pair" : "pairs"} on the anonymous code
        {match.preOnly.length > 0 &&
          `, ${match.preOnly.length} pre-only response${match.preOnly.length === 1 ? "" : "s"}`}
        {match.postOnly.length > 0 &&
          `, ${match.postOnly.length} post-only response${match.postOnly.length === 1 ? "" : "s"}`}
        . Matched rate {(rate * 100).toFixed(0)}% of loaded responses.
      </p>
      {match.duplicates.length > 0 && (
        <p className="status incomplete">
          Duplicate codes at the same assessment point:{" "}
          {match.duplicates.join(", ")}. Only the first response for each is
          used. Resolve these before reporting.
        </p>
      )}
    </div>
  );
}
