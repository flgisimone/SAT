type RGB = [number, number, number];

/**
 * Converts a CSS color string to an RGB tuple.
 * Supports: rgb(), rgba(), hex, color names (via computed styles fallback).
 *
 * @param {string} color - The color string (e.g., 'rgb(255, 255, 255)', '#ffffff', 'red').
 * @returns {RGB} A tuple of RGB values [r, g, b].
 */
export function colorToRgbArray(color: string): RGB {
    // 1. Check if color is rgb() or rgba()
    if (color.startsWith('rgb')) {
        const rgbValues = color.match(/\d+/g);
        if (rgbValues && rgbValues.length >= 3) {
            return [
                parseInt(rgbValues[0], 10),
                parseInt(rgbValues[1], 10),
                parseInt(rgbValues[2], 10)
            ];
        }
    }

    // 2. Check if color is hex
    if (color.startsWith('#')) {
        return hexToRgb(color);
    }

    // 3. Fallback for named colors or any unknown format
    const tempEl = document.createElement('div');
    tempEl.style.color = color;
    document.body.appendChild(tempEl);

    const computedColor = window.getComputedStyle(tempEl).color;
    document.body.removeChild(tempEl);

    // Try again recursively with the computed RGB value
    return colorToRgbArray(computedColor);
}

/**
 * Converts a hex color string to an RGB tuple.
 *
 * @param {string} hex - The hex color string (e.g., '#ffffff').
 * @returns {RGB} A tuple of RGB values [r, g, b].
 */
export function hexToRgb(hex: string): RGB {
    const parsed = hex.replace('#', '');
    const bigint = parseInt(parsed, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
}

/**
 * Calculates the relative luminance of an RGB color.
 *
 * @param {number} r - Red value (0-255).
 * @param {number} g - Green value (0-255).
 * @param {number} b - Blue value (0-255).
 * @returns {number} The relative luminance (0.0 - 1.0).
 */
export function luminance(r: number, g: number, b: number): number {
    const a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928
            ? v / 12.92
            : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Calculates the contrast ratio between two RGB colors.
 *
 * @param {RGB} rgb1 - The first RGB color tuple.
 * @param {RGB} rgb2 - The second RGB color tuple.
 * @returns {number} The contrast ratio.
 */
export function contrast(rgb1: RGB, rgb2: RGB): number {
    const lum1 = luminance(...rgb1);
    const lum2 = luminance(...rgb2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Tries to find an effective background color for an element.
 * Walks up the DOM tree until it finds a non-transparent background, or defaults to body.
 *
 * @param {HTMLElement} el - The element to check.
 * @returns {string} A CSS color string.
 */
export function getEffectiveBackground(el: HTMLElement): string {
    let current: HTMLElement | null = el;

    while (current && current !== document.body) {
        const bg = window.getComputedStyle(current).backgroundColor;
        if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            return bg;
        }
        current = current.parentElement;
    }

    // fallback: background color of body or white
    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
    return (bodyBg !== 'rgba(0, 0, 0, 0)' && bodyBg !== 'transparent') ? bodyBg : 'rgb(255, 255, 255)';
}

/**
 * Checks contrast ratio for text elements according to WCAG 2.1 standards.
 * Targets: headings (`h1`-`h6`), `span`, `a`, `button`.
 * Logs warnings when contrast is below AA (4.5) or AAA (7.0) thresholds.
 * Highlights elements with insufficient contrast (adds red dashed outline).
 *
 * @returns {void}
 */
export function checkTextElementContrast(enableCheckTextElementContrast?: boolean): void {
    if (!enableCheckTextElementContrast) return;

    const selectors = 'h1, h2, h3, h4, h5, h6, span, a, button';
    const elements = Array.from(document.querySelectorAll(selectors)) as HTMLElement[];

    elements.forEach((el) => {
        const computedStyle = window.getComputedStyle(el);
        const color = computedStyle.color;
        let backgroundColor = computedStyle.backgroundColor;

        // If background is transparent, get effective background from parent elements
        if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
            backgroundColor = getEffectiveBackground(el);
        }

        const rgbText = colorToRgbArray(color);
        const rgbBackground = colorToRgbArray(backgroundColor);

        const contrastRatio = contrast(rgbText, rgbBackground);
        const text = el.textContent?.trim() || '';

        if (contrastRatio < 4.5) {
            console.error(`❌️️ Insufficient contrast on ${el.tagName} ("${text}"): contrast ratio ${contrastRatio.toFixed(2)}. Minimum AA requirement is 4.5.`);

            el.title = `Insufficient contrast (${contrastRatio.toFixed(2)})`;
            el.style.outline = '2px dashed red';
        } else if (contrastRatio < 7) {
            console.warn(`⚠️ Contrast on ${el.tagName} ("${text}") is ${contrastRatio.toFixed(2)}. Meets AA but not AAA standards.`);
        }
    });
}
