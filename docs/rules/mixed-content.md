# `mixed-content`

**Category**: SEO · **Default**: error

## What it checks

On an `https:` page, resources loaded over `http:`. Scripts, frames, stylesheets, objects and loaded `<link>`s (icon, preload, manifest…) are errors because browsers block them; images, `srcset` candidates and media are warnings because browsers upgrade them to https or block them. Links to `http:` pages and pages served over `http:` are not reported.

## Why

Blocked resources break the page; browsers also mark the page as not fully secure.

## How to fix

Load the resource over `https:` (or a relative URL on the same host).

## References

- [W3C Mixed Content](https://www.w3.org/TR/mixed-content/)
- [MDN: Mixed content](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content)

[All rules](../../README.md#rules)
