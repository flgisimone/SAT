# `social-meta`

**Category**: SEO · **Default**: warning

## What it checks

The four required Open Graph properties (`og:title`, `og:type`, `og:image`, `og:url`), with `og:image` and `og:url` as absolute URLs, and `<meta name="twitter:card">`. All warnings.

## Why

Social networks and chat apps build link previews from these tags. X falls back to Open Graph for title, description and image, but not for the card type.

## How to fix

```html
<meta property="og:title" content="Running shoes">
<meta property="og:type" content="website">
<meta property="og:image" content="https://example.com/og.png">
<meta property="og:url" content="https://example.com/shoes/">
<meta name="twitter:card" content="summary_large_image">
```

Turn the rule off with `rules: { "social-meta": "off" }` for pages that are never shared (admin areas).

## References

- [The Open Graph protocol](https://ogp.me/)
- [X: Cards markup](https://developer.x.com/en/docs/x-for-websites/cards/overview/markup)

[All rules](../../README.md#rules)
