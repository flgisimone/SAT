# `tabindex-negative`

**Category**: Accessibility · **Default**: warning · **WCAG**: [2.1.1 Keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html)

## What it checks

Visible native controls (links, buttons, fields, `summary`) with `tabindex="-1"`. On non-interactive elements (modals, skip-link targets, headings focused by code) `tabindex="-1"` is correct and not reported.

## Why

The control works with a mouse but keyboard users can't reach it.

## How to fix

Remove `tabindex="-1"`, or hide the control when it shouldn't be used (`hidden`, `inert`, `disabled`).

## References

- [Understanding SC 2.1.1](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html)

[All rules](../../README.md#rules)
