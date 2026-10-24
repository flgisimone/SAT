# `seo-meta`

**Category**: SEO · **Default**: error

## What it checks

`<title>` and `<meta name="description">` are present, not empty and only one each (errors). A title above 60 characters, a description above 160 and a missing `<meta name="viewport">` are warnings. `<title>` inside SVG is not counted.

## Why

The title and the description are what search results show. HTML allows one of each per document. Without a viewport, mobile browsers render the desktop layout zoomed out.

## How to fix

```html
<title>Running shoes | Shop</title>
<meta name="description" content="Trail and road running shoes, free returns.">
<meta name="viewport" content="width=device-width, initial-scale=1">
```

## References

- [Google Search Central: title links](https://developers.google.com/search/docs/appearance/title-link)
- [Google Search Central: snippets](https://developers.google.com/search/docs/appearance/snippet)

[All rules](../../README.md#rules)
