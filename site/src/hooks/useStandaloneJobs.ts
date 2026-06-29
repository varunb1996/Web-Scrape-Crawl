import { useState, useRef, useCallback } from "react";
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

  function patchJob(id: string, patch: Partial<JobState>) {
    setJobs((prev) => prev.map((j) => (j.config.id === id ? { ...j, ...patch } : j)));
  }

  const runCrawl = useCallback(async (
    config: JobConfig,
    initialVisited: string[],
    initialQueue: Array<{ url: string; depth: number }>,
    initialResults: ScrapedRow[]
  ) => {
    abortRef.current.set(config.id, false);

    const visited = new Set(initialVisited);
    const queue = [...initialQueue];
    const results = [...initialResults];

    const domainLastRequest = new Map<string, number>();

    let robotsDisallowed = new Set<string>();
    try {
      const { origin } = new URL(config.startUrl);
      robotsDisallowed = await fetchRobotsTxt(origin);
    } catch { /* ignore */ }

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
        patchJob(config.id, { status: "paused", queue: [...queue], visited: [...visited], results: [...results] });
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
              const aiRows = await aiExtractGroq(
                html,
                config.aiPrompt ?? "Extract all meaningful content",
                config.groqApiKey,
                url,
                depth
              );
              pageRows = config.extractionMode === "both" ? [...pageRows, ...aiRows] : aiRows;
            }
            results.push(...pageRows);

            if (depth < config.maxDepth) {
              extractLinks(html, url)
                .filter((link) => {
                  if (visited.has(link)) return false;
                  if (config.stayOnDomain && new URL(link).hostname !== new URL(config.startUrl).hostname) return false;
                  if (config.includePattern && !new RegExp(config.includePattern).test(link)) return false;
                  if (config.excludePattern && new RegExp(config.excludePattern).test(link)) return false;
                  return true;
                })
                .forEach((link) => queue.push({ url: link, depth: depth + 1 }));
            }
          } catch (err) {
            console.warn("Scrape error:", url, err);
          }
        })
      );

      patchJob(config.id, { visited: [...visited], queue: [...queue], results: [...results], status: "running" });
    }

    patchJob(config.id, { status: "done", visited: [...visited], queue: [], results: [...results], finishedAt: Date.now() });
  }, []);

  function startJob(config: JobConfig) {
    const initial: JobState = {
      config,
      status: "running",
      visited: [],
      queue: [{ url: config.startUrl, depth: 0 }],
      results: [],
      startedAt: Date.now(),
    };
    setJobs((prev) => [initial, ...prev]);
    runCrawl(config, [], [{ url: config.startUrl, depth: 0 }], []);
  }

  function pauseJob(jobId: string) {
    // Set flag so the crawl loop exits at its next iteration
    abortRef.current.set(jobId, true);
    // Update status immediately in UI without waiting for the loop
    patchJob(jobId, { status: "paused" });
  }

  function resumeJob(jobId: string) {
    setJobs((prev) => {
      const job = prev.find((j) => j.config.id === jobId);
      if (!job || job.status !== "paused") return prev;
      const updated = { ...job, status: "running" as const };
      // Start crawl continuing from saved queue and visited set
      setTimeout(() => runCrawl(job.config, job.visited, job.queue, job.results), 0);
      return prev.map((j) => (j.config.id === jobId ? updated : j));
    });
  }

  function deleteJob(jobId: string) {
    abortRef.current.set(jobId, true);
    setJobs((prev) => prev.filter((j) => j.config.id !== jobId));
  }

  return { jobs, startJob, pauseJob, resumeJob, deleteJob };
}
