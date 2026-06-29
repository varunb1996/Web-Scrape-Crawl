export default function Docs() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 prose prose-invert prose-sm max-w-none">
      <h1 className="text-3xl font-bold mb-2">Documentation</h1>
      <p className="text-gray-400 mb-10">Everything you need to get started with WebScrape Crawl.</p>

      <Section title="Installation">
        <ol className="space-y-2 text-gray-300 text-sm list-decimal list-inside">
          <li>Download the latest release from the <a href="https://github.com/varunb1996/Web-Scrape-Crawl/releases" className="text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer">GitHub Releases page</a>.</li>
          <li>Unzip the <code className="bg-gray-800 px-1 rounded">extension-dist.zip</code> file.</li>
          <li>Open Chrome and navigate to <code className="bg-gray-800 px-1 rounded">chrome://extensions</code>.</li>
          <li>Enable <strong>Developer mode</strong> (top right toggle).</li>
          <li>Click <strong>Load unpacked</strong> and select the unzipped folder.</li>
          <li>The 🕷️ icon appears in your toolbar. Pin it for easy access.</li>
        </ol>
      </Section>

      <Section title="Creating a Job">
        <p className="text-gray-300 text-sm">Go to the <strong>Dashboard → New Job</strong> tab and fill in:</p>
        <Table rows={[
          ["Start URL", "The page where the crawl begins."],
          ["Max depth", "0 = scrape only the start URL. 1 = follow links one level deep, etc."],
          ["Stay on domain", "When enabled, only URLs on the same hostname are crawled."],
          ["Concurrency", "How many pages to scrape simultaneously (1–5). Higher = faster but more load on target."],
          ["Delay (ms)", "Minimum wait between requests to the same domain. Default 1000ms."],
          ["Include/Exclude", "Optional regex patterns. Include keeps only matching URLs; Exclude skips matching ones."],
        ]} />
      </Section>

      <Section title="Rule-Based Extraction">
        <p className="text-gray-300 text-sm mb-3">
          Add one or more <strong>fields</strong>. Each field has a name and a CSS selector. Optionally specify an HTML attribute to extract instead of text content.
        </p>
        <Table rows={[
          ["name", "Column name in results (e.g. \"title\", \"price\")"],
          ["selector", "CSS selector (e.g. \"h1\", \".price\", \"a.product-link\")"],
          ["attribute", "Optional. Extract this HTML attribute instead of text (e.g. \"href\", \"src\", \"data-id\")"],
        ]} />
        <p className="text-gray-400 text-xs mt-3">
          If multiple elements match a selector, each becomes its own row. All fields are zipped together by index.
        </p>
      </Section>

      <Section title="AI Extraction (Groq)">
        <p className="text-gray-300 text-sm mb-3">
          AI mode uses <strong>Llama-3.3-70b-versatile</strong> on Groq's free inference API to extract structured data without writing selectors.
        </p>
        <ol className="space-y-1 text-gray-300 text-sm list-decimal list-inside">
          <li>Get a free API key at <a href="https://console.groq.com" className="text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer">console.groq.com</a>.</li>
          <li>Go to <strong>Dashboard → Settings</strong> and paste your key.</li>
          <li>Create a job with <strong>AI</strong> or <strong>Both</strong> extraction mode.</li>
          <li>Describe what to extract in plain English, e.g.: <em>"Extract all product names, prices, and stock status"</em>.</li>
        </ol>
        <p className="text-gray-400 text-xs mt-3">
          The page's visible text (up to 12,000 characters) is sent to Groq. Your key is stored locally in the extension and never sent to our servers.
        </p>
      </Section>

      <Section title="Exporting Results">
        <p className="text-gray-300 text-sm">
          Expand any job card and click <strong>Export CSV</strong> or <strong>Export JSON</strong>. Every row includes the source URL and crawl depth.
        </p>
      </Section>

      <Section title="robots.txt & Polite Crawling">
        <p className="text-gray-300 text-sm">
          The crawler fetches <code className="bg-gray-800 px-1 rounded">/robots.txt</code> for each domain and skips disallowed paths.
          Use the <strong>Delay</strong> setting to control request rate. The extension runs in background tabs that are automatically closed after scraping.
        </p>
      </Section>

      <Section title="Limitations">
        <ul className="space-y-1 text-gray-300 text-sm list-disc list-inside">
          <li>Requires the Chrome extension to be installed — the dashboard alone cannot scrape.</li>
          <li>Chrome's <code className="bg-gray-800 px-1 rounded">chrome.storage.local</code> is limited to ~10MB. Large crawls should be exported regularly.</li>
          <li>Groq free tier has rate limits (~30 req/min). Use a delay of at least 2000ms for AI jobs.</li>
          <li>Sites with aggressive bot detection (Cloudflare, DataDome) may block requests.</li>
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold mb-4 pb-2 border-b border-gray-800">{title}</h2>
      {children}
    </section>
  );
}

function Table({ rows }: { rows: [string, string][] }) {
  return (
    <table className="w-full text-sm text-left border border-gray-800 rounded-lg overflow-hidden">
      <tbody>
        {rows.map(([key, val]) => (
          <tr key={key} className="border-b border-gray-800 last:border-0">
            <td className="px-3 py-2 bg-gray-900 text-gray-300 font-mono w-1/3">{key}</td>
            <td className="px-3 py-2 text-gray-400">{val}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
