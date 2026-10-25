import { defineConfig } from "vite";
import { sat } from "seo-accessibility-tool/vite";

// SAT is added to the pages of `vite dev`; the app's code doesn't import it.
export default defineConfig({
  plugins: [sat({ rules: { "link-text": "warning" } })],
});
