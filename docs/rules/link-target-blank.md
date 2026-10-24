# `link-target-blank`

**Category**: SEO · **Default**: warning

## What it checks

Links with `target="_blank"` have `rel="noopener noreferrer"`.

## Why

Without `noopener` the opened page gets `window.opener` (modern browsers imply it, older ones don't); `noreferrer` also keeps the referrer from external sites.

## How to fix

```html
<a href="https://example.com" target="_blank" rel="noopener noreferrer">Example</a>
```

## References

- [MDN: rel=noopener](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/noopener)

[All rules](../../README.md#rules)
