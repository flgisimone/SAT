# Tutorial per Dev.to

Bozza da pubblicare sul profilo Dev.to del maintainer. Il testo da incollare è sotto la riga; queste note restano qui.

- **Quando**: dopo la pubblicazione della 1.19.0 su npm. Prima, `npm install` nel template fallisce con `ETARGET`.
- **Provato il 25/10/2026** sulla pagina di `examples/` con il plugin di `dist/` (F17): con axe-core «4 errors · 3 warnings», 3 errori dopo l'`alt` sull'immagine; `sat_issues` e `sat_recheck` da Claude Code 2.1 con 5 errori e 3 avvisi a pagina senza axe. Da F16-02 (pacchetto di `npm pack` su `examples/vite-vanilla`, senza axe): `npm run check` con l'output riportato sotto ed exit code 1, `--max-errors 4` esce con 0. Il template vanilla di `npm create vite@latest` (Vite 8.3) con il solo `sat()`: «3 errors · 6 warnings».
- **Prima di pubblicare**: rifare tutti i passi con `npm install` da npm, Claude Code compreso; la correzione dell'agente cambia da una prova all'altra, il testo non promette un numero finale.
- **Metadati Dev.to**: tag `a11y`, `webdev`, `vite`, `ai` (massimo quattro); copertina `docs/images/social.png`; `canonical_url` assente (il testo nasce qui).
- **Titoli alternativi**: «An accessibility and SEO panel in vite dev that your AI agent can read»; «Give your coding agent the accessibility issues it can't see».

---

```markdown
---
title: Your AI agent can't see accessibility issues. Give it the ones on your page, from vite dev
published: false
tags: a11y, webdev, vite, ai
cover_image: https://raw.githubusercontent.com/flgisimone/SAT/develop/docs/images/social.png
---
```

Coding agents write a lot of our markup now, and they're good at it, but they work from the source. They don't see the rendered page: that the grey text ended up at 1.98:1 contrast, that the email field is labelled only by its placeholder, that the page has no `lang`. Those issues show up weeks later in a Lighthouse run or an audit, when fixing them means finding the component again.

