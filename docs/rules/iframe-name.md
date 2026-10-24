# `iframe-name`

**Category**: Accessibility · **Default**: error · **WCAG**: [4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html)

**Source**: [ACT cae760 Iframe element has non-empty accessible name](https://www.w3.org/WAI/standards-guidelines/act/rules/cae760/proposed/)

## What it checks

`<iframe>` elements reachable with Tab have a `title`, `aria-label` or `aria-labelledby`. The `name` attribute is not an accessible name. Frames hidden from assistive technologies, with `tabindex="-1"` or `role="presentation"` are skipped.

## Why

Screen readers announce the frame by its name: without one, users don't know what it contains before entering it.

## How to fix

```html
<iframe src="https://www.youtube.com/embed/…" title="Product demo video"></iframe>
```

## References

- [Technique H64: title on frames](https://www.w3.org/WAI/WCAG22/Techniques/html/H64)

With the [axe-core engine](../../README.md#-axe-core-engine-optional) this rule is off: axe checks the same thing.

[All rules](../../README.md#rules)
