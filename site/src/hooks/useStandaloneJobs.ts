import { useState, useRef } from "react";
import type { JobConfig, JobState, ScrapedRow } from "../types";
import {
  fetchHtml,
  extractWithSelectors,
  extractLinks,
  fetchRobotsTxt,
  aiExtractGroq,
} from "../lib/proxyScraper";

export function useStandaloneJobs() {
  const [jobs, setJobs] = useState<JobState[]>([]);
  const abortRef = useRef<Map<string, boolean>>(new Map());

  function updateJob(id: string, patch: Partial<JobState>) {
    setJobs((prev) =>
      prev.map((j) => (j.config.id === id ? { ...j, ...patch } : j))
    );
  }

  async function startJob(config: JobConfig) {
    const initial: JobState = {
      config,
      status: "running",
      visited: [],
      queue: [{ url: config.startUrl, depth: 0 }],
      results: [],
      startedAt: Date.now(),
    };
    setJobs((prev) => [initial, ...prev]);
    abortRef.current.set(config.id, false);

    const visited = new Set<string>();
    const queue = [{ url: config.startUrl, depth: 0 }];
    const results: ScrapedRow[] = [];

    let robotsDisallowed: Set<string> = new Set();
    try {
      const { origin } = new URL(config.startUrl);
      robotsDisallowed = await fetchRobotsTxt(origin);
    } catch { /* ignore */ }

    const domainLastRequest = new Map<string, number>();

    async function rateLimit(url: string) {
      const { hostname } = new URL(url);
      const last = domainLastRequest.get(hostname) ?? 0;
      const wait = config.delayMs - (Date.now() - last);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      domainLastRequest.set(hostname, Date.now());
    }

    function isAllowed(url: string) {
      try {
        const { pathname } = new URL(url);
        for (const rule of robotsDisallowed) {
          if (pathname.startsWith(rule)) return false;
        }
        return true;
      } catch { return false; }
    }

    while (queue.length > 0) {
      if (abortRef.current.get(config.id)) {
        updateJob(config.id, { status: "paused", queue: [...queue], visited: [...visited], results: [...results] });
        return;
      }

      const batch = queue.splice(0, config.concurrency);
      await Promise.all(
        batch.map(async ({ url, depth }) => {
          if (visited.has(url) || !isAllowed(url)) return;
          visited.add(url);
          try {
            await rateLimit(url);
            const html = await fetchHtml(url);

            let pageRows: ScrapedRow[] = [];
            if (config.extractionMode === "rule" || config.extractionMode === "both") {
              pageRows = extractWithSelectors(html, config.fields, url, depth);
            }
            if ((config.extractionMode === "ai" || config.extractionMode === "both") && config.groqApiKey) {
              const aiRows = await aiExtractGroq(html, config.aiPrompt ?? "Extract all meaningful content", config.groqApiKey, url, depth);
              pageRows = config.extractionMode === "both" ? [...pageRows, ...aiRows] : aiRows;
            }
            results.push(...pageRows);

            if (depth < config.maxDepth) {
              const links = extractLinks(html, url).filter((link) => {
                if (visited.has(link)) return false;
                if (config.stayOnDomain && new URL(link).hostname !== new URL(config.startUrl).hostname) return false;
                if (config.includePattern && !new RegExp(config.includePattern).test(link)) return false;
                if (config.excludePattern && new RegExp(config.excludePattern).test(link)) return false;
                return true;
              });
              links.forEach((link) => queue.push({ url: link, depth: depth + 1 }));
            }
          } catch (err) {
            console.warn("Standalone scrape error:", url, err);
          }
        })
      );

      updateJob(config.id, {
        visited: [...visited],
        queue: [...queue],
        results: [...results],
        status: "running",
      });
    }

    updateJob(config.id, {
      status: "done",
      visited: [...visited],
      queue: [],
      results: [...results],
      finishedAt: Date.now(),
    });
  }

  function pauseJob(jobId: string) {
    abortRef.current.set(jobId, true);
  }

  function resumeJob(jobId: string) {
    const job = jobs.find((j) => j.config.id === jobId);
    if (!job || job.status !== "paused") return;
    startJob(job.config);
  }

  function deleteJob(jobId: string) {
    abortRef.current.set(jobId, true);
    setJobs((prev) => prev.filter((j) => j.config.id !== jobId));
  }

  return { jobs, startJob, pauseJob, resumeJob, deleteJob };
}
