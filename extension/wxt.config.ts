import { defineConfig } from "wxt";

export default defineConfig({
  extensionApi: "chrome",
  srcDir: "src",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "WebScrape Crawl",
    description: "State-of-the-art web scraping and crawling tool",
    version: "1.0.0",
    permissions: ["tabs", "storage", "scripting", "activeTab"],
    host_permissions: ["<all_urls>"],
    action: {
      default_popup: "popup.html",
      default_title: "WebScrape Crawl",
    },
  },
});
