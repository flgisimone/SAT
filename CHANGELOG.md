# Changelog

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
