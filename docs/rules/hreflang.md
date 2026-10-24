# `hreflang`

**Category**: SEO · **Default**: error

**Source**: [Google Search Central: localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions)

## What it checks

`<link rel="alternate" hreflang>`: a value that isn't a language code (`en`, `en-GB`, `es-419`, `zh-Hant-TW`) or `x-default`, a relative or empty `href`, and the same language pointing to two URLs. The return links on the other language versions need requests and are not checked.

## Why

Google ignores annotations it can't read, so users may land on the wrong language version.

## How to fix

```html
<link rel="alternate" hreflang="en" href="https://example.com/en/">
<link rel="alternate" hreflang="it" href="https://example.com/it/">
<link rel="alternate" hreflang="x-default" href="https://example.com/">
```

List every version, the page itself included, on each version.

## References

- [Google Search Central: localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions)

[All rules](../../README.md#rules)
