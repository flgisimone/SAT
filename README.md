# SEO Accessibility Tool (SAT) 🕵️‍♂️ for Developers

An accessibility and SEO validation tool focused on **heading structure best practices** and **universal accessibility compliance**.  
Detects common issues in heading usage (`<h1>`-`<h6>`), ARIA roles, contrast, labels, and more — with a visual UI panel.

---

## 🚀 Features

✅ Framework-agnostic core logic (React, Vue, Vanilla)  
✅ Validates heading structure and ARIA roles  
✅ Injects a floating toggle button to analyze any page  
✅ Interactive error and warning panels  
✅ Persists results in `localStorage`  
✅ No more console logs — clean, accessible UI  
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

```ts
import { useSatChecker } from "seo-accessibility-tool/vue";
import { onMounted } from "vue";

onMounted(() => {
  useSatChecker(); // Activates SAT
});
```

---

## 🖱️ UI Behavior

- Toggle button to activate/deactivate
- Shows error/warning counts
- Expandable panels with detailed messages
- Results persist in `localStorage`
- Works without any console output

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

| Option                             | Description                                               | Default |
|-----------------------------------|-----------------------------------------------------------|---------|
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
