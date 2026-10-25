# `form-label`

**Category**: Accessibility · **Default**: error · **WCAG**: [1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html), [4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html)

**Source**: [ACT e086e5 Form field has non-empty accessible name](https://www.w3.org/WAI/standards-guidelines/act/rules/e086e5/proposed/) · [ACT 59796f Image button has non-empty accessible name](https://www.w3.org/WAI/standards-guidelines/act/rules/59796f/proposed/)

## What it checks

Form fields have a label: `<label for>`, a wrapping `<label>`, `aria-label`, `aria-labelledby` or `title`. A placeholder alone is not a label. Image buttons (`<input type="image">`) need an `alt` (WCAG 1.1.1). Hidden and submit inputs are ignored. Elements hidden from assistive technologies (`display: none`, `visibility: hidden`, `hidden`, `aria-hidden="true"`) are skipped.

## Why

Without a label, screen readers announce just "edit text". Placeholders disappear when typing and are often low contrast.

## How to fix

```html
<label for="email">Email</label>
<input id="email" type="email">
```

## References

- [WAI tutorial: Labeling controls](https://www.w3.org/WAI/tutorials/forms/labels/)

With the [axe-core engine](../../README.md#axe-core-engine-optional) this rule is off: axe checks the same thing.

[All rules](../../README.md#rules)
