# `heading-order`

**Category**: Accessibility · **Default**: warning · **WCAG**: [1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html)

**Source**: [WCAG technique G141 (advisory)](https://www.w3.org/WAI/WCAG22/Techniques/general/G141) · [WCAG technique H42](https://www.w3.org/WAI/WCAG22/Techniques/html/H42)

## What it checks

The first heading of the page is an `<h1>`. Going back to a higher level later (H3 → H2) is valid. Skipped levels are reported by [`heading-levels`](heading-levels.md); the panel's **Structure** tab shows the whole outline.

## Why

Screen reader users navigate by headings: an outline that starts at `<h2>` or `<h3>` suggests that the page title is missing.

## How to fix

Start the content with the `<h1>`. Headings in the site header (logo, menu titles) that come before it can usually be other elements or lower levels.

[All rules](../../README.md#rules)
