# Troubleshooting

Each entry: what you see, why, what to do. The messages in quotes are the ones SAT, Vite or Playwright print.

## The panel doesn't appear

### With the Vite plugin, after `vite build` or in `vite preview`

**Why.** The plugin adds SAT to `vite dev` only: the build doesn't include it, by design.

**Fix.** Run `vite dev` (`npm run dev`). To check a build, use [`sat-check`](ci.md).

### With the Vite plugin, in SvelteKit

**Why.** The plugin adds SAT through Vite's `index.html` (the `transformIndexHtml` hook). SvelteKit renders its pages from `src/app.html` on its own, without that hook, so SAT is never added. The same holds for other frameworks that render the HTML themselves instead of serving `index.html`.

**Fix.** Remove `sat()` from `vite.config` and start SAT from the root layout:

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import { onMount } from "svelte";
  import { satChecker } from "seo-accessibility-tool/sat-controller";

  let { children } = $props();
  onMount(() => satChecker()); // starts when NODE_ENV is "development"
</script>

{@render children()}
```

### With `satChecker`, `useSATChecker` or `useSatChecker`

**Why.** SAT starts only when `process.env.NODE_ENV` is `"development"`. Vite, webpack and Next set it in development; without a bundler `process` doesn't exist and SAT stays off. Nothing is printed: off is the normal state outside development.

**Fix.** Tell SAT when to start with `enabled`: `satChecker({ enabled: true })` without a bundler, `satChecker({ enabled: isDevMode() })` in Angular, `enabled: import.meta.env.DEV` with Vite.

### With `axe: true` or `engines: [axe()]`

**What you see.** No panel; in the browser console and in the terminal of `vite dev`:

> Could not resolve "axe-core" imported by "seo-accessibility-tool". Is it installed?

**Why.** axe-core is an optional dependency: it isn't installed with SAT.

**Fix.** `npm install -D axe-core`, then restart the dev server.

## The panel ignores my options

**Why.** SAT starts once per page, with the options of the first call. With the Vite plugin in `vite.config` and `useSATChecker(options)` in the app, only the one that runs first counts.

**Fix.** Start SAT in one place only. With the Vite plugin, put the options in `sat(options)`; see [configuration.md](configuration.md#where-the-options-go).

## `sat-check` doesn't run

### "sat-check needs Playwright"

> sat-check needs Playwright: npm install -D @playwright/test && npx playwright install chromium

**Why.** `sat-check` opens the pages with Playwright, an optional dependency. Exit code 2.

**Fix.** Run the two commands of the message.

### "Executable doesn't exist"

```
browserType.launch: Executable doesn't exist at …/chrome-headless-shell
╔════════════════════════════════════════════════════════════╗
║ Looks like Playwright was just installed or updated.       ║
║ Please run the following command to download new browsers: ║
║                                                            ║
║     npx playwright install                                 ║
```

**Why.** Playwright is installed but its Chromium isn't, or it belongs to another version of Playwright (after an update of `@playwright/test`). Exit code 2.

**Fix.** `npx playwright install chromium`; in CI `npx playwright install --with-deps chromium`, which installs the system libraries too.

### "Page can't be checked"

```
error   link-broken           Page can't be checked: http://localhost:4173/ (request failed: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4173/).
```

**Why.** Nothing answers at that URL: the server isn't started, isn't ready yet, or listens on another port. The page counts as one error, so the exit code is 1.

**Fix.** Start the server before `sat-check` and wait until it answers, e.g. `curl -s --retry 10 --retry-connrefused -o /dev/null http://localhost:4173/`, as in the [CI guide](ci.md#github-actions).

### "Not a URL"

> Not a URL: "/index.html" (include the protocol, e.g. http://localhost:5173/).

**Fix.** Give full URLs. For a file on disk use `file://`: `sat-check file://$PWD/index.html`, on Windows `file:///C:/path/to/index.html`.

### "axe-core is not installed"

> Error: axe-core is not installed: npm install -D axe-core

**Why.** `--axe`, `"axe": true` in the config file or `checkPage(page, { axe: true })` without axe-core. Exit code 2.

**Fix.** `npm install -D axe-core`.

### In Playwright tests: "violates the following Content Security Policy directive"

> page.addScriptTag: Executing inline script violates the following Content Security Policy directive 'default-src 'self''. …

**Why.** `checkPage` and `toHaveNoSATErrors` add SAT to the page as a script, and the page's Content Security Policy blocks it. `sat-check` isn't affected: it opens the pages without the policy.

**Fix.** Create the context with `bypassCSP: true`, e.g. `test.use({ bypassCSP: true })`.

## Fix with AI

### There is no "Fix with AI" button

**Why.** The button exists only with the Vite plugin and `ai: true`; "Copy fix prompt" is everywhere.

**Fix.** `sat({ ai: true })` in `vite.config`, then restart the dev server.

### "Claude Code is not installed or not in the PATH"

> Claude Code is not installed or not in the PATH. Install it from https://code.claude.com/docs/en/setup and sign in with `claude`.

**Why.** Fix with AI runs `claude` in the project, from the terminal where `vite dev` runs.

**Fix.** Install Claude Code, run `claude` once in a terminal to sign in, then start `vite dev` from a terminal where `claude` works. If Claude Code is installed but not signed in, the panel shows Claude Code's own message: signing in fixes it too.

### "Invalid SAT token: reload the page."

**Why.** The dev server makes a new token at every start; the page still has the one of the previous run.

**Fix.** Reload the page.

### "Fix with AI accepts requests from this computer only."

**Why.** The page is open on another device, through `vite --host`. Only this computer may run Claude Code in the project.

**Fix.** Use Fix with AI from a browser on the computer that runs `vite dev`.

### "Fix with AI accepts requests from the dev server's pages only."

**Why.** The page comes from another origin than the dev server, e.g. through a proxy or a different host name.

**Fix.** Open the page at one of the URLs `vite dev` prints.

### "The repository has uncommitted changes"

> The repository has uncommitted changes: commit or stash them to undo the fix with git.

**Why.** A warning, not an error: the fix runs anyway. SAT keeps no copies of your files, so git is how you undo a fix.

**Fix.** Commit or stash before a fix, review it with `git diff`.

## A rule reports something that is right

SAT follows the specifications (WCAG 2.2, WAI-ARIA 1.2, HTML, Google Search Central) and should not report valid patterns; when it does, it's a bug.

1. Open the rule's page ("Why and how to fix" in the panel, or `help` in the results): it cites the source and what the rule accepts.
2. If the source says your markup is valid, [report a false positive](https://github.com/flgisimone/SAT/issues/new?template=false-positive.yml) with the HTML of the element, the message SAT prints and the part of the source that allows it.
3. Until it's fixed, lower the rule's severity or turn it off: `rules: { "<rule>": "warning" }` or `"off"`.

"Error while running SAT." in the panel, or an issue "SAT internal error in …", is a bug of SAT too: [report it](https://github.com/flgisimone/SAT/issues/new?template=bug.yml) with the page or a reduced copy of it.
