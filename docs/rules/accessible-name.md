# `accessible-name`

**Category**: Accessibility · **Default**: error · **WCAG**: [4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html), [1.1.1 Non-text Content](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html)

## What it checks

Buttons and links have an accessible name: text, `aria-label`, `aria-labelledby`, `title` or a labelled image or icon inside. `<svg role="img">` needs a `<title>`, `aria-label` or `aria-labelledby` (WCAG 1.1.1). Form fields are covered by [`form-label`](form-label.md).

## Why

Without a name, a screen reader announces just "button" or "link", and voice control users can't say what to click.

## How to fix

Add visible text, or an `aria-label` for icon-only controls.

```html
<button aria-label="Close"><svg aria-hidden="true">…</svg></button>
<a href="/"><img src="logo.svg" alt="Home"></a>
```

## References

- [WAI-ARIA APG: Providing accessible names](https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/)

[All rules](../../README.md#rules)
