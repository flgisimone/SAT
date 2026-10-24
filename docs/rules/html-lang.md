# `html-lang`

**Category**: Accessibility · **Default**: error · **WCAG**: [3.1.1 Language of Page](https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html)

**Source**: [ACT b5c3f8 HTML page has lang attribute](https://www.w3.org/WAI/standards-guidelines/act/rules/b5c3f8/proposed/) · [ACT bf051a HTML page lang attribute has valid language tag](https://www.w3.org/WAI/standards-guidelines/act/rules/bf051a/proposed/) · [ACT de46e4 Element with lang attribute has valid language tag](https://www.w3.org/WAI/standards-guidelines/act/rules/de46e4/proposed/)

## What it checks

`<html>` has a `lang` attribute with a valid language tag (`en`, `en-GB`, `zh-Hant`), and every other non-empty `lang` in the page is valid too (WCAG 3.1.2). `lang=""` on an element means "unknown language" and is valid.

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
