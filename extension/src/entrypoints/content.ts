import "../content/content";

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_idle",
  main() {
    // Content script logic is in content/content.ts — imported above
  },
});
