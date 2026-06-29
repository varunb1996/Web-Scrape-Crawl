/**
 * Bridge content script — injected on the GitHub Pages dashboard domain.
 * Relays postMessage events from the page to/from the extension background.
 */
import type { ExtMessage } from "../types";

// Page → Extension
window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (!event.data || event.data.source !== "WSC_PAGE") return;

  const msg = event.data.payload as ExtMessage;
  chrome.runtime.sendMessage(msg, (response) => {
    if (response) {
      window.postMessage({ source: "WSC_EXT", payload: response }, "*");
    }
  });
});

// Extension → Page (listen for broadcasts like JOB_UPDATE)
chrome.runtime.onMessage.addListener((message: ExtMessage) => {
  window.postMessage({ source: "WSC_EXT", payload: message }, "*");
});
