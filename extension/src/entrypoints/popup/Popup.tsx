import { useEffect, useState } from "react";
import type { JobState } from "../../types";

export default function Popup() {
  const [jobs, setJobs] = useState<JobState[]>([]);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_JOBS" }, (res) => {
      if (res?.type === "JOBS_LIST") setJobs(res.jobs);
    });

    const listener = (msg: { type: string; job?: JobState }) => {
      if (msg.type === "JOB_UPDATE" && msg.job) {
        setJobs((prev) => {
          const idx = prev.findIndex((j) => j.config.id === msg.job!.config.id);
          if (idx === -1) return [...prev, msg.job!];
          const next = [...prev];
          next[idx] = msg.job!;
          return next;
        });
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const runningJobs = jobs.filter((j) => j.status === "running");
  const doneJobs = jobs.filter((j) => j.status === "done");

  function openDashboard() {
    chrome.tabs.create({ url: "https://varunb1996.github.io/Web-Scrape-Crawl/" });
  }

  function toggleJob(job: JobState) {
    const type = job.status === "running" ? "PAUSE_JOB" : "RESUME_JOB";
    chrome.runtime.sendMessage({ type, jobId: job.config.id });
  }

  return (
    <div className="w-72 bg-gray-950 text-white min-h-[200px] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-900 border-b border-gray-800">
        <span className="text-lg">🕷️</span>
        <span className="font-semibold text-sm tracking-wide">WebScrape Crawl</span>
        <span className="ml-auto text-xs text-gray-500">v1.0</span>
      </div>

      {/* Stats */}
      <div className="flex gap-3 px-4 py-3 text-xs text-gray-400 border-b border-gray-800">
        <span>
          <span className="text-green-400 font-semibold">{runningJobs.length}</span> running
        </span>
        <span>
          <span className="text-blue-400 font-semibold">{doneJobs.length}</span> done
        </span>
        <span>
          <span className="text-gray-300 font-semibold">{jobs.length}</span> total
        </span>
      </div>

      {/* Job list */}
      <div className="flex-1 overflow-y-auto max-h-48">
        {jobs.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-gray-500">
            No jobs yet. Open the dashboard to create one.
          </div>
        ) : (
          jobs.map((job) => (
            <div
              key={job.config.id}
              className="flex items-center gap-2 px-4 py-2 border-b border-gray-800 hover:bg-gray-900"
            >
              <StatusDot status={job.status} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{job.config.name}</div>
                <div className="text-[10px] text-gray-500">
                  {job.results.length} rows · {job.visited.length} pages
                </div>
              </div>
              {(job.status === "running" || job.status === "paused") && (
                <button
                  onClick={() => toggleJob(job)}
                  className="text-[10px] px-2 py-0.5 rounded bg-gray-700 hover:bg-gray-600"
                >
                  {job.status === "running" ? "Pause" : "Resume"}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-800">
        <button
          onClick={openDashboard}
          className="w-full py-1.5 text-xs font-medium rounded bg-indigo-600 hover:bg-indigo-500 transition-colors"
        >
          Open Dashboard →
        </button>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: JobState["status"] }) {
  const colors: Record<JobState["status"], string> = {
    running: "bg-green-400 animate-pulse",
    pending: "bg-yellow-400",
    paused: "bg-orange-400",
    done: "bg-blue-400",
    error: "bg-red-400",
  };
  return <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors[status]}`} />;
}
