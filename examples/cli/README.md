# SAT from the command line

1. Install: `npm install && npx playwright install chromium`
2. Run: `npm run check` (it checks [index.html](index.html); on Windows run `npx sat-check file:///C:/path/to/index.html --config sat.config.json`).
3. What you see: 5 errors and 3 warnings in the console, exit code 1 (more than 0 errors).
4. Reports: `sat-report.json` and `sat-report.html`; [sat.config.json](sat.config.json) turns on `link-text`.
5. The issues are listed in [../page/expected.json](../page/expected.json).