This tutorial adds [SAT](https://github.com/flgisimone/SAT), an open source accessibility and SEO panel, to a Vite project. You'll see the issues on the page in `vite dev`, jump from an issue to its element, fix one by hand, then give the rest to your coding agent through MCP and let it check its own work. At the end, the same checks on the build in CI.

You'll need Node 22 or later. About 15 minutes.

## 1. A page with known issues

To follow along with a page that has issues on purpose, start from the template:

```bash
npx degit flgisimone/SAT/examples/vite-vanilla my-site
cd my-site
npm install
```

It's one `index.html` with known issues, each next to a similar pattern that is valid: an image without `alt` next to one with it, a skipped heading level, an email field labelled only by its placeholder, light grey text, a "click here" link, no `lang`, no meta description, no canonical URL.

**On your own Vite project** (React, Vue, Svelte, Solid, Preact or vanilla), install the package and add the plugin; the next steps work the same:

```bash
npm install -D seo-accessibility-tool axe-core
```

```js
// vite.config.js
import { defineConfig } from "vite";
import { sat } from "seo-accessibility-tool/vite";

export default defineConfig({
  plugins: [sat({ mcp: true })],
  server: { strictPort: true },
});
```

The plugin adds SAT to the pages of `vite dev` only. Your app's code doesn't import it, and `vite build` doesn't include it. `axe-core` is optional: when it's installed, the plugin runs [axe-core](https://github.com/dequelabs/axe-core)'s rules next to SAT's. `mcp: true` is for step 4.

## 2. The panel in vite dev

```bash
npm run dev
```

Open the URL Vite prints. A small dock sits in a corner of the page. Press play:

![SAT on the page: the play button runs the checks, boxes appear on the elements, the panel lists the issues by rule](https://raw.githubusercontent.com/flgisimone/SAT/develop/docs/images/sat.gif)

- Boxes appear over the elements with issues: red for errors, amber dashed for warnings. They're drawn on SAT's own layer: your elements, styles and attributes aren't touched.
- The counts button (**4 errors · 3 warnings**) opens the panel: issues by rule, each with its WCAG criterion or its source (Google, for the SEO rules) and a link to its documentation. The rules named `axe/…` come from axe-core; the SEO ones and a few others are SAT's.
- **Structure** shows the H1–H6 tree of the page, with the skipped level marked.

Errors are what a source requires (WCAG 2.2, WAI-ARIA, the HTML standard, Google Search Central), warnings what it recommends. Valid patterns aren't reported: that's why the decorative image with `alt=""` isn't flagged.

## 3. From the issue to the element

Click **Images must have alternative text** in the panel, then its issue: the page scrolls to the image, focuses it and flashes its box.

```
Images must have alternative text: <img id="photo">. Element does not have an alt attribute
```

![The SAT panel: counters, issues by rule with WCAG criteria, and a box on an image without alt text](https://raw.githubusercontent.com/flgisimone/SAT/develop/docs/images/panel-light.png)

Fix it in `index.html`:

```html
<img id="photo" alt="Blue mug" src="data:image/svg+xml,…" width="120" height="80">
```

Save. Vite reloads the page, SAT stays on across reloads and runs again: **3 errors · 3 warnings**. No need to press play again.

## 4. Give the rest to your agent

With `mcp: true` the dev server is also an MCP server. When `vite dev` starts it prints:

```text
  SAT: MCP server at http://localhost:5173/__sat/mcp
  SAT: for Claude Code, claude mcp add --transport http sat http://localhost:5173/__sat/mcp
```

Add it to your agent once. For Claude Code, run that command; for Cursor, `.cursor/mcp.json`:

```json
{ "mcpServers": { "sat": { "url": "http://localhost:5173/__sat/mcp" } } }
```

VS Code (Copilot), Codex CLI, Gemini CLI, Windsurf and Zed take the same URL; the [AI agents guide](https://github.com/flgisimone/SAT/blob/develop/docs/guides/ai-agents.md) has each configuration. Keep the page open in the browser and ask:

> Fix the SAT issues on this page.

The agent calls `sat_issues` and gets, for each issue, the rule, its severity and WCAG criterion, the selector, the element's HTML and a documentation link, in a prompt that asks for the smallest fix in the source and treats the quoted page as data. It edits `index.html` with its own tools and permissions, then calls `sat_recheck`: SAT runs again on the open page and returns what's left. The panel updates too, so you watch the count drop in the browser.

A few things worth knowing:

- **What goes to the model**: the issues and the quoted HTML of the elements, sent by your agent, as it sends the files it reads. SAT itself sends nothing anywhere, and the MCP server is off unless you set `mcp: true`.
- **What the agent sees**: the pages open in the browser during this `vite dev` run. A dialog or a menu has to be open when SAT runs.
- **Review it like any other change**: `git diff`. Some fixes need a decision only you can make: "Blue mug" is an alt text, not necessarily the right one.

No agent with MCP? Each issue in the panel has **Copy fix prompt**, the same prompt, to paste anywhere.

## Also: the same checks in CI

The panel helps whoever has it open. To keep issues from coming back, run the checks on the build.

### One config for the panel and CI

The template keeps SAT's options in `sat.config.json`:

```json
{ "rules": { "link-text": "warning" } }
```

`vite.config.js` passes it to the plugin:

```js
import { defineConfig } from "vite";
import { sat } from "seo-accessibility-tool/vite";
import satConfig from "./sat.config.json" with { type: "json" };

export default defineConfig({
  plugins: [sat({ ...satConfig, mcp: true })],
  server: { strictPort: true },
});
```

The same file goes to the command line below, so the panel and CI report the same rules with the same severity. `mcp: true` sits next to it, because it's for the dev server only. Each rule can be `"error"`, `"warning"` or `"off"`; `link-text` (links like "click here") is off by default and here it's on as a warning.

### The same checks on the build

`sat-check` opens pages in Chromium, prints the issues, writes reports and exits with 1 above the limits. It uses Playwright:

```bash
npm install -D @playwright/test
npx playwright install chromium
```

(The template already has `@playwright/test`; only the second command is needed.)

The template's `package.json` has the scripts:

```json
"scripts": {
  "build": "vite build",
  "preview": "vite preview --port 4173 --strictPort",
  "check": "sat-check http://localhost:4173/ --config sat.config.json --json sat-report.json --html sat-report.html"
}
```

`sat-check` runs SAT's own rules; add `--axe` (or `"axe": true` in the file) for axe-core's too. Build, serve the build in one terminal, check it from another:

```bash
npm run build
npm run preview
```

```bash
npm run check
```

```
http://localhost:4173/  4 errors, 3 warnings
  warning heading-levels        Heading level skipped: <h4 id="returns"> "Returns" comes after an H2. Expected H3 or higher.
                              [id="returns"]
  error   color-contrast        Insufficient contrast on <p id="fine-print" class="faint"> "Offers end on Sunday.": ratio 1.98. Minimum AA is 4.5.
                              [id="fine-print"]
  error   form-label            Missing label for form field <input id="email"> (name="unnamed"). A placeholder is not a replacement for a label.
                              [id="email"]
  warning link-text             Non-descriptive link text: "click here" in <a href="/returns">.
                              [id="click-here"]
  error   html-lang             <html> has no lang attribute. Add one, e.g. <html lang="en">.
  error   seo-meta              Missing or empty <meta name="description">.
  warning canonical             Missing <link rel="canonical">. Add one with the absolute URL of the page.

1 page: 4 errors, 3 warnings (max 0 errors)
```

The exit code is 1: by default any error fails. `sat-report.html` is a standalone report you can open in a browser ([an example](https://flgisimone.github.io/SAT/report.html)), `sat-report.json` the same data for scripts.

### GitHub Actions

The template has `.github/workflows/sat.yml`, which runs the same scripts on every push and pull request:

```yaml
name: SAT
on: [push, pull_request]
jobs:
  sat:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: lts/*
      - run: npm install
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npm run preview &
      - run: curl -s --retry 10 --retry-connrefused -o /dev/null http://localhost:4173/
      - run: npm run check
      - uses: actions/upload-artifact@v7
        if: always()
        with:
          name: sat-report
          path: sat-report.*
```

Push it and the job fails on this page, as it should: the reports are attached to the run as an artifact.

**On a project that already has many issues**, failing every build on day one isn't useful. Start the limit at today's count and lower it as you fix things:

```bash
npx sat-check http://localhost:4173/ --config sat.config.json --max-errors 4
```

This exits with 0 with the four errors above, and fails as soon as a fifth one appears. `--max-warnings` does the same for warnings. With `--depth 2`, `sat-check` follows same-origin links and checks those pages too, reporting broken links along the way.

## What SAT doesn't do

- **It doesn't certify WCAG conformance.** Automated checks find a part of the issues. Keyboard use, screen readers, zoom and whether an alt text actually makes sense still need a person. Zero errors in SAT means zero errors SAT can detect.
- **It doesn't promise rankings.** The SEO rules check technical requirements from Google Search Central (title, description, canonical, hreflang, structured data), not content.
- **It checks the page as it is when it runs.** Open menus, dialogs and hover styles need the state opened and a new run. It doesn't look inside iframes, shadow roots of web components or canvas.
- **The panel is for development.** In the page it runs in `vite dev` only; for the build and CI there's `sat-check`, or `toHaveNoSATErrors()` in your Playwright tests.
- **It doesn't fix anything by itself.** Your agent does, with your review.

## Try it

- [Live demo](https://flgisimone.github.io/SAT/): the page from this tutorial with SAT already on, nothing to install.
- [Repository](https://github.com/flgisimone/SAT), MIT, with guides for [AI agents](https://github.com/flgisimone/SAT/blob/develop/docs/guides/ai-agents.md), [CI](https://github.com/flgisimone/SAT/blob/develop/docs/guides/ci.md), [configuration](https://github.com/flgisimone/SAT/blob/develop/docs/guides/configuration.md) and [single-page apps](https://github.com/flgisimone/SAT/blob/develop/docs/guides/spa.md).

SAT is young and I'd rather miss an issue than flag valid code. If it reports something your markup does correctly, a [false positive report](https://github.com/flgisimone/SAT/issues/new?template=false-positive.yml) is the most useful thing you can send. And a question for you: **which agent do you use, and what does it still get wrong in your markup?**
