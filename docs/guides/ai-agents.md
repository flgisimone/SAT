# SAT with your AI agent

SAT finds accessibility and SEO issues on the page in `vite dev`; your coding agent fixes them in the source. This guide connects the two through SAT's MCP server, which works with any agent that speaks [MCP](https://modelcontextprotocol.io) over HTTP, and shows the other two ways: **Fix with AI** with Claude Code, and **Copy fix prompt**.

| Way | Agents | Needs |
|---|---|---|
| [MCP server](#the-mcp-server) | Claude Code, Cursor, VS Code (Copilot), Codex CLI, Gemini CLI, Windsurf, Zed | Vite plugin with `mcp: true` |
| [Fix with AI](#fix-with-ai) | Claude Code, from a button in the panel | Vite plugin with `ai: true` |
| [Copy fix prompt](#copy-fix-prompt) | Any, by pasting | Nothing: every integration |

## The MCP server

### 1. Turn it on

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { sat } from "seo-accessibility-tool/vite";

export default defineConfig({
  plugins: [sat({ mcp: true })],
  server: { strictPort: true },
});
```

`npm run dev` prints the endpoint and the command for Claude Code:

```text
  SAT: MCP server at http://localhost:5173/__sat/mcp
  SAT: for Claude Code, claude mcp add --transport http sat http://localhost:5173/__sat/mcp
```

`strictPort` keeps the port, and so the URL, the same: without it Vite moves to the next free port when 5173 is taken, and the agent's configuration no longer matches.

### 2. Add it to your agent

Use the URL Vite prints. The configuration goes in the project (shared with the team through git) or in your user settings.

| Agent | Command or file |
|---|---|
| Claude Code | `claude mcp add --transport http sat http://localhost:5173/__sat/mcp` (add `--scope project` to write `.mcp.json`) |
| Cursor | `.cursor/mcp.json` or `~/.cursor/mcp.json` |
| VS Code (Copilot) | `.vscode/mcp.json`, or **MCP: Add Server** → HTTP |
| Codex CLI | `codex mcp add sat --url http://localhost:5173/__sat/mcp`, or `~/.codex/config.toml` (`.codex/config.toml` in trusted projects) |
| Gemini CLI | `gemini mcp add --transport http sat http://localhost:5173/__sat/mcp` (writes `.gemini/settings.json`) |
| Windsurf | `~/.codeium/windsurf/mcp_config.json`, then **Refresh** in Manage MCPs |
| Zed | `settings.json`, or **Settings → AI → MCP Servers → Add Remote Server** |

The files:

```json
// Claude Code: .mcp.json ("type" is required: without it the entry is read as a stdio server)
{ "mcpServers": { "sat": { "type": "http", "url": "http://localhost:5173/__sat/mcp" } } }
```

```json
// Cursor: .cursor/mcp.json
{ "mcpServers": { "sat": { "url": "http://localhost:5173/__sat/mcp" } } }
```

```json
// VS Code: .vscode/mcp.json (the key is "servers")
{ "servers": { "sat": { "type": "http", "url": "http://localhost:5173/__sat/mcp" } } }
```

```toml
# Codex CLI: ~/.codex/config.toml
[mcp_servers.sat]
url = "http://localhost:5173/__sat/mcp"
```

```json
// Gemini CLI: .gemini/settings.json ("httpUrl"; "url" would be the old SSE transport)
{ "mcpServers": { "sat": { "httpUrl": "http://localhost:5173/__sat/mcp" } } }
```

```json
// Windsurf: ~/.codeium/windsurf/mcp_config.json ("serverUrl")
{ "mcpServers": { "sat": { "serverUrl": "http://localhost:5173/__sat/mcp" } } }
```

```json
// Zed: settings.json
{ "context_servers": { "sat": { "url": "http://localhost:5173/__sat/mcp" } } }
```

These follow each agent's documentation as of October 2026; the server was tried with Claude Code 2.1 and with the client of the official MCP TypeScript SDK (1.32), the one Gemini CLI uses. If an agent's format has changed, its documentation wins: SAT's server is a plain Streamable HTTP endpoint without authentication.

### 3. Ask

Open the app in the browser and keep the page open, then ask the agent, for example:

- *"Fix the SAT issues on this page."*
- *"Use sat_issues for /checkout and fix the accessibility errors, then check again."*
- *"Fix the image-alt issues SAT reports, one component at a time."*

### The tools

| Tool | Arguments | Returns |
|---|---|---|
| `sat_issues` | `url` (optional): an address or a path, e.g. `/cart` | The last results of each open page |
| `sat_recheck` | `url` (optional) | The pages check again; the results that come back |

For each page the agent gets:

- a text with the page's title, URL, the counts and a prompt to fix all the issues, the same as **Copy prompt for all**: each rule with its severity, WCAG criterion or source and documentation link; each issue with its message, selector, the element's HTML (up to about 2 KB) and, with Vue and Svelte in development, the component file. The prompt asks for the smallest fix in the source and declares the quoted page as data, not instructions;
- the same issues as a list (`structuredContent`): `ruleId`, `severity`, `title`, `message`, `selector`, `component`, `help`.

`sat_recheck` waits a second, so Vite can apply the files the agent just edited, then asks the open pages to run the checks again and waits for their results, up to 10 seconds. If SAT was off in a page, it turns it on.

### What the agent sees, and what it doesn't

- Only the pages open in the browser during this run of `vite dev`, each with the results of its last run. They stay in the dev server's memory: nothing is written to disk, and a restart forgets them.
- A single-page app sends new results at each route change; the results of the routes visited before stay until the dev server restarts.
- The page as it is: open menus, dialogs and other states need to be on the screen when SAT runs (see [Single-page apps](spa.md)).

### What goes to the model

SAT sends nothing anywhere. The MCP server is off until you set `mcp: true`; then the agent that calls it gets the issues and the quoted HTML of the elements, and sends them to its model, as it does with the files it reads. The agent uses your account, model and permissions: SAT handles no API keys.

### Safety

- The endpoint answers only connections from this computer, with a `localhost`, `127.0.0.1` or `[::1]` host name and the dev server's port. A web page that renames its domain to `127.0.0.1` (DNS rebinding) gets a 403; so does a request with an `Origin` other than the dev server's.
- It has no token, because the agent's configuration is a fixed URL. Any program on your computer can read the issues, as it can read the project's files.
- It only reads results and asks the pages to check again: it changes no files and runs no commands. The agent edits the code with its own tools, under the permissions you gave it.
- `vite build` and `vite preview` contain neither the endpoint nor SAT.

More in [SECURITY.md](../../SECURITY.md).

### Protocol

SAT implements the MCP specification [2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28) (stateless requests, `server/discover`) and the earlier versions with the `initialize` handshake (2025-03-26 to 2025-11-25), which most clients still use. Responses are JSON, never SSE; no sessions, no notifications to the client. Clients that speak only stdio need a bridge: see [Troubleshooting](troubleshooting.md#my-agent-supports-only-stdio-servers).

## Fix with AI

With `sat({ ai: true })` every issue in the panel gets a **Fix with AI** button that runs Claude Code (`claude -p`) in the project with `Read`, `Edit`, `Grep` and `Glob` only, shows its progress and the files it changed, then checks the page again: **Fixed** or **Still present**. It needs Claude Code installed and signed in. `ai` and `mcp` can be on together. Details in the [README](../../README.md#fix-with-ai-claude-code-one-click).

## Copy fix prompt

Everywhere, with every integration: **Copy fix prompt** on an issue, or **Copy prompt for all** on a rule, copies the prompt the MCP server gives to the agents. Paste it into any chat or agent. From code, `fixPrompt(issues, { url })` returns the same text.

## Problems

[Troubleshooting](troubleshooting.md#the-agent-doesnt-see-sat-mcp-server): the agent can't connect, the port changed, no page has sent results, a client with stdio only.
