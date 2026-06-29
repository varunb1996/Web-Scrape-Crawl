/**
 * Standalone scraper — runs entirely in the browser using a CORS proxy.
 * No extension required. Works for static/server-rendered sites.
 * JS-heavy SPAs may return empty content (use the extension for those).
 */

const CORS_PROXIES = [
  "https://corsproxy.io/?",
  "https://api.allorigins.win/raw?url=",
];

export async function fetchHtml(url: string): Promise<string> {
  let lastError: Error | null = null;
  for (const proxy of CORS_PROXIES) {
    try {
      const res = await fetch(proxy + encodeURIComponent(url));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      // Detect bot/CAPTCHA walls (very short responses are usually error pages)
      if (text.length > 500) return text;
      throw new Error("Response too short — likely a bot detection page");
    } catch (e) {
      lastError = e as Error;
    }
  }
  throw lastError ?? new Error(`Failed to fetch ${url}`);
}

// DOMParser elements don't support innerText (no layout engine) — always use textContent
function getText(el: Element): string {
  return el.textContent?.trim() ?? "";
}

export function extractWithSelectors(
  html: string,
  fields: Array<{ name: string; selector: string; attribute?: string }>,
  url: string,
  depth: number
): Array<{ url: string; depth: number; data: Record<string, string>; scrapedAt: number }> {
  const doc = new DOMParser().parseFromString(html, "text/html");

  if (fields.length === 0) {
    return [{
      url, depth, scrapedAt: Date.now(),
      data: {
        title: doc.title,
        h1: getText(doc.querySelector("h1") ?? document.createElement("h1")),
        description: (doc.querySelector('meta[name="description"]') as HTMLMetaElement)?.content ?? "",
      },
    }];
  }

  const columns: Record<string, string[]> = {};
  let maxLen = 0;
  for (const field of fields) {
    const nodes = Array.from(doc.querySelectorAll(field.selector));
    const values = nodes.map((el) =>
      field.attribute
        ? el.getAttribute(field.attribute) ?? ""
        : getText(el)
    );
    columns[field.name] = values;
    if (values.length > maxLen) maxLen = values.length;
  }

  const rows = [];
  for (let i = 0; i < maxLen; i++) {
    const data: Record<string, string> = {};
    for (const field of fields) {
      data[field.name] = columns[field.name]?.[i] ?? "";
    }
    rows.push({ url, depth, data, scrapedAt: Date.now() });
  }
  return rows;
}

export function extractLinks(html: string, baseUrl: string): string[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const hrefs = new Set<string>();
  doc.querySelectorAll("a[href]").forEach((a) => {
    try {
      const u = new URL((a as HTMLAnchorElement).getAttribute("href") ?? "", baseUrl);
      if (["http:", "https:"].includes(u.protocol)) hrefs.add(u.href);
    } catch { /* ignore */ }
  });
  return [...hrefs];
}

export async function fetchRobotsTxt(origin: string): Promise<Set<string>> {
  const disallowed = new Set<string>();
  try {
    const text = await fetchHtml(`${origin}/robots.txt`);
    let inAll = false;
    for (const line of text.split("\n")) {
      const t = line.trim();
      if (/^user-agent:\s*\*/i.test(t)) { inAll = true; continue; }
      if (/^user-agent:/i.test(t)) { inAll = false; continue; }
      if (inAll && /^disallow:/i.test(t)) {
        const path = t.replace(/^disallow:\s*/i, "").split("#")[0].trim();
        if (path) disallowed.add(path);
      }
    }
  } catch { /* proceed without robots.txt */ }
  return disallowed;
}

function htmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  // Remove script, style, nav, header, footer noise
  doc.querySelectorAll("script,style,nav,header,footer,aside,[role=navigation]").forEach((el) => el.remove());
  return (doc.body?.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 12_000);
}

export async function aiExtractGroq(
  html: string,
  prompt: string,
  apiKey: string,
  url: string,
  depth: number
): Promise<Array<{ url: string; depth: number; data: Record<string, string>; scrapedAt: number }>> {
  const truncated = htmlToText(html);
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a precise web data extraction assistant. Given HTML content and a description, extract all matching items and return them as JSON with a single key "rows" containing an array of objects with string values only. If nothing matches, return {"rows": []}.`,
        },
        {
          role: "user",
          content: `Extract from this HTML:\n\n${truncated}\n\nWhat to extract: ${prompt}`,
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Groq API error: ${res.status}`);
  const json = await res.json() as { choices: Array<{ message: { content: string } }> };
  const raw = json.choices[0]?.message?.content ?? '{"rows":[]}';
  const parsed = JSON.parse(raw) as { rows?: Record<string, string>[] };
  return (parsed.rows ?? []).map((data) => ({ url, depth, data, scrapedAt: Date.now() }));
}
