# SAT with Vue

1. Install: `npm install`
2. Start: `npm run dev` and open the URL Vite prints.
3. What you see: the SAT dock on the page. Press play: 5 errors and 3 warnings, with boxes on the elements.
4. SAT starts from the Vite plugin in [vite.config.js](vite.config.js), in `vite dev` only: the app's code doesn't import it.
5. The issues are listed in [../page/expected.json](../page/expected.json).
