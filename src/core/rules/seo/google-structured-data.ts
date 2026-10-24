/**
 * Properties Google Search requires for rich results, from the pages of the structured data gallery
 * (https://developers.google.com/search/docs/appearance/structured-data/search-gallery).
 * To update: compare each entry with its page and change `updated` to the page's "Last updated" date.
 * ponytail: a table in the code, not the specs downloaded at runtime; recommended properties are left out.
 *
 * Article (NewsArticle, BlogPosting) and Organization are not here: Google requires no property for them.
 */

export interface Requirements {
    /** Google's page for the feature. */
    page: string;
    /** "Last updated" date of the page the entry was read from. */
    updated: string;
    /** Each requirement lists alternatives, one is enough; a path goes into nested objects with dots. */
    required: string[][];
    /** Properties whose values are checked against `NESTED_TYPES`, by their own `@type`. */
    nested?: string[];
    /** Requirements the last item of a list doesn't need (the last breadcrumb is the page itself). */
    notRequiredOnLast?: string[];
}

const BASE = 'https://developers.google.com/search/docs/appearance/structured-data/';

const breadcrumb: Requirements = { page: `${BASE}breadcrumb`, updated: '2026-09-08', required: [['itemListElement']], nested: ['itemListElement'] };
// Restaurant and Store are the subtypes in Google's examples.
// ponytail: other LocalBusiness subtypes (Dentist, Hotel…) are not checked; add them when someone asks.
const localBusiness: Requirements = {
    page: `${BASE}local-business`,
    updated: '2026-09-08',
    required: [['name'], ['address']],
    nested: ['review', 'aggregateRating'],
};
const softwareApp: Requirements = {
    page: `${BASE}software-app`,
    updated: '2026-09-08',
    required: [['name'], ['offers.price'], ['aggregateRating', 'review']],
    nested: ['review', 'aggregateRating'],
};
const reviewSnippet = `${BASE}review-snippet`;

/** Requirements of top-level items (top level, arrays and `@graph`), by `@type`. */
export const GOOGLE_TYPES: Record<string, Requirements> = {
    BreadcrumbList: breadcrumb,
    Event: { page: `${BASE}event`, updated: '2026-09-08', required: [['name'], ['startDate'], ['location.address']] },
    LocalBusiness: localBusiness,
    Restaurant: localBusiness,
    Store: localBusiness,
    Product: {
        page: `${BASE}product-snippet`,
        updated: '2026-09-08',
        required: [['name'], ['review', 'aggregateRating', 'offers']],
        nested: ['offers', 'review', 'aggregateRating'],
    },
    Recipe: { page: `${BASE}recipe`, updated: '2026-09-08', required: [['name'], ['image']], nested: ['review', 'aggregateRating'] },
    // ponytail: Clip only; BroadcastEvent and SeekToAction (LIVE badge, key moments by URL) are not checked.
    VideoObject: { page: `${BASE}video`, updated: '2026-09-24', required: [['name'], ['thumbnailUrl'], ['uploadDate']], nested: ['hasPart'] },
    SoftwareApplication: softwareApp,
    MobileApplication: softwareApp,
    WebApplication: softwareApp,
    Review: { page: reviewSnippet, updated: '2026-09-08', required: [['author'], ['itemReviewed.name']], nested: ['reviewRating'] },
    AggregateRating: { page: reviewSnippet, updated: '2026-09-08', required: [['itemReviewed.name'], ['ratingValue'], ['ratingCount', 'reviewCount']] },
};

/** Requirements of items nested in a property listed in `nested`, by `@type`. */
export const NESTED_TYPES: Record<string, Requirements> = {
    ListItem: { ...breadcrumb, required: [['position'], ['name', 'item.name'], ['item']], nested: undefined, notRequiredOnLast: ['item'] },
    Offer: { page: `${BASE}product-snippet`, updated: '2026-09-08', required: [['price', 'priceSpecification.price']] },
    AggregateOffer: { page: `${BASE}product-snippet`, updated: '2026-09-08', required: [['lowPrice'], ['priceCurrency']] },
    // The rating of a review is not required: Google's pros and cons example has none.
    Review: { page: reviewSnippet, updated: '2026-09-08', required: [['author']], nested: ['reviewRating'] },
    Rating: { page: reviewSnippet, updated: '2026-09-08', required: [['ratingValue']] },
    AggregateRating: { page: reviewSnippet, updated: '2026-09-08', required: [['ratingValue'], ['ratingCount', 'reviewCount']] },
    Clip: { page: `${BASE}video`, updated: '2026-09-24', required: [['name'], ['startOffset'], ['url']] },
};
