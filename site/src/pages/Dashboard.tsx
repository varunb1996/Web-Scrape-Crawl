import { useState } from "react";
import { useExtension } from "../hooks/useExtension";
import ExtensionBanner from "../components/ExtensionBanner";
import JobBuilder from "../components/JobBuilder";
import JobCard from "../components/JobCard";
import type { JobConfig } from "../types";

type Panel = "new" | "jobs" | "settings";

export default function Dashboard() {
  const { status, jobs, send } = useExtension();
  const [panel, setPanel] = useState<Panel>("jobs");
  const [groqKey, setGroqKey] = useState("");
  const [keySaved, setKeySaved] = useState(false);

  const connected = status === "connected";

  async function handleStartJob(config: JobConfig) {
    await send({ type: "START_JOB", config });
    setPanel("jobs");
  }

  async function handlePause(jobId: string) {
    await send({ type: "PAUSE_JOB", jobId });
  }

  async function handleResume(jobId: string) {
    await send({ type: "RESUME_JOB", jobId });
  }

  async function handleDelete(jobId: string) {
    await send({ type: "DELETE_JOB", jobId });
  }

  async function saveGroqKey() {
    await send({ type: "SET_GROQ_KEY", key: groqKey });
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
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Manage and monitor your scraping jobs</p>
      </div>

      <ExtensionBanner status={status} />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800 pb-1">
        <button className={tabCls("jobs")} onClick={() => setPanel("jobs")}>
          Jobs {jobs.length > 0 && <span className="ml-1 text-xs text-gray-500">({jobs.length})</span>}
        </button>
        <button className={tabCls("new")} onClick={() => setPanel("new")} disabled={!connected}>
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
                disabled={!connected}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg text-sm font-medium transition-colors"
              >
                Create first job
              </button>
            </div>
          ) : (
            [...jobs].reverse().map((job) => (
              <JobCard
                key={job.config.id}
                job={job}
                onPause={() => handlePause(job.config.id)}
                onResume={() => handleResume(job.config.id)}
                onDelete={() => handleDelete(job.config.id)}
              />
            ))
          )}
        </div>
      )}

      {/* Panel: New Job */}
      {panel === "new" && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="font-semibold mb-6">New Scraping Job</h2>
          <JobBuilder onSubmit={handleStartJob} disabled={!connected} />
        </div>
      )}

      {/* Panel: Settings */}
      {panel === "settings" && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6 max-w-lg">
          <div>
            <h2 className="font-semibold mb-1">Groq API Key</h2>
            <p className="text-xs text-gray-400 mb-3">
              Required for AI-powered extraction. Get a free key at{" "}
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
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={saveGroqKey}
                disabled={!connected || !groqKey}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded text-sm font-medium transition-colors"
              >
                {keySaved ? "Saved ✓" : "Save"}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Key is stored locally in the extension, never sent anywhere except Groq.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
