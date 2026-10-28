# SAT in CI

Two ways to fail a build on accessibility and SEO issues:

- **`sat-check`**, the command line: it opens your pages in Chromium, prints the issues, writes JSON and HTML reports and exits with 1 above the limits you set. It needs no test suite.
- **The Playwright helper**, if you already have Playwright tests: `expect(page).toHaveNoSATErrors()` in the tests you have.

Both run the same checks as the panel.

## Install

```bash
npm install -D seo-accessibility-tool @playwright/test
npx playwright install chromium
```

Node 22 or later. In CI, `npx playwright install --with-deps chromium` installs Chromium's system libraries too.

## sat-check on your site

`sat-check` checks pages that a server is serving: start your build with a static server (`vite preview`, `npx serve dist`…) or your app, then give it the URLs.

```bash
npx sat-check http://localhost:4173/ http://localhost:4173/pricing
```

```
http://localhost:4173/  5 errors, 3 warnings
  warning heading-levels        Heading level skipped: <h4 id="returns"> "Returns" comes after an H2. Expected H3 or higher.
                              [id="returns"]
  error   color-contrast        Insufficient contrast on <p id="fine-print" class="faint"> "Offers end on Sunday.": ratio 1.98. Minimum AA is 4.5.
                              [id="fine-print"]
  …

1 page: 5 errors, 3 warnings (max 0 errors)
```

Each issue has its severity, its rule, the message and the CSS selector of the element. The [rule pages](../rules/) explain each rule and how to fix it.

**Exit codes**: 0 within the limits, 1 above them, 2 for a wrong command or a run that couldn't start (Playwright or Chromium missing).

## GitHub Actions

This workflow builds the site, serves it with `vite preview` and checks it. It is the one in [examples/vite-vanilla](../../examples/vite-vanilla), where `npm run smoke` runs the same scripts on every change to SAT:

```yaml
# SAT in CI: builds the site, serves it with `vite preview` and checks it with sat-check.
# The job fails above the limits (by default: any error) and keeps the reports as an artifact.
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

with these scripts in `package.json`:

```json
"scripts": {
  "build": "vite build",
  "preview": "vite preview --port 4173 --strictPort",
  "check": "sat-check http://localhost:4173/ --config sat.config.json --json sat-report.json --html sat-report.html"
}
```

- `npm run preview &` keeps the server running for the next steps; `curl --retry` waits until it answers.
- `if: always()` uploads the reports when the check fails too, which is when you need them.
- Not on Vite? Make `preview` start whatever serves your build, on the port of the `check` URL.

## GitLab CI

The same steps in `.gitlab-ci.yml`:

```yaml
sat:
  image: node:lts
  script:
    - npm install
    - npx playwright install --with-deps chromium
    - npm run build
    - npm run preview &
    - curl -s --retry 10 --retry-connrefused -o /dev/null http://localhost:4173/
    - npm run check
  artifacts:
    when: always
    paths:
      - sat-report.*
```

## Limits

| Option | Default | Meaning |
|---|---|---|
| `--max-errors <n>` | `0` | Errors allowed over all pages; above it the exit code is 1 |
| `--max-warnings <n>` | no limit | Warnings allowed over all pages |

By default any error fails the build and warnings don't. `--max-warnings 0` makes warnings fail it too.

### Starting on a project with many issues

Don't turn the check off until everything is fixed: lock the current state, then lower the limits.

1. Run `sat-check` once and read the totals on the last line, e.g. `1 page: 37 errors, 112 warnings`.
2. Set the limits to those numbers: `--max-errors 37 --max-warnings 112`. The build passes today and fails as soon as a change adds an issue.
3. Lower the limits as you fix issues, down to `--max-errors 0`.

To fix one rule at a time, lower its severity until its issues are fixed, in the [config file](configuration.md): `{ "rules": { "color-contrast": "warning" } }`. Turning a rule `"off"` hides its issues, new ones included.

## Reports

| Option | Writes |
|---|---|
| `--json <file>` | `{ pages: [{ url, issues, summary }], summary }`: each issue with `ruleId`, `severity`, `category`, `message`, `title`, `wcag` or `source`, `selector`, `help` |
| `--html <file>` | A standalone HTML page: the totals, then a table for each page with severity, rule (linked to its page), message and selector |

Examples, made by `sat-check` on the page with known issues of [examples/page](../../examples/page): [sat-report.json](reports/sat-report.json) and [sat-report.html](https://flgisimone.github.io/SAT/report.html) ([source](reports/sat-report.html)). `npm run media`, in the SAT repository, makes them again.

The JSON report is for your own tools: a comment on the pull request, a dashboard, a diff between two runs.

## Checking more pages

List every route to check: `sat-check` opens each one in Chromium, so a single-page app resolves it with its own router (the server must answer every route with the app, as `vite preview` does). SAT doesn't crawl a site or check links: for that, use [unlighthouse](https://unlighthouse.dev) or [pa11y-ci](https://github.com/pa11y/pa11y-ci) with a sitemap. More on single-page apps in [spa.md](spa.md).

## Options

`--config <file>` reads the SAT options from a JSON file, e.g. `{ "rules": { "link-text": "warning" } }`; the Vite plugin can read the same file, see [configuration.md](configuration.md#one-config-for-the-panel-and-the-cli). On the command line:

| Option | Meaning |
|---|---|
| `--axe` | Runs [axe-core](configuration.md#axe-core) too (`npm install -D axe-core`) |
| `--wcag-level AAA` | Adds the AAA criteria as warnings |

## In your Playwright tests

If you already have Playwright tests, SAT can check the pages they open. The page doesn't need to import SAT.

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

- The check runs on the page as it is: open the state you want to check first (a dialog, a filled form), then call it.
- `expect` is Playwright's own, extended: use it in place of the one from `@playwright/test`, or merge it with yours through `mergeExpects`.
- Pages with a strict Content Security Policy block the script SAT adds: create the context with `bypassCSP: true` (`sat-check` does it for you).
