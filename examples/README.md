# Examples

Each folder is a small project that uses SAT on the same page with known issues ([page/index.html](page/index.html)); [page/expected.json](page/expected.json) lists the issues SAT reports on it.

| Folder | How SAT runs |
|---|---|
| [vite-vanilla](vite-vanilla) | Vite plugin, no import in the app; `sat-check` on the build and a CI workflow. A template: `npx degit flgisimone/SAT/examples/vite-vanilla my-site` |
| [react](react) | Vite plugin in a React app |
| [vue](vue) | Vite plugin in a Vue app |
| [cli](cli) | `sat-check` on a static page, with JSON and HTML reports |

The examples are tests too: `npm run smoke` in the repository packs SAT with `npm pack`, installs the package in a copy of each example and checks that the issues of `expected.json` are there, in the panel and in the reports of `npm run check`; in vite-vanilla, where axe-core is installed and runs in the panel, the panel shows the counts of `panelWithAxe`.
