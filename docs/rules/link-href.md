# `link-href`

**Category**: Accessibility · **Default**: error · **WCAG**: [2.1.1 Keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html)

## What it checks

`href=""`, `href="#"` and `href="javascript:…"` are errors; `<a>` without `href` is a warning (it isn't focusable).

## Why

These are actions disguised as links: they don't work with the keyboard as expected, and screen readers announce a link that goes nowhere.

## How to fix

Use a `<button type="button">` for actions and a real URL for links.

## References

- [HTML: the a element](https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-a-element)

[All rules](../../README.md#rules)
