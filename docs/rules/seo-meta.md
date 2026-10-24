# `seo-meta`

**Category**: SEO · **Default**: error

**Source**: [Google Search Central: title links](https://developers.google.com/search/docs/appearance/title-link) · [snippets and meta description](https://developers.google.com/search/docs/appearance/snippet) · [HTML: the title element](https://html.spec.whatwg.org/multipage/semantics.html#the-title-element) · [mobile-first indexing](https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing)

## What it checks

`<title>` and `<meta name="description">` are present, not empty and only one each (errors). A missing `<meta name="viewport">` is a warning. `<title>` inside SVG is not counted. There are no length limits: Google states there is none for either and shortens them to fit the device.

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
