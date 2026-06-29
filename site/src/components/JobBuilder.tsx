import { useState } from "react";
import type { JobConfig, SelectorField, ExtractionMode } from "../types";

interface Props {
  onSubmit: (config: JobConfig) => void;
}

const DEFAULT_DELAY = 500;

export default function JobBuilder({ onSubmit }: Props) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [depth, setDepth] = useState(0);
  const [stayOnDomain, setStayOnDomain] = useState(true);
  const [concurrency, setConcurrency] = useState(1);
  const [delayMs, setDelayMs] = useState(DEFAULT_DELAY);
  const [includePattern, setIncludePattern] = useState("");
  const [excludePattern, setExcludePattern] = useState("");
  const [mode, setMode] = useState<ExtractionMode>("rule");
  const [fields, setFields] = useState<SelectorField[]>([{ name: "title", selector: "h1" }]);
  const [aiPrompt, setAiPrompt] = useState("");

  function addField() {
    setFields((f) => [...f, { name: "", selector: "" }]);
  }
  function removeField(i: number) {
    setFields((f) => f.filter((_, idx) => idx !== i));
  }
  function updateField(i: number, key: keyof SelectorField, value: string) {
    setFields((f) => f.map((field, idx) => (idx === i ? { ...field, [key]: value } : field)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    const config: JobConfig = {
      id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim() || new URL(url).hostname,
      startUrl: url.trim(),
      maxDepth: depth,
      stayOnDomain,
      includePattern: includePattern.trim() || undefined,
      excludePattern: excludePattern.trim() || undefined,
      concurrency,
      delayMs,
      extractionMode: mode,
      fields: mode !== "ai" ? fields.filter((f) => f.name && f.selector) : [],
      aiPrompt: mode !== "rule" ? aiPrompt.trim() : undefined,
      createdAt: Date.now(),
    };
    onSubmit(config);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">Basic</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Job name (optional)">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My scraping job"
              className={inputCls}
            />
          </Field>
          <Field label="Start URL *">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
              type="url"
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      {/* Crawl settings */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">Crawl</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="Max depth">
            <input
              type="number"
              min={0}
              max={10}
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className={inputCls}
            />
          </Field>
          <Field label="Concurrency">
            <input
              type="number"
              min={1}
              max={5}
              value={concurrency}
              onChange={(e) => setConcurrency(Number(e.target.value))}
              className={inputCls}
            />
          </Field>
          <Field label="Delay (ms)">
            <input
              type="number"
              min={0}
              step={100}
              value={delayMs}
              onChange={(e) => setDelayMs(Number(e.target.value))}
              className={inputCls}
            />
          </Field>
          <Field label="Stay on domain">
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={stayOnDomain}
                onChange={(e) => setStayOnDomain(e.target.checked)}
                className="w-4 h-4 accent-indigo-500"
              />
              <span className="text-sm text-gray-300">Yes</span>
            </label>
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Include URLs matching (regex)">
            <input
              value={includePattern}
              onChange={(e) => setIncludePattern(e.target.value)}
              placeholder="e\.g\. /products/"
              className={inputCls}
            />
          </Field>
          <Field label="Exclude URLs matching (regex)">
            <input
              value={excludePattern}
              onChange={(e) => setExcludePattern(e.target.value)}
              placeholder="e\.g\. /login"
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      {/* Extraction mode */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">Extraction</h3>
        <div className="flex gap-2">
          {(["rule", "ai", "both"] as ExtractionMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors capitalize ${
                mode === m
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {m === "rule" ? "Rule-based" : m === "ai" ? "AI (Groq)" : "Both"}
            </button>
          ))}
        </div>

        {(mode === "rule" || mode === "both") && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">CSS selector fields to extract:</p>
            {fields.map((field, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  value={field.name}
                  onChange={(e) => updateField(i, "name", e.target.value)}
                  placeholder="Field name"
                  className={`${inputCls} w-32`}
                />
                <input
                  value={field.selector}
                  onChange={(e) => updateField(i, "selector", e.target.value)}
                  placeholder="CSS selector"
                  className={`${inputCls} flex-1`}
                />
                <input
                  value={field.attribute ?? ""}
                  onChange={(e) => updateField(i, "attribute", e.target.value)}
                  placeholder="attr (optional)"
                  className={`${inputCls} w-28`}
                />
                <button
                  type="button"
                  onClick={() => removeField(i)}
                  className="text-gray-500 hover:text-red-400 px-1"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addField}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              + Add field
            </button>
          </div>
        )}

        {(mode === "ai" || mode === "both") && (
          <Field label="Describe what to extract">
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Extract all product names, prices, and availability status"
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </Field>
        )}
      </section>

      <button
        type="submit"
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition-colors"
      >
        Start Scraping Job
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-400">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500 w-full";
