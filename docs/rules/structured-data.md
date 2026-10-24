# `structured-data`

**Category**: SEO · **Default**: error

**Source**: [Google Search Central: structured data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data) · [JSON-LD 1.1](https://www.w3.org/TR/json-ld11/)

## What it checks

`<script type="application/ld+json">` blocks: invalid JSON (the message has the parser's position in Chromium and Firefox) and items without `@type` (top level, array items or `@graph` items). The properties each type requires are not checked.

## Why

Search engines drop a block they can't parse, and an item without `@type` doesn't describe anything.

## How to fix

Fix the JSON (trailing commas and unquoted keys are the usual causes) and give every item a type:

```html
<script type="application/ld+json">
{ "@context": "https://schema.org", "@type": "Organization", "name": "Example" }
</script>
```

Check the required properties with Google's Rich Results Test.

## References

- [Google Search Central: structured data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [Rich Results Test](https://search.google.com/test/rich-results)

[All rules](../../README.md#rules)
