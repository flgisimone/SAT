# SAT with the Vite plugin

A starting point for a project with SAT: the panel in `vite dev`, `sat-check` for the build and a GitHub Actions workflow.

```bash
npx degit flgisimone/SAT/examples/vite-vanilla my-site
cd my-site
npm install
npx playwright install chromium
```

1. `npm run dev` and open the URL Vite prints: the SAT dock is on the page. Press play: 4 errors and 3 warnings, with boxes on the elements. The page has them on purpose. `axe-core` is installed, so its rules run instead of the SAT rules they cover; SAT's own rules find 5 errors and 3 warnings, listed in [expected.json](https://github.com/flgisimone/SAT/blob/develop/examples/page/expected.json) (axe-core accepts the placeholder as the name of the email field).
2. The app's code doesn't import SAT: `sat()` in [vite.config.js](vite.config.js) adds it to `vite dev` only.
3. With `mcp: true` your AI agent gets the issues of the open page: `claude mcp add --transport http sat http://localhost:5173/__sat/mcp` for Claude Code, the other agents in [AI agents](https://github.com/flgisimone/SAT/blob/develop/docs/guides/ai-agents.md). Then ask it to fix the SAT issues.
4. `npm run build`, then `npm run preview` in one terminal and `npm run check` in another: `sat-check` checks the build with SAT's own rules, prints the 5 errors and 3 warnings, writes `sat-report.json` and `sat-report.html` and exits with 1 (more than 0 errors).
5. [sat.config.json](sat.config.json) holds the options of both the panel and `sat-check`: here it turns on `link-text`.
6. [.github/workflows/sat.yml](.github/workflows/sat.yml) runs the same steps on every push and pull request, and keeps the reports as an artifact. On the page as it is, the job fails: that's the check working. Fix the issues, or replace the page with yours.

More: [SAT in CI](https://github.com/flgisimone/SAT/blob/develop/docs/guides/ci.md), [configuration](https://github.com/flgisimone/SAT/blob/develop/docs/guides/configuration.md), [troubleshooting](https://github.com/flgisimone/SAT/blob/develop/docs/guides/troubleshooting.md).
