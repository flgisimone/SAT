# `robots-meta`

**Category**: SEO · **Default**: warning

## What it checks

`noindex`, `nofollow` or `none` in `<meta name="robots">` or `<meta name="googlebot">`. Always a warning.

## Why

These directives are right on staging, private or duplicate pages, and a serious mistake on a public page that ships with them.

## How to fix

Check that the page should be hidden from search engines. If not, remove the directive or the tag.

## References

- [Google Search Central: robots meta tag](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)

[All rules](../../README.md#rules)
