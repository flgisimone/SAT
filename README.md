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

## 🧩 Customization via SATOptions

You can pass custom options to enable/disable specific checks.

```ts
useSATChecker({
  enableCheckH1: true,
  enableCheckH1Visible: true,
  enableCheckAriaLabel: false,
  allowedLinkTexts: ["Read more", "Learn more"],
});
```

---

## 🧠 Available Options

| Option                                | Description                                                                 | Default |
|---------------------------------------|-----------------------------------------------------------------------------|---------|
| `enableCheckH1`                       | Detect multiple/missing H1 tags                                             | `true`  |
| `enableCheckH1Visible`                | Ensure the first H1 is rendered (not hidden)                                | `true`  |
| `enableCheckHeadingOrder`             | Highlight headings by level; warn if the first heading is not an H1         | `true`  |
| `enableCheckJumpLevels`               | Detect skipped heading levels (e.g. H2 → H4)                                | `true`  |
| `enableCheckAriaLabel`                | Buttons, links and `svg[role="img"]` need an accessible name                | `true`  |
| `enableCheckAriaRolesWithSuggestions` | Report invalid and redundant `role` attributes                              | `true`  |
| `enableCheckUniqueLandmarks`          | One `<main>`, one page-level header/footer, labelled navs when repeated     | `true`  |
| `enableCheckTextElementContrast`      | WCAG 2.1 text contrast (AA/AAA, large-text thresholds)                       | `true`  |
| `enableCheckInputLabel`               | Form fields have a label (placeholder is not enough)                        | `true`  |
| `enableCheckFocusManagement`          | Hidden focusable elements, positive tabindex, non-interactive tab stops     | `true`  |
| `enableCheckImageAlt`                 | Images have an `alt` attribute (`alt=""` for decorative ones)               | `true`  |
| `enableCheckEmptyLinks`               | Links with `href=""`, `#` or `javascript:`, and links without href          | `true`  |
| `enableCheckExternalLinksRel`         | Check for missing `rel="noopener noreferrer"` on `target="_blank"`          | `true`  |
| `enableCheckTabindexNegativeOne`      | Visible native controls removed from the tab order with `tabindex="-1"`     | `true`  |
| `enableCheckNonDescriptiveLinks`      | Warn about vague link texts                                                 | `false` |
| `allowedLinkTexts`                    | Link texts to allow anyway (case-insensitive)                               | `[]`    |
| `enableCheckBrokenInternalLinks`      | HEAD request to each internal link to find 404/500 (skips logout-like URLs) | `false` |
| `enableCheckHtmlLang`                 | `<html>` has a `lang` attribute                                             | `true`  |
| `enableCheckSeoMeta`                  | `<title>`, meta description and meta viewport                               | `true`  |

-----------------------------------|-----------------------------------------------------------|---------|
| `enableCheckH1`                   | Detect multiple/missing H1 tags                           | `true`  |
| `enableCheckH1Visible`            | Ensure first H1 is visible                                | `true`  |
| `enableCheckHeadingOrder`        | Validate heading hierarchy (H1 > H2 > H3...)              | `true`  |
| `enableCheckJumpLevels`          | Detect jumps or regressions in heading levels             | `true`  |
| `enableCheckAriaLabel`           | Validate ARIA labels on interactive elements              | `true`  |
| `enableCheckAriaRolesWithSuggestions` | Suggest improved ARIA roles                          | `true`  |
| `enableCheckUniqueLandmarks`     | Ensure unique use of landmark elements (`<main>`)         | `true`  |
| `enableCheckTextElementContrast` | Validate WCAG 2.1 text contrast                           | `true`  |
| `enableCheckInputLabel`          | Check that inputs are labeled                             | `true`  |
| `enableCheckFocusManagement`     | Validate focus order and tabindex                         | `true`  |
| `enableCheckEmptyLinks`          | Detect anchor tags with empty href or `#`                 | `true`  |
| `enableCheckExternalLinksRel`    | Check for missing `rel="noopener noreferrer"`             | `true`  |
| `enableCheckTabindexNegativeOne` | Detect invalid tabindex="-1" on focusable elements        | `true`  |
| `enableCheckNonDescriptiveLinks` | Warn about vague link texts                               | `false` |
| `enableCheckBrokenInternalLinks` | Detect internal links that return 404/500                 | `true`  |
| `allowedLinkTexts`               | Array of allowed phrases for non-descriptive link bypass  | `[]`    |

---

## 📄 License

MIT License © 2025 [Giulio Simone Floresta](https://github.com/flgisimone)

---

## 🔗 References

- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
