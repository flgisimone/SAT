# SAT with the Vite plugin

1. Install: `npm install`
2. Start: `npm run dev` and open the URL Vite prints.
3. What you see: the SAT dock on the page. Press play: 5 errors and 3 warnings, with boxes on the elements.
4. The app's code doesn't import SAT: `sat()` in [vite.config.js](vite.config.js) adds it to `vite dev` only.
5. The issues are listed in [../page/expected.json](../page/expected.json).
