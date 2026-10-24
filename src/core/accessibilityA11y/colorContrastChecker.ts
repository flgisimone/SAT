import { logError, logWarning } from '../../sat/satLogger';
import { describeElement, highlight, isElementVisible, queryTargets } from '../../sat/satDom';

export type RGB = [number, number, number];
export type RGBA = [number, number, number, number];

let canvasContext: CanvasRenderingContext2D | null | undefined;

function getCanvasContext(): CanvasRenderingContext2D | null {
    if (canvasContext === undefined) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            canvasContext = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D | null;
        } catch {
            canvasContext = null;
        }
    }
    return canvasContext;
}

function parseAlpha(value: string | undefined): number {
    if (value === undefined) return 1;
    const alpha = value.endsWith('%') ? parseFloat(value) / 100 : parseFloat(value);
    return Number.isNaN(alpha) ? 1 : Math.min(Math.max(alpha, 0), 1);
}

/**
 * Converts a CSS color string to an RGBA tuple (alpha 0..1).
 * Supports rgb()/rgba() (comma or space syntax), hex (3, 4, 6, 8 digits), and,
 * through a 1px canvas, any other color the browser understands (named colors,
 * hsl(), oklch(), color(), ...). Returns null if the color can't be resolved.
 */
export function parseColor(color: string): RGBA | null {
    const value = color.trim().toLowerCase();
    if (value === 'transparent') return [0, 0, 0, 0];

    const rgb = value.match(
        /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/
    );
    if (rgb) {
        return [parseFloat(rgb[1]), parseFloat(rgb[2]), parseFloat(rgb[3]), parseAlpha(rgb[4])];
    }

    const hex = value.match(/^#([0-9a-f]{3,8})$/);
    if (hex && [3, 4, 6, 8].includes(hex[1].length)) {
        let digits = hex[1];
        if (digits.length <= 4) digits = digits.split('').map((d) => d + d).join('');
        const r = parseInt(digits.slice(0, 2), 16);
        const g = parseInt(digits.slice(2, 4), 16);
        const b = parseInt(digits.slice(4, 6), 16);
        const a = digits.length === 8 ? parseInt(digits.slice(6, 8), 16) / 255 : 1;
        return [r, g, b, a];
    }

    const ctx = getCanvasContext();
    if (!ctx) return null;

    const sentinel = 'rgba(1, 2, 3, 0)';
    ctx.fillStyle = sentinel;
    ctx.fillStyle = value;
    if (ctx.fillStyle === sentinel) return null; // the browser rejected the color

    ctx.clearRect(0, 0, 1, 1);
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
}

/**
 * Kept for backwards compatibility. Returns black when the color can't be parsed.
 */
export function colorToRgbArray(color: string): RGB {
    const parsed = parseColor(color);
    return parsed ? [parsed[0], parsed[1], parsed[2]] : [0, 0, 0];
}

export function hexToRgb(hex: string): RGB {
    return colorToRgbArray(hex.startsWith('#') ? hex : `#${hex}`);
}

/** Composites a semi-transparent color over an opaque one. */
export function blend(top: RGBA, bottom: RGB): RGB {
    const a = top[3];
    return [
        top[0] * a + bottom[0] * (1 - a),
        top[1] * a + bottom[1] * (1 - a),
        top[2] * a + bottom[2] * (1 - a),
    ];
}

export function luminance(r: number, g: number, b: number): number {
    const a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export function contrast(rgb1: RGB, rgb2: RGB): number {
    const lum1 = luminance(...rgb1);
    const lum2 = luminance(...rgb2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Computes the background actually behind an element by walking up the DOM and
 * blending semi-transparent layers over white.
 * Returns null when a background image is involved, since its color can't be known.
 */
export function getEffectiveBackground(el: Element): RGB | null {
    const layers: RGBA[] = [];
    let current: Element | null = el;

    while (current) {
        const style = window.getComputedStyle(current);
        if (style.backgroundImage && style.backgroundImage !== 'none') return null;

        const bg = parseColor(style.backgroundColor || 'transparent');
        if (bg && bg[3] > 0) {
            layers.push(bg);
            if (bg[3] >= 1) break;
        }
        current = current.parentElement;
    }

    let result: RGB = [255, 255, 255];
    for (let i = layers.length - 1; i >= 0; i--) {
        result = blend(layers[i], result);
    }
    return result;
}

function hasOwnText(el: Element): boolean {
    return Array.from(el.childNodes).some(
        (node) => node.nodeType === Node.TEXT_NODE && (node.textContent || '').trim().length > 0
    );
}

/** WCAG "large text": at least 24px, or at least 18.66px (14pt) and bold. */
export function isLargeText(fontSize: string, fontWeight: string): boolean {
    const size = parseFloat(fontSize);
    const weight = parseInt(fontWeight, 10) || (fontWeight === 'bold' ? 700 : 400);
    return size >= 24 || (size >= 18.66 && weight >= 700);
}

const TEXT_SELECTORS = 'h1, h2, h3, h4, h5, h6, p, span, a, button, label, li, td, th, strong, em, small';

/**
 * Checks text contrast against WCAG 2.1.
 * Only elements that directly contain visible text are checked.
 * Thresholds: AA 4.5 (3 for large text), AAA 7 (4.5 for large text).
 */
export function checkTextElementContrast(enableCheckTextElementContrast?: boolean): void {
    if (!enableCheckTextElementContrast) return;

    queryTargets<HTMLElement>(TEXT_SELECTORS).forEach((el) => {
        if (!hasOwnText(el) || !isElementVisible(el)) return;

        const style = window.getComputedStyle(el);
        const background = getEffectiveBackground(el);
        const textColor = parseColor(style.color);
        if (!background || !textColor) return;

        const ratio = contrast(blend(textColor, background), background);
        const large = isLargeText(style.fontSize, style.fontWeight);
        const aa = large ? 3 : 4.5;
        const aaa = large ? 4.5 : 7;
        const sizeNote = large ? ' (large text)' : '';

        if (ratio < aa) {
            logError(
                `Insufficient contrast on ${describeElement(el)}: ratio ${ratio.toFixed(2)}. Minimum AA${sizeNote} is ${aa}.`
            );
            highlight(el, { outline: '2px dashed red', title: `❌ Contrast ratio too low: ${ratio.toFixed(2)}` });
        } else if (ratio < aaa) {
            logWarning(
                `Suboptimal contrast on ${describeElement(el)}: ratio ${ratio.toFixed(2)}. Meets AA but not AAA${sizeNote} (${aaa}).`
            );
            highlight(el, { outline: '1px dashed orange', title: `⚠️ Contrast ratio: ${ratio.toFixed(2)}` });
        }
    });
}
