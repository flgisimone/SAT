# `link-target-blank`

**Category**: SEO · **Default**: off (warning when on)

**Source**: [HTML: link type "opener" and "get an element's noopener"](https://html.spec.whatwg.org/multipage/links.html#link-type-opener)

## What it checks

Links with `target="_blank"` and `rel="opener"`. Without `rel="opener"`, HTML already treats `target="_blank"` as `noopener`, so `rel="noopener"` is not needed and is not checked; `noreferrer` is a privacy choice, not a requirement.

## Why

With `rel="opener"` the opened page gets `window.opener` and can navigate this page elsewhere (tabnabbing).

## How to fix

Remove `opener` from `rel`. `target="_blank"` alone is already safe.

```html
<a href="https://example.com" target="_blank">Example</a>
```

To turn the rule on: `rules: { 'link-target-blank': 'warning' }`.

## References

- [HTML: get an element's noopener](https://html.spec.whatwg.org/multipage/links.html#get-an-element's-noopener)

[All rules](../../README.md#rules)
