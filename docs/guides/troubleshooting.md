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

### With `satChecker`

**Why.** SAT starts only when `process.env.NODE_ENV` is `"development"`. Vite, webpack and Next set it in development; without a bundler `process` doesn't exist and SAT stays off. Nothing is printed: off is the normal state outside development.

**Fix.** Tell SAT when to start with `enabled`: `satChecker({ enabled: true })` without a bundler, `satChecker({ enabled: isDevMode() })` in Angular, `enabled: import.meta.env.DEV` with Vite.

### With axe-core (`axe` in the Vite plugin, `engines: [axe()]`)

**What you see.** No panel; in the browser console and in the terminal of `vite dev`:

> Could not resolve "axe-core" imported by "seo-accessibility-tool". Is it installed?

**Why.** axe-core is an optional dependency: it isn't installed with SAT. The Vite plugin turns it on only when it finds it, so this happens with `axe: true` or `engines: [axe()]`, or when `axe-core` resolves from the project root but not from SAT's folder (a monorepo with a different `node_modules`).

**Fix.** `npm install -D axe-core` in the project that runs `vite dev`, then restart the dev server; or remove `axe: true`.

## The panel ignores my options

**Why.** SAT starts once per page, with the options of the first call. With the Vite plugin in `vite.config` and `satChecker(options)` in the app, only the one that runs first counts.

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

### "Can't open"

```
Can't open http://localhost:4173/: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4173/. Is the server started?
```

**Why.** Nothing answers at that URL: the server isn't started, isn't ready yet, or listens on another port. Exit code 2.

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

## Send to agent and Fix with Claude Code

### There is no "Send to agent" or "Fix with Claude Code" button

**Why.** "Send to agent" exists only with the Vite plugin and `mcp: true`, "Fix with Claude Code" only with `ai: true`; "Copy fix prompt" is everywhere.

**Fix.** `sat({ mcp: true })` (or `ai: true`) in `vite.config`, then restart the dev server.

### The issue stays "Queued"

**Why.** The agent gets the issues you sent only when it calls `sat_issues`: MCP doesn't let the server push them.

**Fix.** Ask the agent to fix the issues you sent from SAT. If it doesn't call `sat_issues`, check that it is connected to the MCP server ([below](#the-agent-doesnt-see-sat-mcp-server)).

### "Claude Code is not installed or not in the PATH"

> Claude Code is not installed or not in the PATH. Install it from https://code.claude.com/docs/en/setup and sign in with `claude`.

**Why.** Fix with Claude Code runs `claude` in the project, from the terminal where `vite dev` runs.

**Fix.** Install Claude Code, run `claude` once in a terminal to sign in, then start `vite dev` from a terminal where `claude` works. If Claude Code is installed but not signed in, the panel shows Claude Code's own message: signing in fixes it too.

### "Invalid SAT token: reload the page."

**Why.** The dev server makes a new token at every start; the page still has the one of the previous run.

**Fix.** Reload the page.

### "SAT accepts requests from this computer only."

**Why.** The page is open on another device, through `vite --host`. Only this computer may run Claude Code in the project or send results to the MCP server.

**Fix.** Use Send to agent, Fix with Claude Code and the MCP server from a browser on the computer that runs `vite dev`.

### "SAT accepts requests from the dev server's pages only."

**Why.** The page comes from another origin than the dev server, e.g. through a proxy or a different host name.

**Fix.** Open the page at one of the URLs `vite dev` prints.

### "The repository has uncommitted changes"

> The repository has uncommitted changes: commit or stash them to undo the fix with git.

**Why.** A warning, not an error: the fix runs anyway. SAT keeps no copies of your files, so git is how you undo a fix.

**Fix.** Commit or stash before a fix, review it with `git diff`.

## The agent doesn't see SAT (MCP server)

### The agent can't connect, or the tools are missing

**Why.** The MCP server exists only with `sat({ mcp: true })` and while `vite dev` runs; or the agent points at another port.

**Fix.** Add `mcp: true`, start `vite dev` and check the line it prints: `SAT: MCP server at http://localhost:5173/__sat/mcp`. The agent's configuration must have that URL ([AI agents](ai-agents.md)); after a change, restart the agent or reconnect the server (`/mcp` in Claude Code).

### The port changed

**Why.** When 5173 is taken, Vite picks the next free port, and the URL in the agent's configuration no longer matches. Vite then prints "set server.strictPort".

**Fix.** Set `server: { strictPort: true }` (and `port` if you use another one) in `vite.config`: Vite stops with an error instead of changing port, and the URL stays the same.

### "sat_check opens the page in headless Chromium with Playwright, which is not installed"

