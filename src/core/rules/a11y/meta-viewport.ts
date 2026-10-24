import { queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";

/** Viewport values as browsers read them (CSS Device Adaptation): keywords map to numbers, other text to 0. */
function viewportNumber(value: string): number {
    const keywords: Record<string, number> = { yes: 1, no: 0, 'device-width': 10, 'device-height': 10 };
    if (value in keywords) return keywords[value];
    const number = parseFloat(value);
    return Number.isNaN(number) ? 0 : number;
}

/**
 * Zoom is not blocked by the viewport meta tag (ACT b4f0c3, WCAG 1.4.4): user-scalable=no (or a
 * value below 1) and maximum-scale below 2 stop users from enlarging text to 200%.
 * Negative maximum-scale values are ignored by browsers and not reported.
 */
export const metaViewport: Rule = {
    id: 'meta-viewport',
    category: 'a11y',
    defaultSeverity: 'error',
    wcag: ['1.4.4'],
    run({ document, report }) {
        queryTargets<HTMLMetaElement>('meta[name="viewport" i][content]', document).forEach((meta) => {
            const content = meta.getAttribute('content')!;
            const settings = new Map(content.split(/[,;]/).map((pair) => {
                const [key, value = ''] = pair.split('=').map((part) => part.trim().toLowerCase());
                return [key, value] as const;
            }));

            const problems: string[] = [];
            const scalable = settings.get('user-scalable');
            if (scalable !== undefined && Math.abs(viewportNumber(scalable)) < 1) problems.push(`user-scalable=${scalable}`);
            const maximum = settings.get('maximum-scale');
            if (maximum !== undefined) {
                const scale = viewportNumber(maximum);
                if (scale >= 0 && scale < 2) problems.push(`maximum-scale=${maximum}`);
            }
            if (problems.length === 0) return;

            report({
                element: meta,
                message: `<meta name="viewport" content="${content}"> blocks zoom (${problems.join(', ')}). Remove ${problems.length > 1 ? 'them' : 'it'} so users can enlarge the text to 200%.`,
            });
        });
    },
};
