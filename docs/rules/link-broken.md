# `link-broken`

**Category**: SEO · **Default**: off (error when on)

**Source**: [Google Search Central: crawlable links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)

## What it checks

Internal links answer without 4xx/5xx, checked with one HEAD request per URL, at most 5 at a time. Logout, delete and similar URLs are never requested.

## Why

Broken links waste crawl budget and frustrate users.

## How to fix

Fix or remove the link. In single-page apps the dev server usually answers 200 for every route, so client-side 404s can't be found this way. Turn the rule on with `rules: { "link-broken": "error" }`.

To find the 404s of a single-page app, use the CLI: `npx sat-check <url> --depth 2 --not-found "Page not found"` opens each internal link in Chromium, lets the app's router render it and reports the link when the server answers 4xx/5xx or the page shows the not-found text. See [CLI and CI](../../README.md#cli-and-ci).

[All rules](../../README.md#rules)
