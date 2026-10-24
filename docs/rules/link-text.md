# `link-text`

**Category**: Accessibility · **Default**: off (warning when on) · **WCAG**: [2.4.4 Link Purpose (In Context)](https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html)

## What it checks

Vague link texts such as "click here" or "more". Texts listed in the `allowedLinkTexts` option are accepted. Links without any name are reported by [`accessible-name`](accessible-name.md).

## Why

Screen reader users often list the links of a page: "more" repeated ten times says nothing. Search engines use the link text to understand the target.

## How to fix

Describe the destination: `<a href="/pricing">See the pricing</a>`. Turn the rule on with `rules: { "link-text": "warning" }`.

## References

- [Understanding SC 2.4.4](https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html)

[All rules](../../README.md#rules)
