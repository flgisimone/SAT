# `canonical`

**Category**: SEO · **Default**: warning

## What it checks

`<link rel="canonical">`: more than one, or an empty `href`, is an error; a missing or relative canonical is a warning. A canonical on another host is valid (in development the page runs on localhost) and is not reported.

## Why

The canonical tells search engines which URL to index when the same content is reachable from several (parameters, trailing slash, http/https). With two canonicals they ignore both.

## How to fix

One canonical per page, with the absolute URL:

```html
<link rel="canonical" href="https://example.com/shoes/">
```

## References

- [Google Search Central: canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)

[All rules](../../README.md#rules)
