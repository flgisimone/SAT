# Security

## Reporting a problem

Report security issues privately through [GitHub's security advisories](https://github.com/flgisimone/SAT/security/advisories/new), not in a public issue. Include the SAT version, how you run it and the steps to reproduce. The fix is published with a security advisory that credits you, unless you prefer otherwise.

## Supported versions

Fixes go into the latest minor version on npm.

## Where to look

SAT is a development tool: it runs in the developer's browser and dev server, and sends nothing anywhere. The parts most worth testing are:

- **Fix with AI** (Vite plugin with `ai: true`): the dev server endpoint `POST /__sat/fix` runs Claude Code in the project. It must answer only connections from the same computer, from the dev server's own pages (`Origin`) and with the token created at each start of the dev server; Claude Code must get only the tools `Read`, `Edit`, `Grep` and `Glob`; `vite build` and `vite preview` must contain neither the endpoint nor the token. A way around any of these, or a page content that makes the agent act outside the fix (prompt injection), is a security issue.
- **The MCP server** (Vite plugin with `mcp: true`): `POST /__sat/mcp` gives the issues of the open pages, with quoted HTML, to the agent that calls it. It must answer only connections from the same computer, with a `Host` of `localhost`, `127.0.0.1` or `[::1]` and the dev server's port (against DNS rebinding) and, when there is an `Origin`, the dev server's. It has no token, because an agent's configuration is a fixed URL: any process on the computer can read the issues, as it could read the project's files. The pages send their results to `POST /__sat/results`, protected as `/__sat/fix` (same computer, `Origin`, token); neither endpoint changes files or runs commands. A way around these checks from a web page or another device is a security issue.
- **The browser extension**: it must read a tab only after its button is clicked there (`activeTab`).
- **`sat-check --depth`**: it must stay on the origin of the given URLs and never open logout, delete and similar URLs.
