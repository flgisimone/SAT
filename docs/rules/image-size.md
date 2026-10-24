# `image-size`

**Category**: SEO · **Default**: warning

## What it checks

Visible `<img>` without `width` and `height` attributes. Not reported: absolutely or fixed positioned images, images with a CSS `aspect-ratio`, and images with an inline width and height in fixed units. Sizes set by a stylesheet class can't be told apart, hence a warning.

## Why

The browser can't reserve the space before the image loads, so the content below it moves (Cumulative Layout Shift, a Core Web Vital).

## How to fix

Set the intrinsic size; CSS can still make the image responsive:

```html
<img src="hero.jpg" width="1200" height="600" alt="…" style="width: 100%; height: auto">
```

## References

- [web.dev: Optimize CLS](https://web.dev/articles/optimize-cls#images-without-dimensions)

[All rules](../../README.md#rules)
