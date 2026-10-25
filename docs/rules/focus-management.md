# `focus-management`

**Category**: Accessibility · **Default**: error · **WCAG**: [2.4.3 Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html)

**Source**: [Understanding 2.4.3 Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html) · [HTML: the tabindex attribute](https://html.spec.whatwg.org/multipage/interaction.html#the-tabindex-attribute)

## What it checks

Hidden or disabled elements that are still in the tab order are errors. Positive `tabindex` values and non-interactive elements put in the tab order without a role are warnings. `tabindex="-1"` on non-interactive elements is fine.

## Why

Keyboard users land on things they can't see, or in an order that doesn't follow the page.

## How to fix

Remove hidden elements from the tab order (`hidden`, `inert`, or `tabindex="-1"` while hidden), use `tabindex="0"` instead of positive values, and give focusable custom widgets a role.

## References

- [Understanding SC 2.4.3](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html)

With the [axe-core engine](../../README.md#axe-core-engine-optional) this rule is off: axe checks the same thing.

[All rules](../../README.md#rules)
