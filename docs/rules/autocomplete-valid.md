# `autocomplete-valid`

**Category**: Accessibility · **Default**: error · **WCAG**: [1.3.5 Identify Input Purpose](https://www.w3.org/WAI/WCAG22/Understanding/identify-input-purpose.html)

**Source**: [ACT 73f2c2 autocomplete attribute has valid value](https://www.w3.org/WAI/standards-guidelines/act/rules/73f2c2/proposed/) · [HTML, autofill detail tokens](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofilling-form-controls:-the-autocomplete-attribute)

## What it checks

The `autocomplete` value of `<input>`, `<select>` and `<textarea>` follows the HTML grammar: `on`, `off`, or `[section-*] [shipping|billing] [home|work|mobile|fax|pager] field [webauthn]` in this order, where the contact type (`work`…) goes only before `tel`, `email` and `impp`. Case doesn't matter. Empty values, disabled fields, hidden fields and buttons are skipped.

## Why

Browsers and assistive technologies use the value to fill in personal data and to show familiar icons; an invalid token is ignored.

## How to fix

```html
<input autocomplete="email">                <!-- not "mail" -->
<input autocomplete="shipping postal-code">
<input autocomplete="work tel">             <!-- not "tel work" -->
```

## References

- [WCAG 2.2: input purposes for user interface components](https://www.w3.org/TR/WCAG22/#input-purposes)

With the [axe-core engine](../../README.md#axe-core-engine-optional) this rule is off: axe checks the same thing.

[All rules](../../README.md#rules)
