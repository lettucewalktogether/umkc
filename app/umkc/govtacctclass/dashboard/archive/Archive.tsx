"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cohortLabel, type Cohort } from "@/lib/cohorts";

type ArchivedFile = {
  pathname: string;
  kind: "eval" | "assessment";
  cohort: string;
  uploadedAt: string;
};

type Group = {
  key: string;
  kind: "eval" | "assessment";
  cohort: string;
  files: ArchivedFile[];
  newest: string;
};

const KIND_LABEL: Record<ArchivedFile["kind"], string> = {
  assessment: "Class assessment",
  eval: "Presentation evaluations",
};

export default function Archive() {
  const [files, setFiles] = useState<ArchivedFile[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [showDeep, setShowDeep] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch(
        "/umkc/govtacctclass/api/submissions?stage=archived",
        { cache: "no-store" },
      );
      if (!res.ok) {
        setStatus("error");
        return;
      }
      const data = (await res.json()) as {
        cohorts?: Cohort[];
        files?: ArchivedFile[];
      };
      setCohorts(data.cohorts ?? []);
      setFiles(data.files ?? []);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const groups = useMemo<Group[]>(() => {
    const by = new Map<string, Group>();
    for (const f of files) {
      const key = `${f.kind}::${f.cohort}`;
      const g = by.get(key) ?? {
        key,
        kind: f.kind,
        cohort: f.cohort,
        files: [],
        newest: f.uploadedAt,
      };
      g.files.push(f);
      if (f.uploadedAt > g.newest) g.newest = f.uploadedAt;
      by.set(key, g);
    }
    return [...by.values()].sort((a, b) => b.newest.localeCompare(a.newest));
  }, [files]);

  async function move(group: Group, to: "active" | "deep") {
    const what = `${KIND_LABEL[group.kind].toLowerCase()} for ${cohortLabel(
      cohorts,
      group.cohort,
    )}`;
    const message =
      to === "active"
        ? `Reactivate the ${what} on the dashboard?`
        : `Move the ${what} to the deep archive? They disappear from every view here, but nothing is deleted — the files stay in storage and can be recovered.`;
    if (!window.confirm(message)) return;

    setBusy(group.key);
    try {
      const res = await fetch("/umkc/govtacctclass/api/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          pathnames: group.files.map((f) => f.pathname),
        }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      await load();
    } catch {
      setStatus("error");
    } finally {
      setBusy(null);
    }
  }

  if (status === "loading") {
    return <p className="status">Loading the archive&hellip;</p>;
  }
  if (status === "error") {
    return (
      <p className="status incomplete">
        Could not load the archive. Reload the page to try again.
      </p>
    );
  }
  if (groups.length === 0) {
    return (
      <p className="saved-empty">
        Nothing is hidden. Hide a cohort from the dashboard when its work is
        finished, and it will appear here to reactivate later.
      </p>
    );
  }

  return (
    <div className="form-ui">
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Cohort</th>
              <th>Instrument</th>
              <th className="num">Files</th>
              <th>Last submitted</th>
              <th>Reactivate</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.key}>
                <td>{cohortLabel(cohorts, g.cohort)}</td>
                <td>{KIND_LABEL[g.kind]}</td>
                <td className="num">{g.files.length}</td>
                <td>{g.newest.slice(0, 10)}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => void move(g, "active")}
                    disabled={busy === g.key}
                  >
                    Reactivate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Deliberately behind a disclosure. Nothing here deletes anything, and
          the wording has to say so before the button is reachable. */}
      <details
        className="disclosure"
        open={showDeep}
        onToggle={(e) => setShowDeep((e.target as HTMLDetailsElement).open)}
      >
        <summary>Remove from view (deep archive)</summary>
        <p className="status">
          This moves a cohort out of every view, including this page. It does
          not delete anything: the files stay in storage and can be brought
          back. Use it once results are reported and the archive is cluttered.
        </p>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Cohort</th>
                <th>Instrument</th>
                <th className="num">Files</th>
                <th>Remove</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={`deep-${g.key}`}>
                  <td>{cohortLabel(cohorts, g.cohort)}</td>
                  <td>{KIND_LABEL[g.kind]}</td>
                  <td className="num">{g.files.length}</td>
                  <td>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => void move(g, "deep")}
                      disabled={busy === g.key}
                    >
                      Remove from view
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
