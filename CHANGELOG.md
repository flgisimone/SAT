# Changelog

## 1.16.0 — unreleased

A new panel in the style of developer tools, in light and dark theme, that passes SAT's own rules and axe-core. The page is still never changed. No API breaks.

### Added
- Summary with error, warning, accessibility and SEO counters; each counter is a toggle button (`aria-pressed`) that filters the list and the boxes.
- Issues by category, then by rule (rules with errors first): readable title, count, WCAG criteria or source, link "Why and how to fix", and the messages visible without opening anything (five per rule, then "Show N more").
- A tag with severity and rule title when pointing at a box on the page, or clicking it; it stays inside the viewport.
- The panel can move to the right side of the window; the side is remembered in `localStorage` (`sat-side`).
- Time the checks took, in the panel header.
- `Issue.title` (readable rule name) and `Issue.source` (source of rules without a WCAG criterion, e.g. "Google"); `title` and `source` in the rule registry. axe issues get axe's rule help as `title`.

### Changed
- SVG icons instead of emoji; colors from CSS tokens, dark theme from `prefers-color-scheme`; transitions and the flash of the revealed element off with `prefers-reduced-motion`.
- The panel's checkboxes are replaced by the counters; the rule groups are no longer `<details>` to open.

## 1.15.0 — unreleased

`structured-data` checks the properties Google requires for rich results, as listed on the pages of Google's structured data gallery. A missing one is an error with its path (`Product > offers > price`) and the link to Google's page. Recommended properties are not checked. To turn the rule off, set it to `"off"` in `rules`.

### Added
- `structured-data`: required properties of `BreadcrumbList`, `Event`, `LocalBusiness` (`Restaurant`, `Store`), `Product` (with `Offer`, `AggregateOffer`, `Review`, `AggregateRating`), `Recipe`, `VideoObject` (with `Clip`), software apps, `Review` and `AggregateRating`. Google requires nothing for `Article` and `Organization`, so they are not reported. Google's own examples are part of the tests.

### Changed
- `structured-data`: nodes with the same `@id` are one node, also across blocks, so a node whose `@type` is on another node with its `@id` is no longer counted as an item without `@type`.

## 1.14.0 — unreleased

