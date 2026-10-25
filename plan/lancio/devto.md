# Tutorial per Dev.to

Bozza da pubblicare sul profilo Dev.to del maintainer. Il testo da incollare è sotto la riga; queste note restano qui.

- **Quando**: dopo la pubblicazione della 1.18.0 su npm. Prima, `npm install` nel template fallisce con `ETARGET`.
- **Provato il 25/10/2026** su `examples/vite-vanilla` (`npx degit`, poi il pacchetto di `npm pack` al posto di quello di npm): pannello in `vite dev` con «5 errors · 3 warnings», 4 errori dopo l'`alt` sull'immagine, senza ricaricare a mano; `npm run build`, `npm run preview`, `npm run check` con l'output riportato sotto ed exit code 1; `--max-errors 4` esce con 0. Il template vanilla di `npm create vite@latest` (Vite 8.3) con il solo `sat()` nel config: «3 errors · 6 warnings», i problemi citati nell'introduzione, controllati a mano (il contrasto 3,83:1 torna con i colori del CSS di Vite).
- **Prima di pubblicare**: rifare i passi con `npm install` da npm; se il template di Vite è cambiato, aggiornare l'introduzione con quello che SAT trova allora.
- **Metadati Dev.to**: tag `a11y`, `webdev`, `vite`, `seo` (massimo quattro); copertina `docs/images/social.png`; `canonical_url` assente (il testo nasce qui).
- **Titoli alternativi**: «Vite's starter page has 3 accessibility and SEO errors. See them while you code»; «An accessibility and SEO panel in vite dev, and the same checks in CI».

---

```markdown
---
title: Find accessibility and SEO issues while you code, with a Vite plugin
published: false
tags: a11y, webdev, vite, seo
cover_image: https://raw.githubusercontent.com/flgisimone/SAT/develop/docs/images/social.png
---
```

Run `npm create vite@latest` with the vanilla template, open the page, and you have three accessibility and SEO errors before writing a line: the hero image has no `alt`, the counter button's text has a contrast of 3.83:1 (WCAG AA asks for 4.5:1), and there's no meta description. Nothing wrong with Vite: a starter page isn't meant to ship. But that's how these issues usually reach production. Nobody sees them while coding, and they show up weeks later in a Lighthouse run or an audit, when fixing them means finding the component again.

This tutorial adds [SAT](https://github.com/flgisimone/SAT), an open source accessibility and SEO debugger, to a Vite project. You'll see the issues on the page in `vite dev`, jump from an issue to its element, fix one, then run the same checks on the build in GitHub Actions.

You'll need Node 22 or later. About 15 minutes.

## 1. A page with known issues

To follow along with a page that has issues on purpose, start from the template:

```bash
npx degit flgisimone/SAT/examples/vite-vanilla my-site
cd my-site
npm install
```

It's one `index.html` with eight known issues, each next to a similar pattern that is valid: an image without `alt` next to one with it, a skipped heading level, an email field labelled only by its placeholder, light grey text, a "click here" link, no `lang`, no meta description, no canonical URL.

**On your own Vite project** (React, Vue, Svelte, Solid, Preact or vanilla), install the package and add the plugin; the next steps work the same:

```bash
npm install -D seo-accessibility-tool
```

```js
// vite.config.js
import { defineConfig } from "vite";
import { sat } from "seo-accessibility-tool/vite";

export default defineConfig({
  plugins: [sat()],
});
```

The plugin adds SAT to the pages of `vite dev` only. Your app's code doesn't import it, and `vite build` doesn't include it.

## 2. The panel in vite dev

```bash
npm run dev
```

Open the URL Vite prints. A small dock sits in a corner of the page. Press play:

![SAT on the page: the play button runs the checks, boxes appear on the elements, the panel lists the issues by rule](https://raw.githubusercontent.com/flgisimone/SAT/develop/docs/images/sat.gif)

- Boxes appear over the elements with issues: red for errors, amber dashed for warnings. They're drawn on SAT's own layer: your elements, styles and attributes aren't touched.
- The counts button (**5 errors · 3 warnings**) opens the panel: issues by rule, each with its WCAG criterion or its source (Google, for the SEO rules) and a "Why and how to fix" link.
- **Structure** shows the H1–H6 tree of the page, with the skipped level marked.

Errors are what a source requires (WCAG 2.2, WAI-ARIA, the HTML standard, Google Search Central), warnings what it recommends. When a source calls a pattern valid, SAT doesn't report it: that's why the decorative image with `alt=""` and the `<h3>` after the `<h4>` aren't flagged.

## 3. From the issue to the element

Click **Images have alternative text** in the panel, then its issue: the page scrolls to the image, focuses it and flashes its box. The message says what's wrong and what to do:

```
<img id="photo"> has no alt attribute. Describe the image, or use alt="" if it is decorative.
```

![The SAT panel: counters, issues by rule with WCAG criteria, and a box on an image without alt text](https://raw.githubusercontent.com/flgisimone/SAT/develop/docs/images/panel-light.png)

Fix it in `index.html`:

```html
<img id="photo" alt="Blue mug" src="data:image/svg+xml,…" width="120" height="80">
```

Save. Vite reloads the page, SAT stays on across reloads and runs again: **4 errors · 3 warnings**. No need to press play again.

Each issue also has **Copy fix prompt**: a prompt for your coding agent with the rule, the selector and the element's HTML. Paste it into Claude Code, Cursor or Copilot if you'd rather not fix it by hand.

## 4. One config for the panel and CI

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
  plugins: [sat(satConfig)],
});
```

The same file goes to the command line in the next step, so the panel and CI report the same rules with the same severity. Each rule can be `"error"`, `"warning"` or `"off"`; `link-text` (links like "click here") is off by default and here it's on as a warning.

## 5. The same checks on the build

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

Build, serve the build in one terminal, check it from another:

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

## 6. GitHub Actions

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

## Try it

- [Live demo](https://flgisimone.github.io/SAT/): the page from this tutorial with SAT already on, nothing to install.
- [Repository](https://github.com/flgisimone/SAT), MIT, with guides for [CI](https://github.com/flgisimone/SAT/blob/develop/docs/guides/ci.md), [configuration](https://github.com/flgisimone/SAT/blob/develop/docs/guides/configuration.md) and [single-page apps](https://github.com/flgisimone/SAT/blob/develop/docs/guides/spa.md).

SAT is young and I'd rather miss an issue than flag valid code. If it reports something your markup does correctly, a [false positive report](https://github.com/flgisimone/SAT/issues/new?template=false-positive.yml) is the most useful thing you can send. And a question for you: **which check do you miss most when you build a page?**
