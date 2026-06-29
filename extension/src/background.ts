import Groq from "groq-sdk";
import type { ExtMessage, JobConfig, JobState, ScrapedRow } from "./types";

const VERSION = "1.0.0";

// In-memory job registry (persisted to storage on change)
const jobs = new Map<string, JobState>();
// Per-domain rate limiting: last request timestamp
const domainLastRequest = new Map<string, number>();

// ── Storage helpers ──────────────────────────────────────────────────────────

async function persistJob(state: JobState) {
  jobs.set(state.config.id, state);
  await chrome.storage.local.set({ [`job_${state.config.id}`]: state });
}

async function loadJobs() {
  const all = await chrome.storage.local.get(null);
  for (const [key, value] of Object.entries(all)) {
    if (key.startsWith("job_")) {
      const state = value as JobState;
      // Resume interrupted running jobs as paused on restart
      if (state.status === "running") state.status = "paused";
      jobs.set(state.config.id, state);
    }
  }
}

// ── robots.txt cache ─────────────────────────────────────────────────────────

const robotsCache = new Map<string, Set<string>>();

async function fetchRobots(origin: string): Promise<Set<string>> {
  if (robotsCache.has(origin)) return robotsCache.get(origin)!;
  const disallowed = new Set<string>();
  try {
    const res = await fetch(`${origin}/robots.txt`);
    if (res.ok) {
      const text = await res.text();
      let inUserAgentAll = false;
      for (const line of text.split("\n")) {
        const trimmed = line.trim();
        if (/^user-agent:\s*\*/i.test(trimmed)) { inUserAgentAll = true; continue; }
        if (/^user-agent:/i.test(trimmed)) { inUserAgentAll = false; continue; }
        if (inUserAgentAll && /^disallow:/i.test(trimmed)) {
          const path = trimmed.replace(/^disallow:\s*/i, "").split("#")[0].trim();
          if (path) disallowed.add(path);
        }
      }
    }
  } catch { /* network error — proceed without robots.txt */ }
  robotsCache.set(origin, disallowed);
  return disallowed;
}

function isAllowed(url: string, disallowed: Set<string>): boolean {
  try {
    const { pathname } = new URL(url);
    for (const rule of disallowed) {
      if (pathname.startsWith(rule)) return false;
    }
    return true;
  } catch { return false; }
}

// ── Rate limiting ────────────────────────────────────────────────────────────

async function rateLimit(domain: string, delayMs: number) {
  const last = domainLastRequest.get(domain) ?? 0;
  const wait = delayMs - (Date.now() - last);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  domainLastRequest.set(domain, Date.now());
}

// ── Tab-based page scraping ──────────────────────────────────────────────────

async function scrapeUrl(
  url: string,
  config: JobConfig
): Promise<ScrapedRow[]> {
  const { hostname: domain } = new URL(url);
  await rateLimit(domain, config.delayMs);

  return new Promise<ScrapedRow[]>((resolve, reject) => {
    chrome.tabs.create({ url, active: false }, (tab) => {
      if (!tab?.id) return reject(new Error("Could not create tab"));
      const tabId = tab.id;

      const timeout = setTimeout(() => {
        chrome.tabs.remove(tabId).catch(() => {});
        reject(new Error("Tab scrape timeout"));
      }, 30_000);

      const listener = (
        message: ExtMessage,
        sender: chrome.runtime.MessageSender
      ) => {
        if (sender.tab?.id !== tabId) return;
        if (message.type === "SCRAPE_RESULT" && message.url === url) {
          clearTimeout(timeout);
          chrome.runtime.onMessage.removeListener(listener);
          chrome.tabs.remove(tabId).catch(() => {});
          resolve(message.rows);
        }
        if (message.type === "SCRAPE_ERROR" && message.url === url) {
          clearTimeout(timeout);
          chrome.runtime.onMessage.removeListener(listener);
          chrome.tabs.remove(tabId).catch(() => {});
          reject(new Error(message.error));
        }
      };
      chrome.runtime.onMessage.addListener(listener);

      // Inject content script after tab loads
      chrome.tabs.onUpdated.addListener(function onUpdated(tid, info) {
        if (tid !== tabId || info.status !== "complete") return;
        chrome.tabs.onUpdated.removeListener(onUpdated);
        chrome.scripting
          .executeScript({
            target: { tabId },
            files: ["content-scripts/content.js"],
          })
          .then(() => {
            chrome.tabs.sendMessage(tabId, {
              type: "SCRAPE_PAGE",
              url,
              config,
            } satisfies ExtMessage);
          })
          .catch((err) => {
            clearTimeout(timeout);
            chrome.runtime.onMessage.removeListener(listener);
            chrome.tabs.remove(tabId).catch(() => {});
            reject(err);
          });
      });
    });
  });
}

