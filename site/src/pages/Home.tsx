import { Link } from "react-router-dom";

const features = [
  {
    icon: "🌐",
    title: "Crawl Any Website",
    desc: "BFS crawler with configurable depth, concurrency, domain locking, URL pattern filters, and robots.txt compliance.",
  },
  {
    icon: "🎯",
    title: "Rule-Based Extraction",
    desc: "Point CSS selectors at the fields you want. Configure multiple fields per job. Reliable, fast, zero API cost.",
  },
  {
    icon: "🤖",
    title: "AI Extraction (Groq)",
    desc: "Describe what you want in plain English. Llama-3.3-70b on Groq's free LPU tier extracts structured data automatically.",
  },
  {
    icon: "⚡",
    title: "Real-Time Dashboard",
    desc: "Monitor live job progress, pause/resume crawls, and stream results as they arrive — all in your browser.",
  },
  {
    icon: "🛡️",
    title: "Polite Crawling",
    desc: "Configurable per-request delays, robots.txt parsing, concurrency limits. Respectful by default.",
  },
  {
    icon: "📤",
    title: "Export Anywhere",
    desc: "One-click export to CSV or JSON. Every row includes source URL and crawl depth for full traceability.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, #4f46e5 0%, transparent 70%)",
          }}
        />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="text-6xl mb-6">🕷️</div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            State-of-the-art
            <br />
            <span className="text-indigo-400">web scraping</span> in your browser
          </h1>
          <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
            A Chrome extension that crawls any public website with AI-powered extraction,
            live dashboard, and one-click CSV/JSON export. No server needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://github.com/varunb1996/Web-Scrape-Crawl/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition-colors"
            >
              Install Extension
            </a>
            <Link
              to="/dashboard"
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-colors"
            >
              Open Dashboard →
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-16 w-full">
        <h2 className="text-center text-2xl font-bold mb-10">Everything you need to scrape the web</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-indigo-800 transition-colors"
            >
              <div className="text-2xl mb-3">{icon}</div>
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-3xl mx-auto px-4 py-16 w-full">
        <h2 className="text-center text-2xl font-bold mb-10">How it works</h2>
        <ol className="space-y-6">
          {[
            ["Install the extension", "Load the unpacked extension in Chrome (or install from the Chrome Web Store when published)."],
            ["Open the dashboard", "Click 'Open Dashboard' in the extension popup or navigate here to /dashboard."],
            ["Create a job", "Enter a start URL, set crawl depth, choose rule-based or AI extraction."],
            ["Watch it run", "Results stream in real-time. Pause, resume, or delete jobs anytime."],
            ["Export your data", "Download as CSV or JSON with one click."],
          ].map(([title, desc], i) => (
            <li key={i} className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-gray-400 mt-0.5">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-800 py-16 px-4 text-center">
        <h2 className="text-2xl font-bold mb-3">Ready to scrape?</h2>
        <p className="text-gray-400 text-sm mb-6">Install the extension and start your first job in under a minute.</p>
        <a
          href="https://github.com/varunb1996/Web-Scrape-Crawl"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.165 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.604-3.369-1.341-3.369-1.341-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
          View on GitHub
        </a>
      </section>
    </div>
  );
}
