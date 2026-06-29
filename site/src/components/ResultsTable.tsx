import { useMemo, useState } from "react";
import Papa from "papaparse";
import type { ScrapedRow } from "../types";

interface Props {
  rows: ScrapedRow[];
  jobName: string;
}

const PAGE_SIZE = 50;

export default function ResultsTable({ rows, jobName }: Props) {
  const [page, setPage] = useState(0);

  const columns = useMemo(() => {
    const keys = new Set<string>(["url", "depth"]);
    rows.forEach((r) => Object.keys(r.data).forEach((k) => keys.add(k)));
    return [...keys];
  }, [rows]);

  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);

  function exportCsv() {
    const flat = rows.map((r) => ({ url: r.url, depth: r.depth, ...r.data }));
    const csv = Papa.unparse(flat);
    download(`${jobName}.csv`, csv, "text/csv");
  }

  function exportJson() {
    const flat = rows.map((r) => ({ url: r.url, depth: r.depth, ...r.data }));
    download(`${jobName}.json`, JSON.stringify(flat, null, 2), "application/json");
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 text-sm">No results yet…</div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {rows.length.toLocaleString()} row{rows.length !== 1 ? "s" : ""}
        </span>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-300 transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={exportJson}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-300 transition-colors"
          >
            Export JSON
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full text-xs text-left">
          <thead className="bg-gray-900 text-gray-400 border-b border-gray-800">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-3 py-2 font-medium whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-gray-800/50 hover:bg-gray-900/50 transition-colors"
              >
                {columns.map((col) => {
                  const val =
                    col === "url"
                      ? row.url
                      : col === "depth"
                      ? String(row.depth)
                      : row.data[col] ?? "";
                  return (
                    <td key={col} className="px-3 py-2 text-gray-300 max-w-xs truncate">
                      {col === "url" ? (
                        <a
                          href={val}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:underline"
                        >
                          {val}
                        </a>
                      ) : (
                        val
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-40"
          >
            ← Prev
          </button>
          <span>
            Page {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
