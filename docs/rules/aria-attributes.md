# `aria-attributes`

**Category**: Accessibility · **Default**: error · **WCAG**: [4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html)

**Source**: [ACT 5f99a7 ARIA attribute is defined in WAI-ARIA](https://www.w3.org/WAI/standards-guidelines/act/rules/5f99a7/) · [ACT 6a7281 ARIA state or property has valid value](https://www.w3.org/WAI/standards-guidelines/act/rules/6a7281/) · [ACT 4e8ab6 Element with role attribute has required states and properties](https://www.w3.org/WAI/standards-guidelines/act/rules/4e8ab6/proposed/) · [ACT 5c01ea ARIA state or property is permitted](https://www.w3.org/WAI/standards-guidelines/act/rules/5c01ea/proposed/) · [ACT kb1m8s ARIA global properties not used where prohibited](https://www.w3.org/WAI/standards-guidelines/act/rules/kb1m8s/proposed/) · [WAI-ARIA 1.2, states and properties](https://www.w3.org/TR/wai-aria-1.2/#states_and_properties)

## What it checks

Every `aria-*` attribute on the page:

- it exists in WAI-ARIA (`aria-labeledby`, `aria-not-checked` are typos);
- its value fits its type: `true`/`false`, one of the listed tokens, an integer or a number. Empty values, ID references and strings are not checked;
- an explicit `role` has the states it requires (`aria-checked` on `role="checkbox"`, `aria-level` on `role="heading"`, `aria-expanded` on `role="combobox"`, `aria-valuenow` on a slider or a focusable separator). A native state counts: `<input type="checkbox" role="switch">` needs no `aria-checked`;
- non-global attributes are supported by the element's role (`aria-sort` on a button is not);
- global attributes the role prohibits: `aria-label` and `aria-labelledby` on a generic `<div>`/`<span>`, a `<p>` or `role="presentation"`.

The role is the explicit one or the native one (HTML-AAM). Elements hidden from assistive technologies, and roles WAI-ARIA doesn't define (e.g. DPUB roles), skip the role checks.

## Why

Browsers ignore misspelled attributes and invalid values, so the state never reaches screen readers. A missing required state (a checkbox without `aria-checked`) leaves users without the information; a label on a `<div>` is ignored by many screen readers.

## How to fix

```html
<div role="checkbox" aria-checked="false" tabindex="0">Remember me</div>
<button aria-expanded="false">Menu</button>             <!-- not "collapsed" -->
<span role="img" aria-label="Warning">⚠️</span>          <!-- not <span aria-label> -->
```

## References

- [WAI-ARIA 1.2: characteristics of states and properties](https://www.w3.org/TR/wai-aria-1.2/#propcharacteristic_value)
- [WAI-ARIA 1.2: prohibited states and properties](https://www.w3.org/TR/wai-aria-1.2/#prohibitedattributes)

With the [axe-core engine](../../README.md#-axe-core-engine-optional) this rule is off: axe checks the same thing.

[All rules](../../README.md#rules)
