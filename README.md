# SAT: SEO Accessibility Tool

**Catch accessibility and SEO issues before your users do.**

SAT is a visual accessibility and SEO debugger for development: a panel in your dev server shows WCAG, ARIA and SEO issues on the page, next to the elements, and the same checks run in Playwright tests and in CI.

[![npm](https://img.shields.io/npm/v/seo-accessibility-tool)](https://www.npmjs.com/package/seo-accessibility-tool)
[![License: MIT](https://img.shields.io/github/license/flgisimone/SAT)](LICENSE)
[![CI](https://github.com/flgisimone/SAT/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/flgisimone/SAT/actions/workflows/ci.yml)

**[Try the live demo](https://flgisimone.github.io/SAT/)**: a page with known issues and SAT already on, nothing to install.

<img src="docs/images/sat.gif" width="800" alt="SAT on a page with known issues: the play button runs the checks, boxes appear on the elements, the panel lists the issues by rule, and clicking one flashes its element">

## Install

```bash
npm install -D seo-accessibility-tool
```

## Quick start

With Vite (Svelte, SvelteKit, Solid, Preact, Vue, React, vanilla):

1. Install the package (above).
2. Add the plugin:

   ```ts
   // vite.config.ts
   import { defineConfig } from "vite";
   import { sat } from "seo-accessibility-tool/vite";

   export default defineConfig({
     plugins: [sat()],
   });
   ```

3. Run `npm run dev` and open the page.

You see the SAT dock in a corner of the page. Press play: boxes appear on the elements with issues (red for errors, amber for warnings), and the counts button opens the panel with the issues by rule, each with its WCAG criterion or source. Click an issue to jump to its element. SAT is only in `vite dev`: `vite build` doesn't include it.

The [examples](examples/) are small projects (Vite plugin, React, Vue, CLI) on the same page with known issues.

## Use it with

| With | How |
|---|---|
| Vite | [Plugin](#vite-plugin), no import in the app |
| React | [`useSATChecker`](#react) |
| Vue 3 | [`useSatChecker`](#vue-3) |
| Svelte, Angular | [`satChecker`](#svelte-and-angular) in the entry point |
| Vanilla JS, other bundlers | [`satChecker`](#vanilla-js) |
| Any site, without installing | [Browser extension](#browser-extension) |
| Playwright tests | [`toHaveNoSATErrors`](#playwright) |
| CI | [`sat-check`](#cli-and-ci): JSON and HTML reports, limits, link crawler |

---

## Vite plugin

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { sat } from "seo-accessibility-tool/vite";

export default defineConfig({
  plugins: [sat({ rules: { "link-text": "warning" } })],
});
```

It takes the options that fit in JSON (`rules`, `wcagLevel`, `allowedLinkTexts`, `observeDom`, the 1.x flags), `axe: true` to run [axe-core](#axe-core-engine-optional) too and `ai: true` for [Fix with AI](#fix-with-ai). `vite` is an optional peer dependency (5 or later).

## React

```tsx
import { useSATChecker } from "seo-accessibility-tool/react";

function App() {
  useSATChecker(); // starts SAT when the component mounts, in development
  return <div>My App</div>;
}
```

## Vue 3

```vue
<script setup lang="ts">
import { useSatChecker } from "seo-accessibility-tool/vue";

useSatChecker(); // in setup: SAT starts when the component is mounted, in development
</script>
```

## Svelte and Angular

No wrapper is needed: `satChecker` starts the panel from the app's entry point. With Vite, the plugin above is enough.

```ts
// Svelte (or SvelteKit, in a +layout.svelte onMount)
import { satChecker } from "seo-accessibility-tool/sat-controller";

satChecker(); // starts when NODE_ENV is "development"
```

```ts
// Angular: main.ts
import { isDevMode } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { satChecker } from "seo-accessibility-tool/sat-controller";
import { AppComponent } from "./app/app.component";

bootstrapApplication(AppComponent).then(() => satChecker({ enabled: isDevMode() }));
```

## Vanilla JS

```ts
import { satChecker } from "seo-accessibility-tool/sat-controller";

satChecker(); // starts when process.env.NODE_ENV is "development" (Vite, webpack, Next…)
satChecker({ enabled: true }); // or always, without a bundler
```

## Browser extension

Checks any page, a public site included, without installing SAT in a project. Build it and load it unpacked in Chrome or Edge:

```bash
npm install && npm run build
# chrome://extensions → Developer mode → Load unpacked → dist/extension
```

A click on the SAT button in the toolbar adds the panel to the open tab. The extension asks only for `activeTab` and `scripting`: it reads a tab only after its button is clicked there, and nothing leaves the browser. It works on pages with a strict Content Security Policy too.

---

## The panel

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/panel-dark.png">
  <img src="docs/images/panel-light.png" alt="The SAT panel next to a page: counters, issues by rule with WCAG criteria, and a box on an image without alt text">
</picture>

- **Dock**: play runs the checks and becomes stop; the arrow runs them again; the counts button opens the panel. SAT stays on across reloads until you stop it.
- **Summary**: errors, warnings, accessibility and SEO counters, each a toggle that filters the list and the boxes.
- **Issues**: by category, then by rule, errors first. Each rule has its title, WCAG criteria (or its source, such as Google) and "Why and how to fix". Click an issue to scroll to the element, focus it and flash its box.
- **Structure**: the H1–H6 tree of the page, skipped levels marked.
- **Boxes** over the page: red for errors, amber dashed for warnings; point at one for its issues. They are drawn on SAT's own layer: your page's elements, styles and attributes are never changed, and the panel's Shadow DOM keeps its CSS and yours apart.
- **Single-page apps**: a route change (`pushState`, `replaceState`, back/forward) runs the checks again; `observeDom` reruns them on any DOM change.
- Light and dark theme from the system, keyboard navigation (Escape closes the panel), no animations with `prefers-reduced-motion`. The panel passes SAT's own rules and axe-core in both themes.

## Fix with AI

1. **Copy fix prompt**, everywhere: the button on an issue, or **Copy prompt for all** on a rule, copies a prompt for your coding agent (Claude Code, Cursor, Copilot…). It has the rule, its source, the page URL and, for each issue, the message, the selector, the element's HTML and, with Vue and Svelte in development, the component file. It asks for the smallest fix in the source, and quotes the page as data, not instructions. The same prompt comes from the API:

   ```ts
   import { fixPrompt, seoAccessibilityTool } from "seo-accessibility-tool";

   const { issues } = await seoAccessibilityTool();
   const prompt = fixPrompt(issues.filter((issue) => issue.ruleId === "image-alt"), { url: location.href });
   ```

2. **Fix with AI** (optional, Vite plugin only): with `sat({ ai: true })` every issue gets a **Fix with AI** button that runs [Claude Code](https://code.claude.com) (`claude -p`) in your project, shows its progress and the files it changed, then checks the page again: **Fixed** or **Still present**. Requires Claude Code installed and signed in; SAT handles no API keys.

**What goes to the model.** SAT sends nothing anywhere. With Fix with AI on, Claude Code sends the prompt (which quotes the page) and the files it reads to the model, as when you use it directly.

**Safety.** The dev server answers `POST /__sat/fix` only for this computer, its own pages and a token created at every start. Claude Code gets `Read`, `Edit`, `Grep` and `Glob` only: no shell, no web, no MCP servers. SAT keeps no copies of your files: it warns about uncommitted changes, so commit first and review with `git diff`.

## Configuration

Turn rules off or change their severity with `rules`, as in ESLint:

```ts
useSATChecker({
  rules: {
    "color-contrast": "warning", // every issue of the rule becomes a warning
    "landmarks": "off",
    "link-text": "warning",      // rules that are off by default are turned on by a severity
  },
  allowedLinkTexts: ["Read more", "Learn more"],
});
```

| Option             | Description                                                                                      | Default |
|--------------------|--------------------------------------------------------------------------------------------------|---------|
| `rules`            | `{ [ruleId]: "error" \| "warning" \| "off" }`. A severity applies to every issue of that rule   | `{}`    |
| `wcagLevel`        | `"AA"` or `"AAA"`: AAA adds the AAA criteria as warnings (e.g. 1.4.6 contrast)                   | `"AA"`  |
| `allowedLinkTexts` | Link texts `link-text` accepts anyway (case-insensitive)                                         | `[]`    |
| `enabled`          | Controller only: `true` starts SAT without a bundler, `false` never starts it                    | starts when `NODE_ENV === "development"` |
| `observeDom`       | Controller only: while SAT is on, reruns the checks this many ms after the DOM stops changing    | off     |
| `engines`          | Other checkers run with SAT's rules, e.g. `[axe()]` (see below)                                  | `[]`    |

The 1.x options `enableCheck*` still work but are deprecated; `rules` takes precedence.

### Rules

Each rule follows an official source, cited on its page in [`docs/rules/`](docs/rules/): WCAG 2.2 and the W3C ACT rules, WAI-ARIA 1.2, the HTML standard, Google Search Central. Requirements are errors, recommendations are warnings, and what the sources call valid is not reported.

| Rule                | Category | Checks                                                                    | Default    |
|---------------------|----------|---------------------------------------------------------------------------|------------|
| `h1`                | seo      | The page has an `<h1>` (several are valid)                                | warning    |
| `h1-visible`        | seo      | The first `<h1>` is rendered (not hidden)                                 | warning    |
| `heading-order`     | a11y     | The first heading of the page is an `<h1>`                                | warning    |
| `heading-levels`    | a11y     | Skipped heading levels (e.g. H2 → H4)                                     | warning    |
| `accessible-name`   | a11y     | Buttons, links, menu items, `<summary>`, headings, `svg[role="img"]` and `<object>` have an accessible name | error |
| `aria-roles`        | a11y     | Invalid `role` values (error), redundant roles (warning)                  | error      |
| `aria-attributes`   | a11y     | Unknown `aria-*` attributes, invalid values, missing required states, attributes the role doesn't support or prohibits | error |
| `aria-hidden-focus` | a11y     | Elements reachable with Tab inside `aria-hidden="true"`                   | error      |
| `landmarks`         | a11y     | Several visible `<main>` (error); no main, several page-level header/footer, unlabelled repeated navs (warning) | error |
| `color-contrast`    | a11y     | WCAG text contrast: below AA (error), below AAA with `wcagLevel: "AAA"` (warning) | error |
| `form-label`        | a11y     | Form fields have a label (placeholder is not enough)                      | error      |
| `focus-management`  | a11y     | Hidden focusable elements (error), positive tabindex and non-interactive tab stops (warning) | error |
| `image-alt`         | a11y     | `<img>` without `alt` (error), alt text that looks like a file name (warning) | error  |
| `link-href`         | a11y     | `href=""`, `#` or `javascript:`                                           | error      |
| `link-target-blank` | seo      | `target="_blank"` with `rel="opener"` (HTML already implies noopener)    | off        |
| `tabindex-negative` | a11y     | Visible native controls removed from the tab order with `tabindex="-1"`   | warning    |
| `link-text`         | a11y     | Vague link texts ("click here", "more")                                    | off        |
| `html-lang`         | a11y     | `<html>` has a `lang`; every `lang` is a valid language tag               | error      |
| `iframe-name`       | a11y     | `<iframe>` has a `title`, `aria-label` or `aria-labelledby`               | error      |
| `label-in-name`     | a11y     | The visible label of a button or link is part of its `aria-label`         | error      |
| `target-size`       | a11y     | Targets under 24×24 px too close to other targets (WCAG 2.2, browser only) | error     |
| `autocomplete-valid`| a11y     | `autocomplete` values follow the HTML autofill tokens                     | error      |
| `table-headers`     | a11y     | `headers` pointing outside the table, header cells without cells          | error      |
| `meta-viewport`     | a11y     | `user-scalable=no` or `maximum-scale` below 2 (zoom blocked)              | error      |
| `meta-refresh`      | a11y     | `<meta http-equiv="refresh">` with a delay (1 s to 20 h)                  | error      |
| `media-autoplay`    | a11y     | `<video>`/`<audio>` that autoplay with sound and no controls              | warning    |
| `seo-meta`          | seo      | One `<title>` and one meta description (error), meta viewport (warning); no length limits | error |
| `canonical`         | seo      | Several or empty canonicals (error), missing or relative canonical (warning) | warning   |
| `robots-meta`       | seo      | `noindex`, `nofollow` or `none` in a robots meta tag                      | warning    |
| `social-meta`       | seo      | Required Open Graph properties, absolute `og:image`/`og:url`, `twitter:card` | warning |
| `hreflang`          | seo      | Invalid language codes, relative URLs, one language with two URLs         | error      |
| `structured-data`   | seo      | JSON-LD that doesn't parse, items without `@type`, properties Google requires for rich results (Product, Event, Breadcrumb…) | error |
| `mixed-content`     | seo      | `http:` resources on an `https:` page: scripts, frames, styles (error), images and media (warning) | error |
| `image-size`        | seo      | Visible `<img>` without `width` and `height` (layout shift)               | warning    |
| `image-lazy-load`   | seo      | `loading="lazy"` on images visible when the page opens                    | warning    |
| `link-broken`       | seo      | HEAD request to each internal link to find 4xx/5xx (skips logout-like URLs); `sat-check --depth` finds SPA 404s too | off |

The panel links each rule to its page; each issue carries its URL in `help`, the rule's name in `title` and, for rules without a WCAG criterion, its source in `source`.

## axe-core engine (optional)

[axe-core](https://github.com/dequelabs/axe-core) adds about 90 accessibility rules:

```bash
npm install -D axe-core
```

```ts
import { satChecker } from "seo-accessibility-tool/sat-controller";
import { axe } from "seo-accessibility-tool/axe";

satChecker({ engines: [axe()] }); // with React or Vue: useSATChecker({ engines: [axe()] })
```

- axe's violations appear as `axe/<rule>` with a link to Deque's page; critical and serious ones are errors, the others warnings.
- The SAT rules axe covers are off while it runs, so a problem is reported once (`target-size` stays on); setting one in `rules` turns it back on. `rules` sets axe rules too: `{ "axe/region": "off" }`. `axe(options)` takes axe's run options, e.g. `axe({ runOnly: ["wcag2a", "wcag2aa"] })`.
- axe adds about 550 KB (150 KB gzipped) and makes a run slower: 0.1–1.5 s instead of 5–50 ms on real pages.

## Results without the panel

```ts
import { runSAT } from "seo-accessibility-tool";

const { issues, summary } = await runSAT({ rules: { "link-text": "warning" } });
// issues: [{ ruleId, severity, category, message, title?, wcag?, source?, selector?, help? }], summary: { errors, warnings }
```

`runSAT(options?, document?)` returns plain data, ready for `JSON.stringify`. `seoAccessibilityTool(options)` returns the same issues with their DOM `element`. The page is never changed; `satReset` is deprecated and does nothing.

## Playwright

`seo-accessibility-tool/playwright` checks a page in your end-to-end tests; the page doesn't need to import SAT. `@playwright/test` is an optional peer dependency.

```ts
import { test } from "@playwright/test";
import { checkPage, expect } from "seo-accessibility-tool/playwright";

test("home has no SAT errors", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveNoSATErrors(); // fails with the list of errors: rule, message, selector
});

test("report", async ({ page }) => {
  await page.goto("/");
  const { issues, summary } = await checkPage(page, { rules: { "social-meta": "off" }, axe: true });
});
```

- Both take the options that can cross into the page (`rules`, `wcagLevel`, `allowedLinkTexts`, the 1.x flags) and `axe: true` (install `axe-core`).
- `expect` is Playwright's own, extended: use it in place of the one from `@playwright/test`, or merge it with yours through `mergeExpects`.
- Pages with a strict Content Security Policy block the added script: create the context with `bypassCSP: true`.

## CLI and CI

```bash
npm install -D seo-accessibility-tool @playwright/test
npx playwright install chromium
npx sat-check http://localhost:5173/ http://localhost:5173/pricing
```

| Option | Default | Meaning |
|--------|---------|---------|
| `--max-errors <n>` | `0` | Errors allowed over all pages; above it the exit code is 1 |
| `--max-warnings <n>` | no limit | Warnings allowed over all pages |
| `--json <file>` | — | Writes `{ pages: [{ url, issues, summary }], summary }` |
| `--html <file>` | — | Writes a standalone HTML report |
| `--config <file>` | — | JSON with SAT options, e.g. `{ "rules": { "link-text": "warning" } }` |
| `--axe` | off | Runs axe-core too (install `axe-core`) |
| `--wcag-level <level>` | `AA` | `AAA` adds the AAA criteria as warnings |
| `--depth <n>` | `0` | Follows same-origin links this many levels deep, checks those pages and reports broken links |
| `--max-pages <n>` | `100` | Stops after this many pages |
| `--not-found <text>` | — | A page showing this text is a broken link: the "not found" view of a single-page app |

Exit codes: 0 within the limits, 1 above them, 2 for a wrong command or a run that couldn't start.

**Broken links.** With `--depth` every link is opened in Chromium, so a single-page app resolves the route with its own router. A link is broken when the server answers 4xx/5xx, the navigation fails, or the page shows the `--not-found` text; logout, delete and similar URLs are never opened.

**GitHub Actions:**

```yaml
name: SAT
on: [pull_request]
jobs:
  sat:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with: { node-version: lts/*, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build && (npx vite preview --port 4173 &) && curl -s --retry 10 --retry-connrefused -o /dev/null http://localhost:4173/
      - run: npx sat-check http://localhost:4173/ --depth 2 --not-found "Page not found" --max-warnings 20 --html sat-report.html
      - uses: actions/upload-artifact@v7
        if: always()
        with: { name: sat-report, path: sat-report.html }
```

---

## What SAT does not do

- **It doesn't certify WCAG conformance.** Automated checks find a part of the WCAG failures. The rest needs a person: keyboard use, screen readers (NVDA, JAWS, VoiceOver), zoom and reflow, whether alt texts, labels and captions make sense. No errors in SAT means no errors SAT can detect.
- **It doesn't guarantee a position on Google.** The SEO rules check technical requirements from Google Search Central (title, description, canonical, hreflang, structured data); they don't judge content, links from other sites or ranking.
- **In the page it runs in development only.** The panel starts when `NODE_ENV` is `"development"` (or with `enabled: true`), and the Vite plugin adds it to `vite dev` only: SAT is not meant for production pages.
- **Broken links are complete only in the CLI.** The in-page `link-broken` rule is off by default and sends HEAD requests, which can't see the 404 view of a single-page app; `sat-check --depth` opens every link in Chromium.
- **What it doesn't see:**
  - the documents inside `<iframe>` elements, of any origin (SAT checks the frame's name, not its content), and the shadow roots of web components;
  - what is drawn in a `<canvas>`;
  - the contrast of text over a background image or a gradient: it isn't reported, because the background color can't be known;
  - states that appear only after an interaction, such as open menus, dialogs, hover and focus styles: SAT checks the page as it is when it runs. Open the state and run the checks again, or use `observeDom`.

**Optional features**, each off until you add it:

| Feature | Needs |
|---|---|
| [axe-core engine](#axe-core-engine-optional) | `npm install -D axe-core` (4.10 or later); adds about 550 KB and makes a run slower |
| [Fix with AI](#fix-with-ai) | The Vite plugin with `ai: true`, [Claude Code](https://code.claude.com) installed and signed in; Claude Code sends the prompt, which quotes the page, to the model |
| [Playwright helper](#playwright) and [CLI](#cli-and-ci) | `@playwright/test` and Chromium (`npx playwright install chromium`), Node 22 or later |
| [Browser extension](#browser-extension) | Built from this repository and loaded unpacked in Chrome or Edge; it isn't on the Chrome Web Store |

## Contributing

Bug reports, false positives and ideas are welcome in the [issues](https://github.com/flgisimone/SAT/issues); see [CONTRIBUTING.md](CONTRIBUTING.md), and [SECURITY.md](SECURITY.md) for security issues.

```bash
npm install
npm run verify       # type check, lint, unit tests, build
npm run verify:e2e   # build + browser tests (Chromium)
npm run smoke        # npm pack, then the package installed in a copy of each example
npm run media        # the README images, from examples/page (the GIF needs ffmpeg)
```

Conventions: [CONVENTIONS.md](CONVENTIONS.md) · agent rules: [AGENTS.md](AGENTS.md) · roadmap: [plan/README.md](plan/README.md) · changes: [CHANGELOG.md](CHANGELOG.md)

## License

[MIT](LICENSE) © 2025–2026 [Giulio Simone Floresta](https://github.com/flgisimone)
