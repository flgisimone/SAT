import { defineConfig } from "vite";
import { sat } from "seo-accessibility-tool/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // SAT is added to the pages of `vite dev`; the app's code doesn't import it.
  plugins: [react(), sat({ rules: { "link-text": "warning" } })],
});
