import { defineConfig } from "vite";
import { sat } from "seo-accessibility-tool/vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  // SAT is added to the pages of `vite dev`; the app's code doesn't import it.
  plugins: [vue(), sat({ rules: { "link-text": "warning" } })],
});
