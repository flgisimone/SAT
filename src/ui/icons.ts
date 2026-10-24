/** Inline SVG icons on a 16×16 grid, drawn with `currentColor` (styles in styles.ts). */

type Shape = [tag: string, attributes: Record<string, string>];

const ERROR_MARK: Shape[] = [['path', { d: 'M8 4.75v3.75', class: 'ink' }], ['circle', { cx: '8', cy: '11.1', r: '1', class: 'ink-dot' }]];

const ICONS = {
    play: [['path', { d: 'M5 3.2v9.6L12.8 8z', class: 'solid' }]],
    stop: [['rect', { x: '4', y: '4', width: '8', height: '8', rx: '1.5', class: 'solid' }]],
    rerun: [['path', { d: 'M13.25 8A5.25 5.25 0 1 1 11.7 4.3' }], ['path', { d: 'M13.25 2.25V5H10.5' }]],
    close: [['path', { d: 'M4 4l8 8M12 4l-8 8' }]],
    left: [['path', { d: 'M13 8H3M7 4L3 8l4 4' }]],
    right: [['path', { d: 'M3 8h10M9 4l4 4-4 4' }]],
    external: [['path', { d: 'M9.5 2.5h4v4M13.5 2.5L7.5 8.5M11.5 9.5v4h-9v-9h4' }]],
    error: [['circle', { cx: '8', cy: '8', r: '7', class: 'solid' }], ...ERROR_MARK],
    warning: [['path', { d: 'M8 1.25l7.1 13H.9z', class: 'solid' }], ['path', { d: 'M8 6v3.25', class: 'ink' }], ['circle', { cx: '8', cy: '11.6', r: '1', class: 'ink-dot' }]],
    a11y: [['circle', { cx: '8', cy: '3', r: '1.5' }], ['path', { d: 'M3 6l5 1 5-1M8 7v3l-2.25 4.25M8 10l2.25 4.25' }]],
    seo: [['circle', { cx: '7', cy: '7', r: '4.5' }], ['path', { d: 'M10.4 10.4L14 14' }]],
    brand: [['rect', { x: '0.5', y: '0.5', width: '15', height: '15', rx: '4', class: 'solid' }], ['path', { d: 'M4.5 8.25l2.25 2.25L11.5 5.75', class: 'ink' }]],
} satisfies Record<string, Shape[]>;

export type IconName = keyof typeof ICONS;

const SVG = 'http://www.w3.org/2000/svg';

/**
 * An icon. Decorative (hidden from assistive technologies) unless it gets a `label`,
 * which makes it an image with that name (severity icons, read as "Error" or "Warning").
 */
export function icon(name: IconName, label?: string): SVGSVGElement {
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('viewBox', '0 0 16 16');
    if (label) {
        svg.setAttribute('role', 'img');
        svg.setAttribute('aria-label', label);
    } else {
        svg.setAttribute('aria-hidden', 'true');
    }
    if (name === 'error' || name === 'warning') svg.setAttribute('class', `sev-${name}`);
    for (const [tag, attributes] of ICONS[name]) {
        const shape = document.createElementNS(SVG, tag);
        Object.entries(attributes).forEach(([key, value]) => shape.setAttribute(key, value));
        svg.append(shape);
    }
    return svg;
}
