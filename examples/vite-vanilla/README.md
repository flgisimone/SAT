# SAT with the Vite plugin

A starting point for a project with SAT: the panel in `vite dev`, `sat-check` for the build and a GitHub Actions workflow.

```bash
npx degit flgisimone/SAT/examples/vite-vanilla my-site
cd my-site
npm install
npx playwright install chromium
```

1. `npm run dev` and open the URL Vite prints: the SAT dock is on the page. Press play: 5 errors and 3 warnings, with boxes on the elements. The page has them on purpose; they are listed in [expected.json](https://github.com/flgisimone/SAT/blob/develop/examples/page/expected.json).
2. The app's code doesn't import SAT: `sat()` in [vite.config.js](vite.config.js) adds it to `vite dev` only.
3. `npm run build`, then `npm run preview` in one terminal and `npm run check` in another: `sat-check` checks the build, prints the same issues, writes `sat-report.json` and `sat-report.html` and exits with 1 (more than 0 errors).
4. [sat.config.json](sat.config.json) holds the options of both the panel and `sat-check`: here it turns on `link-text`.
5. [.github/workflows/sat.yml](.github/workflows/sat.yml) runs the same steps on every push and pull request, and keeps the reports as an artifact. On the page as it is, the job fails: that's the check working. Fix the issues, or replace the page with yours.

More: [SAT in CI](https://github.com/flgisimone/SAT/blob/develop/docs/guides/ci.md), [configuration](https://github.com/flgisimone/SAT/blob/develop/docs/guides/configuration.md), [troubleshooting](https://github.com/flgisimone/SAT/blob/develop/docs/guides/troubleshooting.md).
