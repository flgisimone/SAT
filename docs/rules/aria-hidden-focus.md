# `aria-hidden-focus`

**Category**: Accessibility · **Default**: error · **WCAG**: [4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html)

**Source**: [ACT 6cfa84 Element with aria-hidden has no content in sequential focus navigation](https://www.w3.org/WAI/standards-guidelines/act/rules/6cfa84/proposed/) · [WAI-ARIA 1.2, aria-hidden](https://www.w3.org/TR/wai-aria-1.2/#aria-hidden)

## What it checks

Elements reachable with Tab inside `aria-hidden="true"` (or with it themselves). `aria-hidden="false"` on a descendant doesn't undo it. Elements with `tabindex="-1"`, `disabled`, inside `inert`, or not rendered are fine.

While a modal dialog is open (a `<dialog>` opened with `showModal()`, or a visible `role="dialog"` outside `aria-hidden`) the content behind it is hidden on purpose, as the WAI-ARIA dialog pattern asks, and libraries such as Radix keep the focus in the dialog with a script that SAT can't see: there the issue is a warning. Making the background `inert` removes it.

## Why

Keyboard users land on an element that screen readers don't announce: the focus seems to disappear.

## How to fix

Take the content out of the tab order while it is hidden, or don't hide it.

```html
<div aria-hidden="true" inert>…</div>
<a href="/" tabindex="-1" aria-hidden="true">Logo</a>
```

Focus sentinels that move focus away with a script (modal focus traps) are reported too: SAT can't run them. Use `inert` on the content behind the modal instead.

## References

- [Using ARIA: fourth rule](https://www.w3.org/TR/using-aria/#fourth)

With the [axe-core engine](../../README.md#axe-core-engine-optional) this rule is off: axe checks the same thing.

[All rules](../../README.md#rules)
