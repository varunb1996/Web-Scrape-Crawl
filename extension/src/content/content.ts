import type { ExtMessage, JobConfig, ScrapedRow, SelectorField } from "../types";

// ── Rule-based extraction ────────────────────────────────────────────────────

function extractField(field: SelectorField): string[] {
  const nodes = Array.from(document.querySelectorAll(field.selector));
  return nodes.map((el) => {
    if (field.attribute) return (el as HTMLElement).getAttribute(field.attribute) ?? "";
    return (el as HTMLElement).innerText?.trim() ?? el.textContent?.trim() ?? "";
  });
}

function ruleExtract(fields: SelectorField[], url: string, depth: number): ScrapedRow[] {
  if (fields.length === 0) {
    // No fields defined — extract basic metadata
    return [{
      url,
      depth,
      data: {
        title: document.title,
        h1: document.querySelector("h1")?.innerText?.trim() ?? "",
        description: (document.querySelector('meta[name="description"]') as HTMLMetaElement)?.content ?? "",
      },
      scrapedAt: Date.now(),
    }];
  }

  // Zip field arrays into row objects
  const columns: Record<string, string[]> = {};
  let maxLen = 1;
  for (const field of fields) {
    const values = extractField(field);
    columns[field.name] = values;
    if (values.length > maxLen) maxLen = values.length;
  }

  const rows: ScrapedRow[] = [];
  for (let i = 0; i < maxLen; i++) {
    const data: Record<string, string> = {};
    for (const field of fields) {
      data[field.name] = columns[field.name]?.[i] ?? "";
    }
    rows.push({ url, depth, data, scrapedAt: Date.now() });
  }
  return rows;
}

// ── Clean HTML for AI ────────────────────────────────────────────────────────

function getCleanHtml(): string {
  // Remove scripts, styles, and hidden elements for a leaner AI prompt
  const clone = document.body.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("script, style, noscript, svg, iframe").forEach((el) => el.remove());
  return clone.innerText.slice(0, 15_000); // plain text is enough for Groq
}

// ── Link discovery ───────────────────────────────────────────────────────────

function collectLinks(max: number): string[] {
  const hrefs = new Set<string>();
  document.querySelectorAll("a[href]").forEach((a) => {
    try {
      const url = new URL((a as HTMLAnchorElement).href, location.href);
      if (["http:", "https:"].includes(url.protocol)) hrefs.add(url.href);
    } catch { /* ignore */ }
    if (hrefs.size >= max) return;
  });
  return [...hrefs].slice(0, max);
}

// ── Message handler ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message: ExtMessage, _sender, sendResponse) => {
  (async () => {
    switch (message.type) {
      case "SCRAPE_PAGE": {
        const { url, config } = message;
        const depth = config.maxDepth; // approximate — background tracks real depth
        try {
          let rows: ScrapedRow[] = [];

          if (config.extractionMode === "rule" || config.extractionMode === "both") {
            rows = ruleExtract(config.fields, url, depth);
          }

          if (config.extractionMode === "ai" || config.extractionMode === "both") {
            // Ask background service worker to call Groq (background has network access)
            const cleanText = getCleanHtml();
            const aiRows = await chrome.runtime.sendMessage({
              type: "AI_EXTRACT",
              html: cleanText,
              prompt: config.aiPrompt ?? "Extract all meaningful content",
              url,
              depth,
            });
            if (Array.isArray(aiRows)) {
              rows = config.extractionMode === "both" ? [...rows, ...aiRows] : aiRows;
            }
          }

          chrome.runtime.sendMessage({ type: "SCRAPE_RESULT", url, rows } satisfies ExtMessage);
        } catch (err) {
          chrome.runtime.sendMessage({
            type: "SCRAPE_ERROR",
            url,
            error: String(err),
          } satisfies ExtMessage);
        }
        break;
      }

      case "GET_LINKS": {
        const links = collectLinks(message.maxLinks);
        chrome.runtime.sendMessage({ type: "LINKS_RESULT", links } satisfies ExtMessage);
        break;
      }
    }
  })();
  return true;
});
