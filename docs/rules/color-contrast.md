# `color-contrast`

**Category**: Accessibility · **Default**: error · **WCAG**: [1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [1.4.6 Contrast (Enhanced)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html)

## What it checks

Text contrast against its background. Below AA (4.5:1, or 3:1 for large text) is an error; below AAA (7:1, or 4.5:1) is a warning (WCAG 1.4.6). Semi-transparent colors are blended. Text over background images and hidden text are skipped, since the background can't be known.

## Why

Low-contrast text is hard to read for people with low vision, and for everyone in bright light.

## How to fix

Darken the text or lighten the background until the ratio in the message reaches 4.5:1. A contrast checker in the browser's DevTools suggests the nearest passing color.

## References

- [Understanding SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)

With the [axe-core engine](../../README.md#-axe-core-engine-optional) this rule is off: axe checks the same thing.

[All rules](../../README.md#rules)