Ten new accessibility rules from WCAG 2.2 and the W3C ACT rules, on by default. The ACT rules' own test cases are part of SAT's tests (`tests/act/`): failed cases are reported, passed and inapplicable ones are not. With the axe-core engine the new rules are off, except `target-size` (axe's rule is off by default). To turn a rule off, set it to `"off"` in `rules`.

### Added
- `aria-attributes` (error, WCAG 4.1.2): unknown `aria-*` attributes, invalid values, missing required states, attributes the role doesn't support, and names on roles that prohibit them (`aria-label` on a `<div>` or `<span>`) (ACT 5f99a7, 6a7281, 4e8ab6, 5c01ea, kb1m8s).
- `aria-hidden-focus` (error, WCAG 4.1.2): elements reachable with Tab inside `aria-hidden="true"` (ACT 6cfa84).
- `target-size` (error, WCAG 2.5.8): targets under 24×24 px too close to other targets; inline links in text and browser-drawn checkboxes and radios are exceptions. In the browser only.
- `meta-viewport` (error, WCAG 1.4.4): `user-scalable=no` or `maximum-scale` below 2 (ACT b4f0c3).
- `meta-refresh` (error, WCAG 2.2.1; 3.2.5 with `wcagLevel: "AAA"`): timed refreshes and redirects (ACT bc659a).
- `iframe-name` (error, WCAG 4.1.2): frames without `title`, `aria-label` or `aria-labelledby` (ACT cae760).
- `autocomplete-valid` (error, WCAG 1.3.5): `autocomplete` values outside the HTML autofill tokens (ACT 73f2c2).
- `label-in-name` (error, WCAG 2.5.3): the visible label is not part of the accessible name (ACT 2ee8b8).
- `table-headers` (error, WCAG 1.3.1): `headers` pointing outside the table and header cells without cells (ACT a25f45, d0f69e).
- `media-autoplay` (warning, WCAG 1.4.2): `<video>`/`<audio>` that autoplay, not muted and without controls (ACT 80f0bf).
- `accessible-name` also checks the `<summary>` of a `<details>`, empty headings (WAI-ARIA requires a name for headings) and `<object>` showing an image, audio or video (ACT 2t702h, ffd0e9, 8fc3b6).

### Changed
- Accessible names follow the accessible name computation more closely: text inside `aria-hidden="true"` or not rendered no longer counts, so a button whose only content is an `aria-hidden` icon is now reported by `accessible-name`; `aria-labelledby` may point to hidden text. This also applies to `link-text`.
- `html-lang`: as in ACT, only the primary language subtag decides (`en-US-GB` is no longer reported), `lang=" "` on an element is an error, and a `lang` without text of its own is not reported.

### Fixed
- The panel's "How to fix" links are 24 px tall, so they pass `target-size`.

## 1.13.0 — unreleased

Every rule now follows an official source (WCAG 2.2 and the W3C ACT rules, WAI-ARIA 1.2, the HTML standard, Google Search Central), cited on its page in `docs/rules/`. Requirements are errors, recommendations warnings, and what the sources call valid is no longer reported. To get a previous behavior back, set the rule's severity in `rules`.

### Added
- `wcagLevel` option (`"AA"` by default, or `"AAA"`), also in the Vite plugin, Playwright and the CLI (`--wcag-level`).
- `html-lang` checks that `lang` is a valid language tag, on `<html>` and on every element (ACT bf051a, de46e4; WCAG 3.1.2).

### Changed
- `seo-meta`: no more warnings on titles above 60 characters and descriptions above 160. Google states there is no length limit.
- `h1`: a missing `<h1>` is a warning instead of an error; several `<h1>` are no longer reported (valid HTML; Google sets no number of headings).
- `h1-visible`: warning instead of error.
- `heading-levels`: skipped levels are a warning instead of an error (WCAG technique G141 is advisory).
- `color-contrast`: the AAA warnings (WCAG 1.4.6) appear only with `wcagLevel: "AAA"`.
- `landmarks`: a missing main, several `role="main"` and several page-level `<header>`/`<footer>` are warnings (WAI-ARIA "should"); several visible `<main>` stay errors (HTML "must not").
- `link-href`: `<a>` without `href` is no longer reported (a placeholder link, valid HTML).
- `link-target-blank`: off by default, and when on it reports only `rel="opener"`, since HTML already treats `target="_blank"` as `noopener`.

## 1.12.0 — unreleased

### Added
- `seo-accessibility-tool/vite`: Vite plugin `sat(options)` that adds SAT to the pages of `vite dev` only, with the options from the config and `axe: true` for axe-core. The production build doesn't contain SAT. `vite` is an optional peer dependency.
- Browser extension in `dist/extension` (Chrome, Edge): a click on its button adds SAT to the open tab, on any site, with only the `activeTab` and `scripting` permissions.
- README: how to start SAT in Svelte and Angular apps.

### Fixed
- The panel keeps its styles on pages whose Content Security Policy blocks inline styles: they are now a constructed style sheet instead of a `<style>` element.

## 1.11.0 — unreleased

### Added
- `runSAT(options?, document?)`: the same checks as `seoAccessibilityTool`, returning `{ issues, summary }` without DOM nodes, ready for `JSON.stringify`.
- `seo-accessibility-tool/playwright`: `checkPage(page, options)` and `expect(page).toHaveNoSATErrors()` for end-to-end tests. The page doesn't need to import SAT; `axe: true` runs axe-core too. `@playwright/test` is an optional peer dependency.
- `sat-check` command: checks URLs in Chromium, prints the issues, writes JSON (`--json`) and HTML (`--html`) reports and exits with 1 above `--max-errors` (default 0) or `--max-warnings`. Options from a JSON file (`--config`), axe-core with `--axe`.
- Broken links in the CLI: `--depth` follows same-origin links (logout-like URLs excluded, at most `--max-pages`), checks those pages and reports as `link-broken` the links whose page answers 4xx/5xx, fails to load or shows the `--not-found` text, so client-side 404s of single-page apps are found.

## 1.10.0 — unreleased

### Added
- SEO rules for indexing and sharing: `canonical`, `robots-meta`, `social-meta` (Open Graph and Twitter card) and `hreflang`.
- SEO rules for contents: `structured-data` (JSON-LD that doesn't parse, with the parser's position, or items without `@type`) and `mixed-content` (`http:` resources on `https:` pages).
- Loading rules: `image-size` (images without `width` and `height`) and `image-lazy-load` (`loading="lazy"` on images visible when the page opens).
- A documentation page for every rule in `docs/rules/`; each issue has its URL in `help`, and the panel links to it from every group.
- Optional axe-core engine: `seo-accessibility-tool/axe` exports `axe()`, passed as `engines: [axe()]`. axe's violations become issues named `axe/<rule>`, and the SAT rules it covers are off while it runs. `axe-core` is an optional peer dependency.
- `engines` option, and `rules` accepts the rules of an engine (`"axe/region": "off"`).

### Behavior changes
- The new rules are on by default. `canonical`, `robots-meta`, `social-meta`, `image-size` and `image-lazy-load` report warnings; turn a rule off with `rules: { "social-meta": "off" }`.
- `seo-meta` reports a second `<title>` or `<meta name="description">` as an error.

### Fixed
- `link-href`, `accessible-name` and `form-label` no longer report elements hidden from assistive technologies (`display: none`, `visibility: hidden`, `hidden`, `aria-hidden`), such as closed menus and sticky headers.

## 1.9.0 — unreleased

### Added
- New results panel in a Shadow DOM: issues grouped by rule with counts (groups start closed), filters by severity and category, and a **Structure** tab with the H1–H6 tree and skipped levels marked.
- Click an issue or a heading to scroll to the element, focus it when it can take focus, and flash its box.
- Single-page apps: while SAT is on, route changes (`pushState`, `replaceState`, back/forward) run the checks again.
- `observeDom` option (milliseconds): reruns the checks when the page's DOM stops changing. Off by default.
- Keyboard: Escape closes the panel and returns focus to the counts button.

### Behavior changes
- SAT no longer changes the page. Highlights are boxes on SAT's own layer (red for errors, orange dashed for warnings) instead of `outline`, `background-color` and `title` on the elements, so an app re-render no longer erases them. This also applies to `seoAccessibilityTool()` used without the panel.
- `heading-order` no longer colors every heading by level: the Structure tab shows the outline.
- Multiple `<h1>`: the issue now points at the second `<h1>`.
- SAT stays on across reloads instead of showing the stored messages of the last run: only an on/off flag is stored, and the checks run again.
- The dock moved to the bottom left; the counts button opens the panel.

### Deprecated
- `satReset`: there is nothing to restore anymore. It does nothing and will be removed in 2.0.

### Performance
- A run on a page of about 5,000 elements with 850 issues went from about 140 ms to about 55 ms (Chromium): no style writes between reads, and a linear CSS selector for each issue.

## 1.8.0 — unreleased

### Added
- Structured results: `seoAccessibilityTool()` returns `issues`, each with `ruleId`, `severity`, `category`, `message`, WCAG criteria and, when there is one, the `element` and a unique CSS `selector`.
- `rules` option: severity (`"error"`, `"warning"`) or `"off"` per rule, e.g. `rules: { "image-alt": "warning" }`. Rule ids are listed in the README.
- `enabled` option: `satChecker({ enabled: true })` starts SAT without a bundler; `false` never starts it.
- `seoAccessibilityTool(options, document)` checks another document (e.g. an iframe); `satReset` is exported from the main entry point.

### Changed
- The four entry points share one chunk: `dist` goes from about 200 KB to about 63 KB of JavaScript, and importing two entry points loads SAT once.
- The panel's few Italian strings ("Mostra tutto", "Nascondi", the run error) are now in English, like the rest of the UI.
- Internal errors name the rule (`SAT internal error in image-alt: …`).

### Deprecated
- The `enableCheck*` options (use `rules`) and the `errorMessages`/`warningMessages` result fields (use `issues`). They keep working in 1.x.

## 1.7.0 — unreleased

### Behavior changes
These change the number of errors and warnings you see on the same page.

- `enableCheckBrokenInternalLinks` is now **off by default**. When on, each URL is requested once (max 5 at a time) and logout/delete-like URLs are skipped.
- ARIA roles: native elements without a `role` are no longer reported. Only invalid roles (error) and redundant ones such as `<button role="button">` (warning) are.
- Headings: going back up a level (H3 → H2) is no longer an error. Skipped levels (H2 → H4) are reported once instead of twice.
- Landmarks: one `<main>` is required; at most one page-level header/footer. Headers/footers inside `article`, `aside`, `main`, `nav` or `section` are ignored. Repeated `<nav>` without a label is a warning.
- `tabindex="-1"`: only visible native controls (links, buttons, fields) are reported; the `aria-hidden` advice is gone.
- Accessible names: sections, headers, footers and forms without a heading are no longer reported. Form fields are reported once (by `enableCheckInputLabel`).
- `<a>` without `href` is now a warning; `href=""`, `#` and `javascript:` are errors.
- Results are stored in `localStorage` per page path.

### Added
- `enableCheckImageAlt`: `<img>` without `alt`, alt text that looks like a file name.
- `enableCheckHtmlLang`: `<html lang>`.
- `enableCheckSeoMeta`: `<title>`, meta description, meta viewport.
- Messages include the element (`<tag id class> "text"`) to make it easier to find.

### Fixed
- Turning SAT off restores the page's original inline styles and `title` attributes instead of erasing them.
- Contrast check no longer crashes on `oklch()` and other modern color formats; handles transparency and WCAG large-text thresholds.
- `useSatChecker` (Vue) works when called in `setup()`; the README example was wrong.
- `enableCheckH1Visible` now actually reports a hidden `<h1>`.
- `allowedLinkTexts` is matched case-insensitively.
- Form label check no longer throws on ids containing quotes.
- SAT no longer reports or highlights its own UI.
- `react` and `vue` are optional peer dependencies: React projects no longer get Vue installed, and vice versa.
- Without a bundler, SAT stays off instead of throwing on `process`.
- One failing check no longer stops the others; `console.clear()` removed.
