# `heading-levels`

**Category**: Accessibility · **Default**: error · **WCAG**: [1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html)

## What it checks

Skipped heading levels going down the outline, e.g. `<h2>` followed by `<h4>`.

## Why

Heading levels express the structure of the page. A skipped level suggests a missing section to screen reader users.

## How to fix

Use the next level down, and style headings with CSS instead of choosing the level for its size.

```html
<!-- Before -->
<h2>Plans</h2><h4>Pro</h4>
<!-- After -->
<h2>Plans</h2><h3 class="small">Pro</h3>
```

## References

- [WAI tutorial: Headings](https://www.w3.org/WAI/tutorials/page-structure/headings/)

With the [axe-core engine](../../README.md#-axe-core-engine-optional) this rule is off: axe checks the same thing.

[All rules](../../README.md#rules)
