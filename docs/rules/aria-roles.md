# `aria-roles`

**Category**: Accessibility · **Default**: error · **WCAG**: [4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html)

**Source**: [ACT 674b10 Role attribute has valid value](https://www.w3.org/WAI/standards-guidelines/act/rules/674b10/proposed/) · [WAI-ARIA 1.2, role definitions](https://www.w3.org/TR/wai-aria-1.2/#role_definitions) · [ARIA in HTML](https://www.w3.org/TR/html-aria/)

## What it checks

Explicit `role` attributes. A role that doesn't exist in WAI-ARIA 1.2 (or is abstract) is an error; a role that repeats the element's native one (`<button role="button">`) is a warning. Native elements without a `role` are not reported.

## Why

Assistive technologies ignore unknown roles, so the element loses its meaning. Redundant roles are harmless but add noise and go against the first rule of ARIA.

## How to fix

Fix the typo or use a native element; remove redundant roles.

```html
<div role="buton">  <!-- error -->
<button>Save</button>  <!-- native role, no attribute needed -->
```

## References

- [WAI-ARIA 1.2: roles](https://www.w3.org/TR/wai-aria-1.2/#role_definitions)
- [Using ARIA: first rule](https://www.w3.org/TR/using-aria/#rule1)

With the [axe-core engine](../../README.md#-axe-core-engine-optional) this rule is off: axe checks the same thing.

[All rules](../../README.md#rules)