// ── Link extraction from a tab ───────────────────────────────────────────────

async function extractLinks(
  tabId: number,
  config: JobConfig,
  currentUrl: string
): Promise<string[]> {
  return new Promise<string[]>((resolve) => {
    const timeout = setTimeout(() => resolve([]), 5_000);
    const listener = (
      message: ExtMessage,
      sender: chrome.runtime.MessageSender
    ) => {
      if (sender.tab?.id !== tabId || message.type !== "LINKS_RESULT") return;
      clearTimeout(timeout);
      chrome.runtime.onMessage.removeListener(listener);
      resolve(message.links);
    };
    chrome.runtime.onMessage.addListener(listener);
    chrome.tabs.sendMessage(tabId, {
      type: "GET_LINKS",
      maxLinks: 500,
    } satisfies ExtMessage);
  }).then((links) =>
    links.filter((href) => {
      try {
        const u = new URL(href, currentUrl);
        if (!["http:", "https:"].includes(u.protocol)) return false;
        if (config.stayOnDomain && u.hostname !== new URL(config.startUrl).hostname) return false;
        if (config.includePattern && !new RegExp(config.includePattern).test(u.href)) return false;
        if (config.excludePattern && new RegExp(config.excludePattern).test(u.href)) return false;
        return true;
      } catch { return false; }
    }).map((href) => new URL(href, currentUrl).href)
  );
}

// ── BFS Crawler ──────────────────────────────────────────────────────────────

async function runJob(jobId: string) {
  const state = jobs.get(jobId);
  if (!state || state.status !== "running") return;

  const { config } = state;
  const visited = new Set(state.visited);
  const queue = [...state.queue];

  const { origin } = new URL(config.startUrl);
  const disallowed = await fetchRobots(origin);

  let active = 0;

  async function processNext() {
    const current = jobs.get(jobId);
    if (!current || current.status !== "running") return;
    if (queue.length === 0 && active === 0) {
      current.status = "done";
      current.finishedAt = Date.now();
      await persistJob(current);
      broadcastJobUpdate(current);
      return;
    }

    while (active < config.concurrency && queue.length > 0) {
      const item = queue.shift()!;
      if (visited.has(item.url)) { processNext(); return; }
      if (!isAllowed(item.url, disallowed)) { processNext(); return; }
      visited.add(item.url);
      active++;

      scrapeUrl(item.url, config)
        .then(async (rows) => {
          const s = jobs.get(jobId);
          if (!s) return;
          s.results.push(...rows);
          s.visited.push(item.url);

          // If not at max depth, discover more links via a fresh tab
          if (item.depth < config.maxDepth) {
            // Re-open tab just for link extraction
            const newLinks = await getLinksFromUrl(item.url, config);
            for (const link of newLinks) {
              if (!visited.has(link)) {
                queue.push({ url: link, depth: item.depth + 1 });
              }
            }
          }
          s.queue = [...queue];
          await persistJob(s);
          broadcastJobUpdate(s);
        })
        .catch(async (err) => {
          console.warn("Scrape error", item.url, err);
        })
        .finally(() => {
          active--;
          processNext();
        });
    }
  }

  processNext();
}

async function getLinksFromUrl(url: string, config: JobConfig): Promise<string[]> {
  const { hostname: domain } = new URL(url);
  await rateLimit(domain, config.delayMs);

  return new Promise<string[]>((resolve) => {
    chrome.tabs.create({ url, active: false }, (tab) => {
      if (!tab?.id) return resolve([]);
      const tabId = tab.id;
      const cleanup = () => chrome.tabs.remove(tabId).catch(() => {});
      const timeout = setTimeout(() => { cleanup(); resolve([]); }, 20_000);

      chrome.tabs.onUpdated.addListener(function onUpdated(tid, info) {
        if (tid !== tabId || info.status !== "complete") return;
        chrome.tabs.onUpdated.removeListener(onUpdated);

        chrome.scripting
          .executeScript({ target: { tabId }, files: ["content-scripts/content.js"] })
          .then(() => {
            const listener = (msg: ExtMessage, sender: chrome.runtime.MessageSender) => {
              if (sender.tab?.id !== tabId || msg.type !== "LINKS_RESULT") return;
              clearTimeout(timeout);
              chrome.runtime.onMessage.removeListener(listener);
              cleanup();
              const links = msg.links.filter((href) => {
                try {
                  const u = new URL(href, url);
                  if (!["http:", "https:"].includes(u.protocol)) return false;
                  if (config.stayOnDomain && u.hostname !== new URL(config.startUrl).hostname) return false;
                  if (config.includePattern && !new RegExp(config.includePattern).test(u.href)) return false;
                  if (config.excludePattern && new RegExp(config.excludePattern).test(u.href)) return false;
                  return true;
                } catch { return false; }
              }).map((href) => new URL(href, url).href);
              resolve(links);
            };
            chrome.runtime.onMessage.addListener(listener);
            chrome.tabs.sendMessage(tabId, { type: "GET_LINKS", maxLinks: 500 } satisfies ExtMessage);
          })
          .catch(() => { clearTimeout(timeout); cleanup(); resolve([]); });
      });
    });
  });
}

