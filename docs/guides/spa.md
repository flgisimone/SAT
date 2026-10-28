# Single-page apps

In a single-page app the page changes without a reload: a new route, data that arrives later, a view that opens on a click. SAT checks the page as it is when it runs; this guide shows when it runs again, in the panel and in CI, and what it can't see.

## Route changes

While SAT is on, a route change runs the checks again: `history.pushState`, `history.replaceState` and back/forward (`popstate`). This covers the routers of React, Vue, Svelte, Angular and the others, which change the route through the History API.

- The boxes of the old page go away at once; the checks run 300 ms later, so the new route has time to render.
- A change of the hash alone (`#section`) is not a new route: the checks don't run again.
- Nothing to configure.

## Content that arrives later

Data loaded after the route renders (a list from an API, a lazy component) isn't in the page when the checks run. Two ways to check it:

- **The rerun button** (the arrow in the dock) runs the checks on the page as it is now.
- **`observeDom`** reruns them on their own, this many milliseconds after the DOM stops changing:

  ```ts
  sat({ observeDom: 500 }); // in vite.config, or satChecker({ observeDom: 500 }) without Vite
  ```

  Any change counts: elements added or removed, attributes, text. A page that never stops changing (a clock, a carousel) is checked when it pauses for that long, or not at all: raise the delay, or use the rerun button instead.

`observeDom` is off by default and works while SAT is on; SAT's own panel and boxes don't trigger it.

## In CI

`sat-check` opens every URL with a real navigation, waits for the `load` event and then for the network to go quiet (at most 5 seconds), and checks the page. A route rendered by the app's router is checked as a user would see it.

```bash
npx sat-check http://localhost:4173/ http://localhost:4173/products
```

- **The server must answer every route with the app** (a "history fallback"). `vite preview` and most dev servers do; for a static host, configure the fallback to `index.html`.
- SAT checks the routes you list; it doesn't follow links. More on the limits in [ci.md](ci.md).

In Playwright tests, `checkPage` and `toHaveNoSATErrors` check the page as it is when they run: wait for the content first, as for any assertion.

```ts
await page.goto("/products");
await expect(page.getByRole("list", { name: "Products" })).toBeVisible();
await expect(page).toHaveNoSATErrors();
```

## What SAT doesn't see

- **States that appear only after an interaction**: an open menu or dialog, a form with errors, hover and focus styles. Open the state, then run the checks again (the rerun button, or `observeDom`); in Playwright, open it before `checkPage`.
- **Content in `<iframe>` elements** and **in the shadow roots of web components**.

The full list is in the README, [What SAT does not do](../../README.md#what-sat-does-not-do).
