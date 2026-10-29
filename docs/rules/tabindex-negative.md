# `tabindex-negative`

**Category**: Accessibility · **Default**: warning · **WCAG**: [2.1.1 Keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html)

**Source**: [HTML: the tabindex attribute](https://html.spec.whatwg.org/multipage/interaction.html#the-tabindex-attribute) · [Understanding 2.1.1 Keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html)

## What it checks

Visible native controls (links, buttons, fields, `summary`) with `tabindex="-1"`. On non-interactive elements (modals, skip-link targets, headings focused by code) `tabindex="-1"` is correct and not reported. So are the items of a tab list, radio group, menu, listbox, tree, grid or toolbar that the keyboard reaches through another item of the same widget: the roving tabindex of the [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_roving_tabindex), used by Radix, shadcn/ui and most component libraries.

## Why

The control works with a mouse but keyboard users can't reach it.

## How to fix

Remove `tabindex="-1"`, or hide the control when it shouldn't be used (`hidden`, `inert`, `disabled`).

## References

- [Understanding SC 2.1.1](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html)

[All rules](../../README.md#rules)
