import "../content/bridge";

export default defineContentScript({
  // Replace YOUR_GITHUB_USERNAME with actual username before deploying
  matches: ["https://varunb1996.github.io/Web-Scrape-Crawl/*", "http://localhost:5173/*"],
  runAt: "document_start",
  main() {
    // Bridge logic is in content/bridge.ts — imported above
  },
});
