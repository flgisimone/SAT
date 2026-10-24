# `label-in-name`

**Category**: Accessibility · **Default**: error · **WCAG**: [2.5.3 Label in Name](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html)

**Source**: [ACT 2ee8b8 Visible label is part of accessible name](https://www.w3.org/WAI/standards-guidelines/act/rules/2ee8b8/proposed/)

## What it checks

Buttons, links, tabs, menu items, options and other widgets named from their content that also have `aria-label` or `aria-labelledby`: the words of the visible text must appear in the accessible name, in the same order. Case, punctuation, symbols and text in parentheses don't count. A single letter used as a symbol (`X` for close) and icon-font ligatures are not compared.

## Why

Speech-input users say what they see ("click Send"): if the name is different, the command doesn't work.

## How to fix

Start the `aria-label` with the visible text, or remove it.

```html
<button aria-label="Send message">Send</button>  <!-- passes -->
<button aria-label="Submit form">Send</button>   <!-- error -->
```

## References

- [Technique G208: visible label text in the accessible name](https://www.w3.org/WAI/WCAG22/Techniques/general/G208)

With the [axe-core engine](../../README.md#-axe-core-engine-optional) this rule is off: axe checks the same thing.

[All rules](../../README.md#rules)
