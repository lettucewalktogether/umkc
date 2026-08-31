/** Minimal RFC 4180 CSV writer and browser download helper. */

function escapeCell(value: string | number): string {
  const s = String(value ?? "");
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: (string | number)[][]): string {
  return rows.map((row) => row.map(escapeCell).join(",")).join("\r\n");
}

/**
 * Triggers a download of `csv` as `filename`. A UTF-8 byte-order mark is
 * prepended so Excel opens the file in UTF-8 rather than the system codepage.
 */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(["﻿" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** File-name-safe slug, e.g. "Team 3 / A" -> "team-3-a". */
export function slug(value: string, fallback: string): string {
  const s = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || fallback;
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Parses RFC 4180 CSV text into rows, handling quoted fields that contain
 * commas, quotes, and newlines. A leading UTF-8 byte-order mark is stripped.
 */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];

    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\r") {
      // handled by the \n branch; a lone \r also ends the row
      if (src[i + 1] !== "\n") {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      }
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }

  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  // Drop trailing blank lines produced by a final newline.
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** Maps rows onto the header row, returning one record per data row. */
export function parseCsvRecords(text: string): Record<string, string>[] {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) =>
    Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])),
  );
}
