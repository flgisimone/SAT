# `image-lazy-load`

**Category**: SEO · **Default**: warning

## What it checks

Images with `loading="lazy"` that are visible when the page opens: in the first viewport, at its position in the page. Images below the fold, or outside the viewport horizontally (carousels), are not reported. Checked in the browser only (it needs layout).

## Why

Lazy images wait for layout before loading, which delays the Largest Contentful Paint when the image is the hero.

## How to fix

Remove `loading="lazy"` from images in the first viewport; for the main image add `fetchpriority="high"`.

## References

- [web.dev: Lazy-loading images](https://web.dev/articles/browser-level-image-lazy-loading)

[All rules](../../README.md#rules)
