# `meta-viewport`

**Category**: Accessibility · **Default**: error · **WCAG**: [1.4.4 Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html)

**Source**: [ACT b4f0c3 Meta viewport allows for zoom](https://www.w3.org/WAI/standards-guidelines/act/rules/b4f0c3/proposed/)

## What it checks

`<meta name="viewport">` with `user-scalable=no` (or a value below 1) or `maximum-scale` below 2. Negative values are ignored by browsers and not reported. A missing viewport tag is reported by [`seo-meta`](seo-meta.md).

## Why

Users who need larger text can't zoom the page to 200%.

## How to fix

```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

## References

- [Understanding 1.4.4: Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html)

With the [axe-core engine](../../README.md#axe-core-engine-optional) this rule is off: axe checks the same thing.

[All rules](../../README.md#rules)
