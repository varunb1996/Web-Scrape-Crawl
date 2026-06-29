export type ExtractionMode = "rule" | "ai" | "both";

export interface SelectorField {
  name: string;
  selector: string;
  attribute?: string; // default: innerText
}

export interface JobConfig {
  id: string;
  name: string;
  startUrl: string;
  maxDepth: number; // 0 = single page
  stayOnDomain: boolean;
  includePattern?: string; // regex
  excludePattern?: string; // regex
  concurrency: number;
  delayMs: number;
  extractionMode: ExtractionMode;
  // rule-based
  fields: SelectorField[];
  // ai
  aiPrompt?: string;
  // meta
  createdAt: number;
}

export type JobStatus = "pending" | "running" | "paused" | "done" | "error";

export interface JobState {
  config: JobConfig;
  status: JobStatus;
  visited: string[];
  queue: Array<{ url: string; depth: number }>;
  results: ScrapedRow[];
  errorMessage?: string;
  startedAt?: number;
  finishedAt?: number;
}

export interface ScrapedRow {
  url: string;
  depth: number;
  data: Record<string, string>;
  scrapedAt: number;
}

// Messages between content scripts, service worker, and site bridge
export type ExtMessage =
  | { type: "PING" }
  | { type: "PONG"; version: string }
  | { type: "START_JOB"; config: JobConfig }
  | { type: "PAUSE_JOB"; jobId: string }
  | { type: "RESUME_JOB"; jobId: string }
  | { type: "DELETE_JOB"; jobId: string }
  | { type: "GET_JOBS" }
  | { type: "JOBS_LIST"; jobs: JobState[] }
  | { type: "JOB_UPDATE"; job: JobState }
  | { type: "SCRAPE_PAGE"; url: string; config: JobConfig }
  | { type: "SCRAPE_RESULT"; url: string; rows: ScrapedRow[] }
  | { type: "SCRAPE_ERROR"; url: string; error: string }
  | { type: "GET_LINKS"; maxLinks: number }
  | { type: "LINKS_RESULT"; links: string[] }
  | { type: "SET_GROQ_KEY"; key: string }
  | { type: "GET_SETTINGS" }
  | { type: "SETTINGS"; groqKey: string };
