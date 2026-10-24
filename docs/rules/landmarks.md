# `landmarks`

**Category**: Accessibility · **Default**: error · **WCAG**: [1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html)

## What it checks

Page landmarks: exactly one `<main>`, at most one page-level `<header>` and `<footer>` (those inside `article`, `aside`, `main`, `nav` or `section` don't count). When there is more than one `<nav>`, each needs `aria-label` or `aria-labelledby` (warning).

## Why

Screen reader users jump between landmarks. Duplicated or unnamed landmarks make the list ambiguous.

## How to fix

```html
<header>…</header>
<nav aria-label="Main">…</nav>
<main>…</main>
<nav aria-label="Footer">…</nav>
<footer>…</footer>
```

## References

- [WAI-ARIA APG: Landmark regions](https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/)

[All rules](../../README.md#rules)
