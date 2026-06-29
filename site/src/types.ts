// Shared types mirrored from extension — keep in sync
export type ExtractionMode = "rule" | "ai" | "both";

export interface SelectorField {
  name: string;
  selector: string;
  attribute?: string;
}

export interface JobConfig {
  id: string;
  name: string;
  startUrl: string;
  maxDepth: number;
  stayOnDomain: boolean;
  includePattern?: string;
  excludePattern?: string;
  concurrency: number;
  delayMs: number;
  extractionMode: ExtractionMode;
  fields: SelectorField[];
  aiPrompt?: string;
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
  | { type: "SET_GROQ_KEY"; key: string }
  | { type: "GET_SETTINGS" }
  | { type: "SETTINGS"; groqKey: string };
