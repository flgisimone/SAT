# `link-broken`

**Category**: SEO · **Default**: off (error when on)

## What it checks

Internal links answer without 4xx/5xx, checked with one HEAD request per URL, at most 5 at a time. Logout, delete and similar URLs are never requested.

## Why

Broken links waste crawl budget and frustrate users.

## How to fix

Fix or remove the link. In single-page apps the dev server usually answers 200 for every route, so client-side 404s can't be found this way. Turn the rule on with `rules: { "link-broken": "error" }`.

[All rules](../../README.md#rules)
