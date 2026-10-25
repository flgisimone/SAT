import { defineConfig } from "vite";
import { sat } from "seo-accessibility-tool/vite";
import satConfig from "./sat.config.json" with { type: "json" };

// SAT is added to the pages of `vite dev`; the app's code doesn't import it.
// sat.config.json holds the options: the panel and `npm run check` (sat-check) share them.
// mcp: true gives the issues to your AI agent (see the README); axe-core runs because it is installed.
export default defineConfig({
  plugins: [sat({ ...satConfig, mcp: true })],
  // A fixed port keeps the URL of the MCP server the same.
  server: { strictPort: true },
});
