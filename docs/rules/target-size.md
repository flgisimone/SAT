# `target-size`

**Category**: Accessibility · **Default**: error · **WCAG**: [2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) (AA, new in WCAG 2.2)

**Source**: [WCAG 2.2, 2.5.8 Target Size (Minimum)](https://www.w3.org/TR/WCAG22/#target-size-minimum) · [Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

## What it checks

Links, buttons, form controls and widgets with a role smaller than 24 × 24 CSS pixels. A smaller target passes when a 24 px circle centred on it doesn't touch another target or the circle of another small target (spacing exception). Not reported: inline links in a line of text, checkboxes and radios drawn by the browser, disabled and invisible controls. Checked in the browser only (it needs layout).

## Why

Small targets close together are hard to hit for people with tremors, on touch screens, or with a mouse they can't control precisely.

## How to fix

Make the target at least 24 × 24 px (padding counts), or leave space around it.

```css
.icon-button { min-width: 24px; min-height: 24px; }
.toolbar { gap: 4px; } /* 20 px buttons 4 px apart pass */
```

The exception for an equivalent control elsewhere on the page can't be detected: turn the rule off for that page if it applies.

## References

- [Understanding 2.5.8: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

axe-core has a `target-size` rule too, off by default, so this rule stays on with the [axe-core engine](../../README.md#axe-core-engine-optional).

[All rules](../../README.md#rules)
