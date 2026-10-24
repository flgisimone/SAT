# Changelog

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
