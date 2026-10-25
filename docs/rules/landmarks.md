# `landmarks`

**Category**: Accessibility · **Default**: error · **WCAG**: [1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html)

**Source**: [HTML: the main element](https://html.spec.whatwg.org/multipage/grouping-content.html#the-main-element) · [WAI-ARIA 1.2: banner](https://www.w3.org/TR/wai-aria-1.2/#banner), [contentinfo](https://www.w3.org/TR/wai-aria-1.2/#contentinfo), [main](https://www.w3.org/TR/wai-aria-1.2/#main), [navigation](https://www.w3.org/TR/wai-aria-1.2/#navigation) · [ARIA APG: landmark regions](https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/)

## What it checks

Page landmarks. More than one visible `<main>` is an error (HTML: a document must not have more than one). Warnings, from WAI-ARIA "should": no main landmark, more than one `role="main"`, more than one page-level `<header>` or `<footer>` (those inside `article`, `aside`, `main`, `nav` or `section` don't count), and several `<nav>` without `aria-label` or `aria-labelledby`.

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

With the [axe-core engine](../../README.md#axe-core-engine-optional) this rule is off: axe checks the same thing.

[All rules](../../README.md#rules)
