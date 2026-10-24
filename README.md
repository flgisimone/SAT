# SEO Accessibility Tool (SAT) 🕵️‍♂️ for Developers

An accessibility and SEO validation tool focused on **heading structure best practices** and **universal accessibility compliance**.  
Detects common issues in heading usage (`<h1>`-`<h6>`), ARIA roles, contrast, labels, and more — with a visual UI panel.

---

## 🚀 Features

✅ Framework-agnostic core logic (React, Vue, Vanilla)  
✅ Validates heading structure, ARIA roles, labels, contrast, images and SEO meta tags  
✅ Injects a floating toggle button to analyze any page  
✅ Interactive error and warning panels  
✅ Persists results in `localStorage`  
✅ Restores the page's original styles when you turn SAT off  
✅ Supports progressive checks via custom options

---

## 📦 Installation

```bash
npm install seo-accessibility-tool
```

---

## ⚛️ React Integration

```tsx
import { useSATChecker } from "seo-accessibility-tool/react";

function App() {
  useSATChecker(); // Runs SAT when component mounts
  return <div>My App</div>;
}
```

---

## 🧪 Vue 3 Integration

```vue
<script setup lang="ts">
import { useSatChecker } from "seo-accessibility-tool/vue";

useSatChecker(); // Call it directly in setup: SAT starts when the component is mounted
</script>
```

---

## 🖱️ UI Behavior

- 🚀 runs the checks, 🛑 turns SAT off and restores the page's original styles, 🔃 runs them again
- Shows error/warning counts
- Expandable panels with detailed messages
- Results persist in `localStorage`, separately for each page path
- Runs only when `process.env.NODE_ENV === "development"` (set by Vite, webpack, Next, etc.)

---

## 🧩 Configuration

Turn rules off or change their severity with `rules`, as in ESLint:

```ts
useSATChecker({
  rules: {
    "color-contrast": "warning", // every issue of the rule becomes a warning
    "link-target-blank": "off",
    "link-text": "warning",      // rules that are off by default are turned on by a severity
  },
  allowedLinkTexts: ["Read more", "Learn more"],
});
```

| Option             | Description                                                                                      | Default |
|--------------------|--------------------------------------------------------------------------------------------------|---------|
| `rules`            | `{ [ruleId]: "error" \| "warning" \| "off" }`. A severity applies to every issue of that rule   | `{}`    |
| `allowedLinkTexts` | Link texts `link-text` accepts anyway (case-insensitive)                                         | `[]`    |
| `enabled`          | Controller only: `true` starts SAT without a bundler, `false` never starts it                    | starts when `NODE_ENV === "development"` |

### Rules

| Rule                | Category | Checks                                                                    | Default    | 1.x option |
|---------------------|----------|---------------------------------------------------------------------------|------------|------------|
| `h1`                | seo      | Exactly one `<h1>`                                                        | error      | `enableCheckH1` |
| `h1-visible`        | seo      | The first `<h1>` is rendered (not hidden)                                 | error      | `enableCheckH1Visible` |
| `heading-order`     | a11y     | Highlights headings by level; warns if the first heading is not an `<h1>` | warning    | `enableCheckHeadingOrder` |
| `heading-levels`    | a11y     | Skipped heading levels (e.g. H2 → H4)                                     | error      | `enableCheckJumpLevels` |
| `accessible-name`   | a11y     | Buttons, links and `svg[role="img"]` have an accessible name              | error      | `enableCheckAriaLabel` |
| `aria-roles`        | a11y     | Invalid `role` values (error), redundant roles (warning)                  | error      | `enableCheckAriaRolesWithSuggestions` |
| `landmarks`         | a11y     | One `<main>`, one page-level header/footer; labelled navs when repeated (warning) | error | `enableCheckUniqueLandmarks` |
| `color-contrast`    | a11y     | WCAG text contrast: below AA (error), below AAA (warning)                 | error      | `enableCheckTextElementContrast` |
| `form-label`        | a11y     | Form fields have a label (placeholder is not enough)                      | error      | `enableCheckInputLabel` |
| `focus-management`  | a11y     | Hidden focusable elements (error), positive tabindex and non-interactive tab stops (warning) | error | `enableCheckFocusManagement` |
| `image-alt`         | a11y     | `<img>` without `alt` (error), alt text that looks like a file name (warning) | error  | `enableCheckImageAlt` |
| `link-href`         | a11y     | `href=""`, `#` or `javascript:` (error), `<a>` without href (warning)     | error      | `enableCheckEmptyLinks` |
| `link-target-blank` | seo      | `target="_blank"` without `rel="noopener noreferrer"`                     | warning    | `enableCheckExternalLinksRel` |
| `tabindex-negative` | a11y     | Visible native controls removed from the tab order with `tabindex="-1"`   | warning    | `enableCheckTabindexNegativeOne` |
| `link-text`         | a11y     | Vague link texts ("click here", "more")                                    | off        | `enableCheckNonDescriptiveLinks` |
| `html-lang`         | a11y     | `<html>` has a `lang` attribute                                           | error      | `enableCheckHtmlLang` |
| `seo-meta`          | seo      | `<title>` and meta description (error), lengths and meta viewport (warning) | error    | `enableCheckSeoMeta` |
| `link-broken`       | seo      | HEAD request to each internal link to find 4xx/5xx (skips logout-like URLs) | off      | `enableCheckBrokenInternalLinks` |

The 1.x options `enableCheck*` still work (`true` turns the rule on, `false` off) but are deprecated; `rules` takes precedence.

---

## 🔎 Results without the panel

```ts
import { seoAccessibilityTool, satReset } from "seo-accessibility-tool";

const { issues, errors, warnings } = await seoAccessibilityTool({ rules: { "link-text": "warning" } });
// issues: [{ ruleId, severity, category, message, wcag?, element?, selector? }]
satReset(); // removes the highlights
```

`selector` matches only the element of the issue. `errorMessages` and `warningMessages` (lists of strings) are still returned but deprecated.

---

## 🛠️ Development

```bash
npm install
npm run verify       # type check, lint, unit tests, build
npm run verify:e2e   # build + browser tests (Chromium)
```

- Conventions: [CONVENTIONS.md](CONVENTIONS.md); agent rules: [AGENTS.md](AGENTS.md)
- Roadmap and backlog by phase: [plan/README.md](plan/README.md)
- Changes: [CHANGELOG.md](CHANGELOG.md)

---

## 📄 License

MIT License © 2025 [Giulio Simone Floresta](https://github.com/flgisimone)

---

## 🔗 References

- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
