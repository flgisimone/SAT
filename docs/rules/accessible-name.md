# `accessible-name`

**Category**: Accessibility · **Default**: error · **WCAG**: [4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html), [1.1.1 Non-text Content](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html)

**Source**: [ACT 97a4e1 Button has non-empty accessible name](https://www.w3.org/WAI/standards-guidelines/act/rules/97a4e1/proposed/) · [ACT c487ae Link has non-empty accessible name](https://www.w3.org/WAI/standards-guidelines/act/rules/c487ae/proposed/) · [ACT 7d6734 SVG element with explicit role has non-empty accessible name](https://www.w3.org/WAI/standards-guidelines/act/rules/7d6734/proposed/) · [ACT m6b1q3 Menuitem has non-empty accessible name](https://www.w3.org/WAI/standards-guidelines/act/rules/m6b1q3/) · [ACT 2t702h Summary element has non-empty accessible name](https://www.w3.org/WAI/standards-guidelines/act/rules/2t702h/proposed/) · [ACT ffd0e9 Heading has non-empty accessible name](https://www.w3.org/WAI/standards-guidelines/act/rules/ffd0e9/proposed/) · [ACT 8fc3b6 Object element rendering non-text content has non-empty accessible name](https://www.w3.org/WAI/standards-guidelines/act/rules/8fc3b6/proposed/)

## What it checks

Buttons, links, menu items, tabs and the `<summary>` of a `<details>` have an accessible name: visible text, `aria-label`, `aria-labelledby`, `title` or a labelled image or icon inside. Text inside `aria-hidden="true"` doesn't count; text of a hidden element pointed to by `aria-labelledby` does.

Headings (`<h1>`–`<h6>`, `role="heading"`) are not empty: WAI-ARIA requires a name for the heading role, so an empty heading is an error with no WCAG criterion attached.

`<svg role="img">` needs a `<title>`, `aria-label` or `aria-labelledby`, and an `<object>` showing an image, audio or video a `title`, `aria-label` or `aria-labelledby` (WCAG 1.1.1); the fallback content of `<object>` is not used when the file loads. Form fields are covered by [`form-label`](form-label.md). Elements hidden from assistive technologies (`display: none`, `visibility: hidden`, `hidden`, `aria-hidden="true"`) are skipped.

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

With the [axe-core engine](../../README.md#axe-core-engine-optional) this rule is off: axe checks the same thing.

[All rules](../../README.md#rules)
