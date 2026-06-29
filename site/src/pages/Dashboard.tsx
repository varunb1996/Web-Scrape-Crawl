import { useState } from "react";
import { useExtension } from "../hooks/useExtension";
import { useStandaloneJobs } from "../hooks/useStandaloneJobs";
import JobBuilder from "../components/JobBuilder";
import JobCard from "../components/JobCard";
import type { JobConfig, JobState } from "../types";

type Panel = "new" | "jobs" | "settings";

export default function Dashboard() {
  const ext = useExtension();
  const standalone = useStandaloneJobs();

  const extConnected = ext.status === "connected";

  // Unified job list — extension jobs take priority when connected
  const jobs: JobState[] = extConnected ? ext.jobs : standalone.jobs;

  const [panel, setPanel] = useState<Panel>("jobs");
  const [groqKey, setGroqKey] = useState(() => localStorage.getItem("wsc_groq_key") ?? "");
  const [keySaved, setKeySaved] = useState(false);

  async function handleStartJob(config: JobConfig) {
    const key = localStorage.getItem("wsc_groq_key") ?? "";
    const enriched = { ...config, groqApiKey: key };
    if (extConnected) {
      await ext.send({ type: "START_JOB", config: enriched });
    } else {
      standalone.startJob(enriched);
    }
    setPanel("jobs");
  }

  async function handlePause(job: JobState) {
    if (extConnected) {
      await ext.send({ type: "PAUSE_JOB", jobId: job.config.id });
    } else {
      standalone.pauseJob(job.config.id);
    }
  }

  async function handleResume(job: JobState) {
    if (extConnected) {
      await ext.send({ type: "RESUME_JOB", jobId: job.config.id });
    } else {
      standalone.resumeJob(job.config.id);
    }
  }

  async function handleDelete(job: JobState) {
    if (extConnected) {
      await ext.send({ type: "DELETE_JOB", jobId: job.config.id });
    } else {
      standalone.deleteJob(job.config.id);
    }
  }

  function saveGroqKey() {
    localStorage.setItem("wsc_groq_key", groqKey);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  }

  const tabCls = (p: Panel) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      panel === p
        ? "bg-gray-800 text-white"
        : "text-gray-400 hover:text-white hover:bg-gray-800/50"
    }`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Manage and monitor your scraping jobs</p>
        </div>
        {/* Mode badge */}
        {ext.status === "detecting" ? (
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800 text-xs text-gray-400 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" /> Detecting extension…
          </span>
        ) : extConnected ? (
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-900/40 border border-green-700/50 text-xs text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Extension connected
          </span>
        ) : (
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/30 border border-blue-700/50 text-xs text-blue-300">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Standalone mode (CORS proxy)
          </span>
        )}
      </div>

      {/* Info banner for standalone */}
      {ext.status === "not_installed" && (
        <div className="flex flex-col sm:flex-row items-start gap-3 px-4 py-3 bg-blue-950/30 border border-blue-800/40 rounded-lg text-xs text-blue-300">
          <span className="text-base mt-0.5">ℹ️</span>
          <div>
            <p className="font-semibold text-blue-200">Running in standalone mode</p>
            <p className="text-blue-400 mt-0.5">
              Works for most public websites. For JavaScript-rendered SPAs (React, Vue apps), install the
              browser extension for full JS rendering support.{" "}
              <a href="#/docs" className="underline hover:text-blue-200">Learn more →</a>
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800 pb-1">
        <button className={tabCls("jobs")} onClick={() => setPanel("jobs")}>
          Jobs {jobs.length > 0 && <span className="ml-1 text-xs text-gray-500">({jobs.length})</span>}
        </button>
        <button className={tabCls("new")} onClick={() => setPanel("new")}>
          + New Job
        </button>
        <button className={tabCls("settings")} onClick={() => setPanel("settings")}>
          Settings
        </button>
      </div>

      {/* Panel: Jobs */}
      {panel === "jobs" && (
        <div className="space-y-3">
          {jobs.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">🕷️</div>
              <p className="text-sm">No jobs yet. Create one to start scraping.</p>
              <button
                onClick={() => setPanel("new")}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors text-white"
              >
                Create first job
              </button>
            </div>
          ) : (
            [...jobs].map((job) => (
              <JobCard
                key={job.config.id}
                job={job}
                onPause={() => handlePause(job)}
                onResume={() => handleResume(job)}
                onDelete={() => handleDelete(job)}
              />
            ))
          )}
        </div>
      )}

      {/* Panel: New Job */}
      {panel === "new" && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="font-semibold mb-6">New Scraping Job</h2>
          <JobBuilder onSubmit={handleStartJob} />
        </div>
      )}

      {/* Panel: Settings */}
      {panel === "settings" && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6 max-w-lg">
          <div>
            <h2 className="font-semibold mb-1">Groq API Key</h2>
            <p className="text-xs text-gray-400 mb-3">
              Required only for AI-powered extraction. Get a free key at{" "}
              <a
                href="https://console.groq.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:underline"
              >
                console.groq.com
              </a>
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                placeholder="gsk_..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
              />
              <button
                onClick={saveGroqKey}
                disabled={!groqKey}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded text-sm font-medium transition-colors text-white"
              >
                {keySaved ? "Saved ✓" : "Save"}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Saved in your browser's local storage. Sent only to Groq's servers during AI extraction.
            </p>
          </div>

          <div className="border-t border-gray-800 pt-6">
            <h2 className="font-semibold mb-1">Browser Extension</h2>
            <p className="text-xs text-gray-400 mb-3">
              The extension enables scraping of JavaScript-rendered sites (React, Vue, Angular apps).
              Not required for regular HTML sites.
            </p>
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Status</p>
              {extConnected ? (
                <p className="text-sm text-green-400">✓ Extension connected</p>
              ) : (
                <p className="text-sm text-gray-400">Not detected — running in standalone mode</p>
              )}
            </div>
            <a
              href="https://github.com/varunb1996/Web-Scrape-Crawl#installation"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-xs text-indigo-400 hover:underline"
            >
              Extension install guide →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
