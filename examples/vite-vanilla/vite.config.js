import { defineConfig } from "vite";
import { sat } from "seo-accessibility-tool/vite";
import satConfig from "./sat.config.json" with { type: "json" };

// SAT is added to the pages of `vite dev`; the app's code doesn't import it.
// sat.config.json holds the options: the panel and `npm run check` (sat-check) share them.
export default defineConfig({
  plugins: [sat(satConfig)],
});
