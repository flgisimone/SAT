# `h1-visible`

**Category**: SEO · **Default**: error

## What it checks

The first `<h1>` is rendered: not `display: none`, `visibility: hidden` or fully transparent. A missing `<h1>` is reported by [`h1`](h1.md).

## Why

A hidden main heading is a hint of hidden text to search engines, and sighted users don't see the title the page announces.

## How to fix

Show the `<h1>`. If the design has no visible title, use a visually hidden class that keeps it in the layout (clip, 1px size) instead of `display: none`.

## References

- [Google Search Central: hidden text](https://developers.google.com/search/docs/essentials/spam-policies#hidden-text-and-links)

[All rules](../../README.md#rules)
