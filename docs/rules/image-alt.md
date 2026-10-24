# `image-alt`

**Category**: Accessibility · **Default**: error · **WCAG**: [1.1.1 Non-text Content](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html)

**Source**: [ACT 23a2a8 Image has non-empty accessible name](https://www.w3.org/WAI/standards-guidelines/act/rules/23a2a8/proposed/) · [HTML: requirements for providing text to act as an alternative for images](https://html.spec.whatwg.org/multipage/images.html#alt) · [Google Search Central: image SEO](https://developers.google.com/search/docs/appearance/google-images)

## What it checks

`<img>` without an `alt` attribute is an error; alt text that looks like a file name (`photo.jpg`) is a warning. `alt=""` marks a decorative image and is valid.

## Why

Screen readers read the file name of images without `alt`. Search engines use the alt text to understand images.

## How to fix

```html
<img src="team.jpg" alt="The team at the 2026 meetup">
<img src="divider.svg" alt="">  <!-- decorative -->
```

## References

- [WAI tutorial: Images](https://www.w3.org/WAI/tutorials/images/)

With the [axe-core engine](../../README.md#-axe-core-engine-optional) this rule is off: axe checks the same thing.

[All rules](../../README.md#rules)
