# `meta-refresh`

**Category**: Accessibility · **Default**: error · **WCAG**: [2.2.1 Timing Adjustable](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html); [3.2.5 Change on Request](https://www.w3.org/WAI/WCAG22/Understanding/change-on-request.html) with `wcagLevel: "AAA"`

**Source**: [ACT bc659a Meta element has no refresh delay](https://www.w3.org/WAI/standards-guidelines/act/rules/bc659a/proposed/) · [HTML, refresh state](https://html.spec.whatwg.org/multipage/semantics.html#attr-meta-http-equiv-refresh)

## What it checks

`<meta http-equiv="refresh">` that reloads or redirects the page after a delay between 1 second and 20 hours. Only the first valid one counts, as in browsers. A delay of 0 (an immediate redirect), invalid values and delays over 20 hours are fine.

## Why

The page changes before users have finished reading or filling it in, and they can't stop it.

## How to fix

Redirect on the server (HTTP 301/302), or with a delay of 0; let users choose when to refresh content.

```html
<meta http-equiv="refresh" content="0; url=https://example.com/new">
```

## References

- [Failure F40: time-limited meta redirect](https://www.w3.org/WAI/WCAG22/Techniques/failures/F40)
- [Failure F41: meta refresh reloading the page](https://www.w3.org/WAI/WCAG22/Techniques/failures/F41)

With the [axe-core engine](../../README.md#axe-core-engine-optional) this rule is off: axe checks the same thing.

[All rules](../../README.md#rules)
