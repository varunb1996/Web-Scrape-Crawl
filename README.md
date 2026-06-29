# 🕷️ WebScrape Crawl

A state-of-the-art web scraping and crawling tool that runs entirely in your browser. No server required. Scrape any public website with CSS selectors or AI-powered extraction using the free Groq API.

**Live app → [varunb1996.github.io/Web-Scrape-Crawl](https://varunb1996.github.io/Web-Scrape-Crawl/)**

---

## Features

- **No installation required** — works in any browser via CORS proxy
- **BFS crawler** — follow links to configurable depth with rate limiting and robots.txt compliance
- **Rule-based extraction** — CSS selectors to extract specific fields
- **AI extraction** — describe what you want in plain English, powered by Groq's free Llama-3.3-70b
- **Real-time dashboard** — watch results stream in as pages are scraped
- **Export** — one-click CSV and JSON download
- **Browser extension** *(optional)* — for JavaScript-heavy sites (React, Vue, Angular apps)

---

## Quick Start (No Installation)

1. Open **[varunb1996.github.io/Web-Scrape-Crawl](https://varunb1996.github.io/Web-Scrape-Crawl/)**
2. Click **Dashboard → + New Job**
3. Enter a start URL (e.g. `https://news.ycombinator.com`)
4. Choose extraction mode:
   - **Rule-Based**: click **+ Add field**, enter a CSS selector (e.g. `.titleline > a` for HN titles)
   - **AI (Groq)**: describe what to extract in plain English
5. Click **Start Scraping Job**
6. Watch results appear live — then export as CSV or JSON

> The app runs in **standalone mode**, fetching pages through a CORS proxy. This works for most public websites. For JavaScript-rendered sites (SPAs), install the browser extension below.

---

## AI Extraction Setup (Free)

AI extraction is pre-configured — no setup needed if you're using the live app. The Groq API key is already baked into the build.

If you're running your own fork, add `VITE_GROQ_API_KEY` as a repository secret in GitHub → Settings → Secrets and variables → Actions, then push to trigger a new build.

---

## Browser Extension (Optional)

The extension is needed only for JavaScript-rendered websites (React, Vue, Angular SPAs). For regular HTML sites, the web app works without it.

### Install on Chrome

1. Clone this repo and build the extension:
   ```bash
   npm install
   npm run build:ext   # → extension/.output/chrome-mv3/
   ```
2. Open Chrome → type `chrome://extensions` in the address bar → press Enter
3. Toggle **Developer mode** ON (top-right corner)
4. Click **Load unpacked** → select the `extension/.output/chrome-mv3/` folder
5. The 🕷️ icon appears in your toolbar

### Install on Microsoft Edge

Edge is built on Chromium and supports Chrome extensions natively:

1. Open Edge → type `edge://extensions` in the address bar → press Enter
2. Toggle **Developer mode** ON (bottom-left)
3. Click **Load unpacked** → select the same `chrome-mv3` folder
4. Done — the extension works identically in Edge

---

## Testing — Example Scraping Jobs

### 1. Hacker News headlines (Rule-Based)
| Field | Value |
|---|---|
| Start URL | `https://news.ycombinator.com` |
| Max depth | `0` (single page) |
| Extraction | Rule-Based |
| CSS selector | `.titleline > a` → column name: `title` |
| CSS selector | `.score` → column name: `score` |

### 2. Wikipedia article sections (AI)
| Field | Value |
|---|---|
| Start URL | `https://en.wikipedia.org/wiki/Web_scraping` |
| Max depth | `0` |
| Extraction | AI (Groq) |
| Prompt | `Extract each main section heading and a brief summary of its content` |

### 3. Multi-page book crawl (Rule-Based)
| Field | Value |
|---|---|
| Start URL | `https://books.toscrape.com` |
| Max depth | `2` |
| Stay on domain | ✓ |
| CSS selector | `article.product_pod h3 a` → column name: `title` |
| CSS selector | `article.product_pod .price_color` → column name: `price` |

---

## How It Works

```
Browser (you)
    │
    ├─ Standalone mode (default)
    │   └─ fetch via CORS proxy → parse HTML → extract data → show results
    │
    └─ Extension mode (optional, for JS sites)
        └─ Chrome/Edge extension → injects content script
           → renders JS → extracts data → sends to dashboard
```

---

## Tech Stack

| Part | Technology |
|---|---|
| Dashboard | React 18 + TypeScript + Vite + Tailwind CSS |
| Hosting | GitHub Pages (static, free) |
| Browser Extension | WXT (Manifest V3) + React |
| AI Extraction | Groq API — Llama-3.3-70b-versatile (free tier) |
| CORS Proxy | corsproxy.io with allorigins.win fallback |

---

## Development

```bash
# Install dependencies
npm install

# Run dashboard dev server
npm run dev:site        # → http://localhost:5173

# Run extension dev mode (hot reload)
npm run dev:ext

# Build everything
npm run build

# Build extension only
npm run build:ext       # → extension/.output/chrome-mv3/

# Build site only
npm run build:site      # → site/dist/
```

The GitHub Actions workflow automatically deploys `site/dist/` to GitHub Pages on every push to `main`.

---

## Limitations

- **CORS proxy**: corsproxy.io or allorigins.win may occasionally be slow or rate-limited. The extension bypasses this entirely.
- **JS-heavy sites**: Without the extension, SPAs that load content via JavaScript will return empty results.
- **Storage**: Job results are stored in browser memory — export frequently for large crawls.
- **Groq free tier**: ~30 requests/minute. Use a delay of 2000ms+ for AI extraction jobs.
- **robots.txt**: The tool respects `Disallow` rules by default.
