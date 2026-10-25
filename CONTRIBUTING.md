# Contributing to SAT

Thanks for helping. Bug reports, false positives and rule proposals are as useful as code: open an [issue](https://github.com/flgisimone/SAT/issues/new/choose) with the template that fits. Questions go to [Discussions](https://github.com/flgisimone/SAT/discussions).

## Setup

Node 26 for development, as in [.nvmrc](.nvmrc) (`nvm use`); the package itself runs on Node 22 or later.

```bash
git clone https://github.com/flgisimone/SAT.git && cd SAT
npm install
npx playwright install chromium
```

| Command | What it does |
|---|---|
| `npm run verify` | Type check, lint, unit tests (Vitest, jsdom), build. Must pass before every commit |
| `npm run verify:e2e` | Build and browser tests (Playwright, Chromium) |
| `npm run smoke` | `npm pack`, then the package installed in a copy of each folder of [examples/](examples/) and tried there |
| `npx vitest run tests/checks.test.ts` | One unit test file while you work |
| `npx playwright test tests/browser/panel.spec.ts` | One browser test file (run `npm run build` first) |

## Adding or changing a rule

SAT would rather miss an issue than report a valid pattern: developers stop trusting a tool that flags correct code.

1. **Start from a source.** Every rule follows WCAG 2.2 and the W3C ACT rules, WAI-ARIA 1.2, the HTML standard or Google Search Central. Link the section in the issue or pull request. A requirement is an error, a recommendation a warning, and what the source calls valid is not reported.
2. **Write the rule** in `src/core/rules/<category>/<id>.ts`, add it to `src/core/rules/index.ts`, and select elements with `queryTargets` from `src/sat/satDom.ts`. Rules only report: they never change the page.
3. **Test both sides**: markup that fails, and the valid patterns next to it that must not be reported. Rules that depend on layout, colors or visibility also need a browser test in `tests/browser/`. When an ACT rule exists, its test cases go in `tests/act/`.
4. **Document it**: a page in `docs/rules/<id>.md`, a row in the README rules table, an entry in `CHANGELOG.md`.

The details (severity, messages, the host page, the public API) are in [CONVENTIONS.md](CONVENTIONS.md); [AGENTS.md](AGENTS.md) has the rules for AI coding agents working on this repository.

## Proposing a change

1. Open an issue first for anything larger than a fix, so we agree on the approach.
2. Branch from `develop`, keep the change small and focused, and add a `CHANGELOG.md` entry when users will notice it.
3. Run `npm run verify` and `npm run verify:e2e`, then open a pull request against `develop`.

Releases to npm are made by the maintainer.
