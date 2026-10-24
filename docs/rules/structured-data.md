# `structured-data`

**Category**: SEO · **Default**: error

**Source**: [Google Search Central: structured data gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery) · [JSON-LD 1.1](https://www.w3.org/TR/json-ld11/)

## What it checks

`<script type="application/ld+json">` blocks:

- invalid JSON (the message has the parser's position in Chromium and Firefox);
- items without `@type` (top level, array items or `@graph` items);
- the properties Google requires for a rich result, for these types:

| Type | Required | Google's page |
|---|---|---|
| `BreadcrumbList` | `itemListElement`; each `ListItem`: `position`, `name` (or `item.name`), `item` (not on the last one) | [Breadcrumb](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb) |
| `Event` | `name`, `startDate`, `location.address` | [Event](https://developers.google.com/search/docs/appearance/structured-data/event) |
| `LocalBusiness`, `Restaurant`, `Store` | `name`, `address` | [Local business](https://developers.google.com/search/docs/appearance/structured-data/local-business) |
| `Product` | `name`, one of `review`, `aggregateRating`, `offers`; each `Offer`: `price` (or `priceSpecification.price`); each `AggregateOffer`: `lowPrice`, `priceCurrency` | [Product snippet](https://developers.google.com/search/docs/appearance/structured-data/product-snippet) |
| `Recipe` | `name`, `image` | [Recipe](https://developers.google.com/search/docs/appearance/structured-data/recipe) |
| `VideoObject` | `name`, `thumbnailUrl`, `uploadDate`; each `Clip` in `hasPart`: `name`, `startOffset`, `url` | [Video](https://developers.google.com/search/docs/appearance/structured-data/video) |
| `SoftwareApplication`, `MobileApplication`, `WebApplication` | `name`, `offers.price`, one of `aggregateRating`, `review` | [Software app](https://developers.google.com/search/docs/appearance/structured-data/software-app) |
| `Review` | `author`, `itemReviewed.name` (when not nested), `reviewRating.ratingValue` when there is a rating | [Review snippet](https://developers.google.com/search/docs/appearance/structured-data/review-snippet) |
| `AggregateRating` | `ratingValue`, `ratingCount` or `reviewCount`, `itemReviewed.name` (when not nested) | [Review snippet](https://developers.google.com/search/docs/appearance/structured-data/review-snippet) |

`Review` and `AggregateRating` are also checked inside `Product`, `LocalBusiness`, `Recipe` and software apps. The table comes from Google's pages as updated on 8 and 24 September 2026 (`src/core/rules/seo/google-structured-data.ts`).

`"@type": ["Product", "Thing"]`, full schema.org URLs as types, `@graph` and nodes with the same `@id` (in any block of the page) are understood. Other types are not checked, and neither are recommended properties. Google requires no property for `Article`, `NewsArticle`, `BlogPosting` and `Organization`.

## Why

Search engines drop a block they can't parse, an item without `@type` doesn't describe anything, and without a required property Google shows no rich result.

## How to fix

Fix the JSON (trailing commas and unquoted keys are the usual causes), give every item a type and add the property the message names, at the path it shows (`Product > offers > price`):

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Executive Anvil",
  "offers": { "@type": "Offer", "price": 119.99, "priceCurrency": "USD" }
}
</script>
```

Google's Rich Results Test also checks the recommended properties and the types SAT doesn't cover.

## References

- [Google Search Central: structured data gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery)
- [Rich Results Test](https://search.google.com/test/rich-results)

[All rules](../../README.md#rules)
