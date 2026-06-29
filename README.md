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
   - **Rule-Based**: enter a CSS selector (e.g. `a.storylink` for HN titles)
   - **AI (Groq)**: describe what to extract in plain English
5. Click **Start Scraping Job**
6. Watch results appear live — then export as CSV or JSON

> The app runs in **standalone mode** by default, fetching pages through a CORS proxy. This works for most public websites. For JavaScript-rendered sites (SPAs), install the browser extension below.

---

## AI Extraction Setup (Free)

To use AI-powered extraction:

1. Sign up at **[console.groq.com](https://console.groq.com)** (free, no credit card)
2. Go to **API Keys** → **Create API Key** → copy the key (starts with `gsk_`)
3. In the dashboard, go to **Settings** → paste your key → click **Save**
4. Now select **AI (Groq)** or **Both** as the extraction mode when creating a job

The key is saved in your browser's local storage and sent only to Groq's servers.

---

## Browser Extension (Optional)

The extension is needed only for JavaScript-rendered websites (React, Vue, Angular SPAs). For regular HTML sites, the web app works without it.

### Install on Chrome

1. Download the latest release: [Releases →](https://github.com/varunb1996/Web-Scrape-Crawl/releases)
2. Unzip the downloaded file
3. Open Chrome → type `chrome://extensions` in the address bar → press Enter
4. Toggle **Developer mode** ON (top-right corner)
5. Click **Load unpacked** → select the unzipped `chrome-mv3` folder
6. The 🕷️ icon appears in your toolbar

Or load directly from the source (after cloning this repo):
```
Load unpacked → select: extension/.output/chrome-mv3/
```

### Install on Microsoft Edge

Edge is built on Chromium and supports Chrome extensions natively:

1. Open Edge → type `edge://extensions` in the address bar → press Enter
2. Toggle **Developer mode** ON (bottom-left)
3. Click **Load unpacked** → select the same `chrome-mv3` folder
4. Done — the extension works identically in Edge

> You can also enable "Allow extensions from other stores" in Edge settings to install directly from the Chrome Web Store when the extension is published there.

---

## Testing — Example Scraping Jobs

### 1. Hacker News headlines (Rule-Based)
| Field | Value |
|---|---|
| Start URL | `https://news.ycombinator.com` |
| Max depth | `0` (single page) |
| Extraction | Rule-Based |
| Field name | `title` |
| CSS selector | `span.titleline > a` |

### 2. Wikipedia article text (AI)
| Field | Value |
|---|---|
| Start URL | `https://en.wikipedia.org/wiki/Web_scraping` |
| Max depth | `0` |
| Extraction | AI (Groq) |
| Prompt | `Extract all section headings and their first paragraph` |

### 3. Multi-page crawl
| Field | Value |
|---|---|
| Start URL | `https://books.toscrape.com` |
| Max depth | `2` |
| Stay on domain | ✓ |
| Extraction | Rule-Based |
| Field: `title` | `article.product_pod h3 a` |
| Field: `price` | `article.product_pod .price_color` |

---

## How It Works

```
Browser (you)
    │
    ├─ Standalone mode (default)
    │   └─ fetch via corsproxy.io → parse HTML → extract data → show results
    │
    └─ Extension mode (optional, for JS sites)
        └─ Chrome/Edge extension → opens tab → injects content script
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
| CORS Proxy | corsproxy.io (for standalone mode) |

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

- **CORS proxy**: corsproxy.io may occasionally be slow or rate-limit heavy usage. The extension bypasses this entirely.
- **JS-heavy sites**: Without the extension, SPAs that load content via JavaScript will return empty results.
- **Storage**: Job results are stored in browser memory (standalone) or `chrome.storage.local` (extension, ~10MB limit). Export frequently for large crawls.
- **Groq free tier**: ~30 requests/minute. Use a delay of 2000ms+ for AI extraction jobs.
- **robots.txt**: The tool respects `Disallow` rules by default.
