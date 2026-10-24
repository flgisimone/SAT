import { logError, logWarning } from "../../sat/satLogger";
import { describeElement, highlight, isElementVisible, queryTargets } from "../../sat/satDom";

const HEADINGS = 'h1, h2, h3, h4, h5, h6';

const LEVEL_STYLES: Record<number, { backgroundColor: string; outline: string }> = {
    1: { backgroundColor: 'rgba(255, 0, 0, 0.1)', outline: '2px solid red' },
    2: { backgroundColor: 'rgba(255, 165, 0, 0.1)', outline: '2px solid orange' },
    3: { backgroundColor: 'rgba(255, 255, 0, 0.1)', outline: '2px solid yellow' },
    4: { backgroundColor: 'rgba(0, 128, 0, 0.1)', outline: '2px solid green' },
    5: { backgroundColor: 'rgba(0, 0, 255, 0.1)', outline: '2px solid blue' },
    6: { backgroundColor: 'rgba(128, 0, 128, 0.1)', outline: '2px solid purple' },
};

function headingLevel(el: Element): number {
    return parseInt(el.tagName.slice(1), 10);
}

function getHeadings(): HTMLElement[] {
    return queryTargets<HTMLElement>(HEADINGS);
}

/** Checks that the page has exactly one <h1>. */
export function checkH1(enableCheckH1?: boolean): void {
    if (!enableCheckH1) return;

    const h1s = queryTargets<HTMLElement>('h1');

    if (h1s.length === 0) {
        logError('No <h1> found on the page.');
    } else if (h1s.length > 1) {
        logError(`Multiple <h1> found on the page (${h1s.length}). Use a single <h1> for the main topic.`);
        h1s.forEach((h1) => highlight(h1, { ...LEVEL_STYLES[1], title: '❌ Multiple <h1> on the page' }));
    }
}

/** Checks that the first <h1> is actually rendered (not display:none, hidden or transparent). */
export function checkH1Visible(enableCheckH1Visible: boolean): void {
    if (!enableCheckH1Visible) return;

    const h1 = queryTargets<HTMLElement>('h1')[0];
    if (!h1) return; // missing <h1> is reported by checkH1

    if (!isElementVisible(h1)) {
        logError(`The first <h1> is not visible: ${describeElement(h1)}. The main heading should be rendered on the page.`);
        highlight(h1, { ...LEVEL_STYLES[1], title: '❌ <h1> is not visible' });
    }
}

/**
 * Highlights every heading with a color per level (a visual outline of the page)
 * and checks that the first heading of the page is an <h1>.
 *
 * Going back to a higher level (e.g. H3 → H2) is valid: it starts a new section.
 * Skipped levels are reported by `checkJumpLevels`.
 */
export function checkHeadingOrder(enableCheckHeadingOrder: boolean): void {
    if (!enableCheckHeadingOrder) return;

    const headings = getHeadings();

    headings.forEach((el) => {
        highlight(el, LEVEL_STYLES[headingLevel(el)]);
    });

    const first = headings[0];
    if (first && headingLevel(first) !== 1) {
        const msg = `The first heading of the page is ${describeElement(first)}, not an <h1>.`;
        logWarning(msg);
        highlight(first, { title: msg });
    }
}

/** Reports skipped heading levels going down the outline (e.g. H2 → H4). */
export function checkJumpLevels(enableCheckJumpLevels: boolean): void {
    if (!enableCheckJumpLevels) return;

    let lastLevel = 0;

    getHeadings().forEach((el) => {
        const level = headingLevel(el);

        if (lastLevel !== 0 && level - lastLevel > 1) {
            const msg = `Heading level skipped: ${describeElement(el)} comes after an H${lastLevel}. Expected H${lastLevel + 1} or higher.`;
            logError(msg);
            highlight(el, { title: msg });
        }

        lastLevel = level;
    });
}
