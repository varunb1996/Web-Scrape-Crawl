import type { ExtStatus } from "../hooks/useExtension";

export default function ExtensionBanner({ status }: { status: ExtStatus }) {
  if (status === "connected") return null;

  if (status === "detecting") {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 rounded-lg text-sm text-gray-300 animate-pulse">
        <span className="w-2 h-2 rounded-full bg-yellow-400" />
        Detecting extension…
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-4 bg-amber-900/30 border border-amber-700/50 rounded-lg text-sm">
      <span className="text-amber-400 text-lg">⚠️</span>
      <div className="flex-1">
        <p className="font-semibold text-amber-300">Extension not detected</p>
        <p className="text-amber-400/80 text-xs mt-0.5">
          Install the WebScrape Crawl extension to use the dashboard. Then reload this page.
        </p>
      </div>
      <a
        href="https://github.com/varun-bukka/Web-Scrape-Crawl/releases"
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-medium transition-colors whitespace-nowrap"
      >
        Download Extension →
      </a>
    </div>
  );
}