**Why.** `sat_check` loads `playwright` or `@playwright/test` from the project, and neither is installed. Playwright is an optional peer dependency of SAT.

**Fix.** `npm install -D playwright`, then `npx playwright install chromium`. No restart of `vite dev` is needed. Without Playwright, open the page in the browser and let the agent use `sat_issues` and `sat_recheck`.

### "sat_check needs the Chromium of Playwright"

**Why.** Playwright is installed, its browser isn't, or it is for another version of Playwright.

**Fix.** `npx playwright install chromium` in the project. In CI or a container, `npx playwright install --with-deps chromium` adds the system libraries too.

### "redirected to /login" with `sat_check`

**Why.** `sat_check` opens the route in a fresh browser, without your cookies: a route behind a login sends it to the login page, and SAT checks that page.

**Fix.** Open the route in your browser, logged in, and ask the agent to use `sat_issues` and `sat_recheck`, which read the page as you see it.

### "The page at … did not load within 15 seconds" or "answered HTTP 404"

**Why.** The route doesn't exist on the dev server, or the first load is slow while Vite optimizes the dependencies.

**Fix.** Check the path; call `sat_check` again after the first load. For content that comes later (data from an API), pass `waitFor` with a selector of that content.

### "sat_check opens only the pages of this dev server"

**Why.** The `url` points to another host or port. `sat_check` is not a proxy: it opens only the dev server's own origin.

**Fix.** Pass a path (`/cart`) or the address Vite prints. To check a deployed site, use [`sat-check`](../../README.md#cli-and-ci).

### "No page has sent SAT results yet" or "No page of the app is open in the browser"

**Why.** The agent sees only the pages open in the browser during this run of `vite dev`. Results stay in memory: a restart of the dev server forgets them.

**Fix.** Let the agent call `sat_check` with the route instead (with Playwright installed), or open the page in the browser and keep it open; then ask the agent again, or let it call `sat_recheck`, which turns SAT on in the page if it was off.

### "No open page answered within 10 seconds"

**Why.** The page didn't send new results: it was reloading, it was opened before the dev server started, or it is in a background tab the browser has frozen.

**Fix.** Reload the page, bring its tab to the front, and call `sat_recheck` again.

### "SAT's MCP server accepts requests from this computer only, at localhost."

**Why.** The request came from another device, or with a host name other than `localhost`, `127.0.0.1` or `[::1]` (a protection against DNS rebinding), or from a web page of another origin.

**Fix.** Run the agent on the computer that runs `vite dev`, with `http://localhost:<port>/__sat/mcp` as URL. A dev server in a container or a remote machine needs a port forward to `localhost`.

### The Claude Code hook says nothing

**Why.** `sat-check hook` stays silent when `vite dev` isn't running on the port of its command, when the edited file isn't a `.tsx`, `.jsx`, `.vue`, `.svelte`, `.html` or `.css` file, when `sat_check` fails (Playwright missing, page down) and when the edit added no issues.

**Fix.** Start `vite dev` on the port in `.claude/settings.json` (`--port`, 5173 by default), then try the hook by hand: `echo '{"tool_input":{"file_path":"src/App.tsx"}}' | npx sat-check hook --port 5173 /`. If it prints nothing, call `sat_check` from the agent: its answer says what is wrong. `npx --no-install` needs SAT installed in the project.

### My agent supports only stdio servers

**Why.** SAT's server speaks MCP over HTTP (Streamable HTTP). Claude Code, Cursor, VS Code, Codex CLI, Gemini CLI, Windsurf and Zed support it.

**Fix.** Use a stdio-to-HTTP bridge if your agent has one, or **Copy fix prompt** in the panel. Open an [issue](https://github.com/flgisimone/SAT/issues) with the agent's name: a bridge in `sat-check` is possible if there is demand.

## A rule reports something that is right

SAT follows the specifications (WCAG 2.2, WAI-ARIA 1.2, HTML, Google Search Central) and should not report valid patterns; when it does, it's a bug.

1. Open the rule's page ("Why and how to fix" in the panel, or `help` in the results): it cites the source and what the rule accepts.
2. If the source says your markup is valid, [report a false positive](https://github.com/flgisimone/SAT/issues/new?template=false-positive.yml) with the HTML of the element, the message SAT prints and the part of the source that allows it.
3. Until it's fixed, lower the rule's severity or turn it off: `rules: { "<rule>": "warning" }` or `"off"`.

"Error while running SAT." in the panel, or an issue "SAT internal error in …", is a bug of SAT too: [report it](https://github.com/flgisimone/SAT/issues/new?template=bug.yml) with the page or a reduced copy of it.
