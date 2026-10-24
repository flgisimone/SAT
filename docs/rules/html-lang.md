# `html-lang`

**Category**: Accessibility · **Default**: error · **WCAG**: [3.1.1 Language of Page](https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html)

## What it checks

`<html>` has a `lang` attribute.

## Why

Screen readers choose the voice and pronunciation from it; search engines and translation tools use it too.

## How to fix

```html
<html lang="en">
```

## References

- [Understanding SC 3.1.1](https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html)

With the [axe-core engine](../../README.md#-axe-core-engine-optional) this rule is off: axe checks the same thing.

[All rules](../../README.md#rules)
