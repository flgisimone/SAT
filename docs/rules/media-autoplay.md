# `media-autoplay`

**Category**: Accessibility · **Default**: warning · **WCAG**: [1.4.2 Audio Control](https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html)

**Source**: [ACT 80f0bf Audio or video element avoids automatically playing audio](https://www.w3.org/WAI/standards-guidelines/act/rules/80f0bf/proposed/)

## What it checks

`<video>` and `<audio>` with `autoplay` that are not `muted` and have no `controls`. Media that stop within 3 seconds through a media fragment (`#t=8,10`) are fine. A warning: SAT can't tell whether the file has sound, how long it lasts, or whether the page has its own pause button.

## Why

Sound that starts on its own covers the screen reader's voice: users can't hear the page well enough to find how to stop it.

## How to fix

```html
<video autoplay muted playsinline src="hero.mp4"></video>
<audio autoplay controls src="intro.mp3"></audio>
```

## References

- [Failure F23: audio that plays for more than 3 seconds without a way to stop it](https://www.w3.org/WAI/WCAG22/Techniques/failures/F23)

With the [axe-core engine](../../README.md#-axe-core-engine-optional) this rule is off: axe checks the same thing.

[All rules](../../README.md#rules)