// ── Groq AI extraction (called from content script via message) ──────────────

async function aiExtract(html: string, prompt: string): Promise<Record<string, string>[]> {
  const { groqKey } = await chrome.storage.local.get("groqKey") as { groqKey?: string };
  if (!groqKey) throw new Error("No Groq API key set. Open extension settings to add one.");

  const groq = new Groq({ apiKey: groqKey, dangerouslyAllowBrowser: false });
  const truncated = html.slice(0, 12_000); // stay within token limits

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a precise web data extraction assistant.
Given HTML content and a user description, extract all matching items and return them as a JSON object with a single key "rows" containing an array of objects.
Each object represents one extracted item with string values only.
If nothing matches, return {"rows": []}.`,
      },
      {
        role: "user",
        content: `Extract data from this HTML:\n\n${truncated}\n\nWhat to extract: ${prompt}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? '{"rows":[]}';
  const parsed = JSON.parse(raw) as { rows?: Record<string, string>[] };
  return parsed.rows ?? [];
}

// ── Broadcast helpers ────────────────────────────────────────────────────────

function broadcastJobUpdate(state: JobState) {
  chrome.runtime.sendMessage({ type: "JOB_UPDATE", job: state } satisfies ExtMessage).catch(() => {});
}

// ── Message handler ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message: ExtMessage, _sender, sendResponse) => {
  (async () => {
    switch (message.type) {
      case "PING":
        sendResponse({ type: "PONG", version: VERSION } satisfies ExtMessage);
        break;

      case "GET_JOBS":
        sendResponse({
          type: "JOBS_LIST",
          jobs: [...jobs.values()],
        } satisfies ExtMessage);
        break;

      case "START_JOB": {
        const { config } = message;
        const state: JobState = {
          config,
          status: "running",
          visited: [],
          queue: [{ url: config.startUrl, depth: 0 }],
          results: [],
          startedAt: Date.now(),
        };
        await persistJob(state);
        runJob(config.id);
        sendResponse({ type: "JOB_UPDATE", job: state } satisfies ExtMessage);
        break;
      }

      case "PAUSE_JOB": {
        const s = jobs.get(message.jobId);
        if (s && s.status === "running") {
          s.status = "paused";
          await persistJob(s);
          broadcastJobUpdate(s);
        }
        break;
      }

      case "RESUME_JOB": {
        const s = jobs.get(message.jobId);
        if (s && s.status === "paused") {
          s.status = "running";
          await persistJob(s);
          runJob(s.config.id);
        }
        break;
      }

      case "DELETE_JOB": {
        jobs.delete(message.jobId);
        await chrome.storage.local.remove(`job_${message.jobId}`);
        break;
      }

      case "SET_GROQ_KEY":
        await chrome.storage.local.set({ groqKey: message.key });
        sendResponse({ type: "PONG", version: VERSION } satisfies ExtMessage);
        break;

      case "AI_EXTRACT" as any: {
        const { html, prompt, url, depth } = message as any;
        try {
          const rawRows = await aiExtract(html, prompt);
          const rows: ScrapedRow[] = rawRows.map((data) => ({
            url,
            depth,
            data,
            scrapedAt: Date.now(),
          }));
          sendResponse(rows);
        } catch (err) {
          sendResponse([]);
        }
        break;
      }

      case "GET_SETTINGS": {
        const { groqKey } = await chrome.storage.local.get("groqKey") as { groqKey?: string };
        sendResponse({ type: "SETTINGS", groqKey: groqKey ?? "" } satisfies ExtMessage);
        break;
      }
    }
  })();
  return true; // keep message channel open for async sendResponse
});

// ── Startup ──────────────────────────────────────────────────────────────────

export default defineBackground(() => {
  loadJobs();
});
