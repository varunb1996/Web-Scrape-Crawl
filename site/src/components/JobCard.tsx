import { useState } from "react";
import type { JobState } from "../types";
import ResultsTable from "./ResultsTable";

interface Props {
  job: JobState;
  onPause: () => void;
  onResume: () => void;
  onDelete: () => void;
}

const statusColor: Record<JobState["status"], string> = {
  running: "text-green-400",
  pending: "text-yellow-400",
  paused: "text-orange-400",
  done: "text-blue-400",
  error: "text-red-400",
};

const statusDot: Record<JobState["status"], string> = {
  running: "bg-green-400 animate-pulse",
  pending: "bg-yellow-400",
  paused: "bg-orange-400",
  done: "bg-blue-400",
  error: "bg-red-400",
};

export default function JobCard({ job, onPause, onResume, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);

  const progress =
    job.queue.length + job.visited.length > 0
      ? Math.round((job.visited.length / (job.visited.length + job.queue.length)) * 100)
      : job.status === "done"
      ? 100
      : 0;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-800/40 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[job.status]}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{job.config.name}</span>
            <span className={`text-xs ${statusColor[job.status]} capitalize`}>{job.status}</span>
          </div>
          <div className="text-xs text-gray-500 truncate mt-0.5">{job.config.startUrl}</div>
        </div>
        <div className="text-right text-xs text-gray-400 flex-shrink-0">
          <div>{job.results.length.toLocaleString()} rows</div>
          <div>{job.visited.length} pages</div>
        </div>
        <span className="text-gray-600 text-sm ml-2">{expanded ? "▲" : "▼"}</span>
      </div>

      {/* Progress bar */}
      {(job.status === "running" || job.status === "paused") && (
        <div className="h-0.5 bg-gray-800">
          <div
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-800 px-4 py-4 space-y-4">
          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            {job.status === "running" && (
              <button
                onClick={onPause}
                className="px-3 py-1.5 text-xs rounded bg-orange-700 hover:bg-orange-600 transition-colors"
              >
                Pause
              </button>
            )}
            {job.status === "paused" && (
              <button
                onClick={onResume}
                className="px-3 py-1.5 text-xs rounded bg-green-700 hover:bg-green-600 transition-colors"
              >
                Resume
              </button>
            )}
            <button
              onClick={onDelete}
              className="px-3 py-1.5 text-xs rounded bg-gray-800 hover:bg-red-900 text-gray-300 hover:text-red-200 transition-colors"
            >
              Delete
            </button>
          </div>

          {/* Config summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-400">
            <Stat label="Mode" value={job.config.extractionMode} />
            <Stat label="Max depth" value={String(job.config.maxDepth)} />
            <Stat label="Concurrency" value={String(job.config.concurrency)} />
            <Stat label="Delay" value={`${job.config.delayMs}ms`} />
          </div>

          {/* Error */}
          {job.errorMessage && (
            <p className="text-xs text-red-400 bg-red-900/20 px-3 py-2 rounded">
              {job.errorMessage}
            </p>
          )}

          {/* Results */}
          <ResultsTable rows={job.results} jobName={job.config.name} />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-gray-600 text-[10px] uppercase tracking-wide">{label}</div>
      <div className="text-gray-300 font-medium capitalize">{value}</div>
    </div>
  );
}
