# Configuring SAT

The same options work in every integration: which rules run and how severe their issues are, the WCAG level, the link texts to accept, axe-core. This guide shows where they go and how to keep one configuration for the panel and CI.

## Where the options go

| Integration | Options | What it takes |
|---|---|---|
| Vite plugin | `sat(options)` in `vite.config` | The options that fit in JSON, `axe`, `ai: true`, `mcp: true` |
| Without Vite (SvelteKit, Angular, Next.js, vanilla JS) | `satChecker(options)` | All the options |
| Playwright | `checkPage(page, options)`, `toHaveNoSATErrors(options)` | The options that fit in JSON, `axe: true` |
| CLI | `sat-check --config sat.config.json`, plus `--axe` and `--wcag-level` | The options that fit in JSON, `axe: true` |
| API | `runSAT(options)`, `seoAccessibilityTool(options)` | All the options except `enabled` and `observeDom` |

SAT starts once per page, with the options of the first call: with the Vite plugin, a `satChecker()` in the app adds nothing.

## Rules

`rules` sets a severity for each rule, or turns it off, as in ESLint:

```ts
sat({
  rules: {
    "color-contrast": "warning", // every issue of the rule becomes a warning
    "landmarks": "off",
    "link-text": "warning",      // rules that are off by default are turned on by a severity
  },
});
```

- **`"error"` or `"warning"`** applies to every issue of the rule. Some rules report both: `landmarks` reports several `<main>` as an error and a missing `<main>` as a warning; with `"landmarks": "warning"` both are warnings.
- **`"off"`** doesn't run the rule.
- **Not set**: the rule runs with its own severities, which follow its source: errors for requirements (WCAG A and AA, the "must" of HTML and WAI-ARIA, Google's requirements), warnings for recommendations.
- **Off by default**: `link-text` and `link-target-blank`. A severity turns them on.

The rule ids, their defaults and what each one checks are in the [README](../../README.md#rules); each rule has its page in [docs/rules](../rules/).

## WCAG level

```ts
sat({ wcagLevel: "AAA" });
```

`"AA"` (the default) checks WCAG A and AA. `"AAA"` adds the AAA criteria as warnings: contrast below 7:1 for normal text (1.4.6). The CLI takes `--wcag-level AAA`.

## Link texts

`link-text` reports vague link texts such as "click here" or "more" (off by default). `allowedLinkTexts` accepts some anyway, ignoring case:

```ts
sat({
  rules: { "link-text": "warning" },
  allowedLinkTexts: ["Read more", "Learn more"],
});
```

## axe-core

[axe-core](https://github.com/dequelabs/axe-core) adds about 90 accessibility rules to SAT's.

```bash
npm install -D axe-core
```

| Integration | How |
|---|---|
| Vite plugin | on by itself when `axe-core` is installed in the project; `axe: false` turns it off |
| Playwright, CLI config | `axe: true` |
| CLI | `--axe` |
| React, Vue, `satChecker` | `engines: [axe()]`, with `import { axe } from "seo-accessibility-tool/axe"` |

```ts
import { satChecker } from "seo-accessibility-tool/sat-controller";
import { axe } from "seo-accessibility-tool/axe";

satChecker({ engines: [axe({ runOnly: ["wcag2a", "wcag2aa"] })] });
```

- axe's issues are named `axe/<rule>`, e.g. `axe/image-alt`; critical and serious ones are errors, the others warnings.
- The SAT rules axe covers are off while it runs, so a problem is reported once. Setting one in `rules` turns it back on.
- `rules` sets axe rules too: `{ "axe/region": "off" }`.
- `axe(options)` takes axe's run options; it is the only way to pass them, so `axe: true` and the Vite plugin run axe with its defaults.
- The Vite plugin checks whether `axe-core` resolves from the project root when the dev server starts, and prints "SAT: axe-core found, running it as an engine". The other integrations don't, because without a bundler that checks it an import of a missing package breaks the page.
- axe adds about 550 KB (150 KB gzipped) and makes a run slower: 0.1–1.5 s instead of 5–50 ms on real pages.

## One config for the panel and the CLI

Keep the options in a JSON file and give the same file to the plugin and to `sat-check`, so the panel and CI report the same issues. This is how [examples/vite-vanilla](../../examples/vite-vanilla) does it:

```json
{ "rules": { "link-text": "warning" } }
```

```js
// vite.config.js
import { defineConfig } from "vite";
import { sat } from "seo-accessibility-tool/vite";
import satConfig from "./sat.config.json" with { type: "json" };

// SAT is added to the pages of `vite dev`; the app's code doesn't import it.
// sat.config.json holds the options: the panel and `npm run check` (sat-check) share them.
export default defineConfig({
  plugins: [sat(satConfig)],
});
```

```bash
npx sat-check http://localhost:4173/ --config sat.config.json
```

In `vite.config.ts`, TypeScript reads the JSON's values as plain strings: give it the plugin's type.

```ts
import { sat, type SATViteOptions } from "seo-accessibility-tool/vite";
import satConfig from "./sat.config.json" with { type: "json" };

sat(satConfig as SATViteOptions);
```

The file can hold `rules`, `wcagLevel`, `allowedLinkTexts` and `axe`. `--axe` and `--wcag-level` on the command line take precedence over it. With `axe-core` installed the plugin runs it and `sat-check` doesn't, unless the file has `"axe": true` or the command `--axe`: the panel then shows axe's issues in place of the SAT rules they cover.

Options for the plugin only, such as `mcp`, go next to the file's: `sat({ ...satConfig, mcp: true })`.

## Options of the panel only

| Option | Meaning | Default |
|---|---|---|
| `enabled` | `true` starts SAT without a bundler, `false` never starts it | starts when `process.env.NODE_ENV === "development"` |
| `observeDom` | While SAT is on, reruns the checks this many ms after the DOM stops changing | off |

The Vite plugin sets `enabled` itself (SAT is in `vite dev` only) and takes `observeDom`. With Angular, `satChecker({ enabled: isDevMode() })`; more on `observeDom` in [spa.md](spa.md).

## All the options

| Option | Type | Default |
|---|---|---|
| `rules` | `{ [ruleId]: "error" \| "warning" \| "off" }` | `{}` |
| `wcagLevel` | `"AA" \| "AAA"` | `"AA"` |
| `allowedLinkTexts` | `string[]` | `[]` |
| `engines` | `Engine[]`, e.g. `[axe()]` | `[]` |
| `enabled` | `boolean` | `NODE_ENV === "development"` |
| `observeDom` | `number` (ms) | off |
| `axe` | `boolean`: Vite plugin, Playwright, CLI config | Vite plugin: `true` when `axe-core` is installed; otherwise `false` |
| `ai` | `boolean`: Vite plugin, [Fix with Claude Code](../../README.md#from-the-panel-to-the-agent) | `false` |
| `mcp` | `boolean`: Vite plugin, [MCP server](ai-agents.md) for AI agents and [Send to agent](ai-agents.md#send-to-agent) | `false` |
