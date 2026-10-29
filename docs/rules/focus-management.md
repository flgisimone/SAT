# `focus-management`

**Category**: Accessibility · **Default**: warning · **WCAG**: [2.4.3 Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html)

**Source**: [Understanding 2.4.3 Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html) · [HTML: the tabindex attribute](https://html.spec.whatwg.org/multipage/interaction.html#the-tabindex-attribute)

## What it checks

Three warnings:

- an invisible element (transparent, or without a box) put in the tab order with `tabindex`: the focus lands on something nobody sees. Focus guards of dialog libraries, which move the focus on with a script, look the same and are reported too;
- positive `tabindex` values;
- non-interactive elements put in the tab order without a role. Scroll containers (`overflow: auto` or `scroll`) are fine: `tabindex="0"` lets keyboard users scroll them.

Elements that are not rendered (`display: none`, `hidden`, `visibility: hidden`), disabled or inside `inert` can't take focus, whatever their `tabindex`, and are not reported. `tabindex="-1"` on non-interactive elements is fine.

## Why

Keyboard users land on things they can't see, or in an order that doesn't follow the page.

## How to fix

Take invisible elements out of the tab order (`tabindex="-1"`), or show them when they have focus, use `tabindex="0"` instead of positive values, and give focusable custom widgets a role.

## References

- [Understanding SC 2.4.3](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html)

With the [axe-core engine](../../README.md#axe-core-engine-optional) this rule is off: axe checks the same thing.

[All rules](../../README.md#rules)
