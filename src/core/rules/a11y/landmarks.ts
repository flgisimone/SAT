import { describeElement, queryTargets } from "../../../sat/satDom";
import { isScopedToSection } from "./aria-roles";
import type { Rule } from "../rule";

function landmarkElements(doc: Document, selector: string, role: string, scoped = false): HTMLElement[] {
    const native = queryTargets<HTMLElement>(selector, doc).filter((el) => !scoped || !isScopedToSection(el));
    const explicit = queryTargets<HTMLElement>(`[role="${role}"]`, doc);
    return Array.from(new Set([...native, ...explicit])).filter((el) => !el.hasAttribute('hidden'));
}

function hasLabel(el: Element): boolean {
    return !!el.getAttribute('aria-label')?.trim() || el.hasAttribute('aria-labelledby');
}

/**
 * Page landmarks (WAI-ARIA landmark rules):
 *
 * - error: more than one visible <main> (HTML: a document "must not" have more than one);
 * - warning: no main, or more than one with role="main" (WAI-ARIA "should");
 * - warning: more than one page-level `banner` (<header>) or `contentinfo` (<footer>) (WAI-ARIA "should").
 *   Headers/footers inside article, aside, main, nav or section are not landmarks and are ignored;
 * - warning: when there is more than one `navigation`, each needs an aria-label or aria-labelledby.
 */
export const landmarks: Rule = {
    id: 'landmarks',
    category: 'a11y',
    defaultSeverity: 'error',
    wcag: ['1.3.1'],
    run({ document, report }) {
        const mains = landmarkElements(document, 'main', 'main');
        if (mains.length === 0) {
            report({ message: 'Missing <main> landmark. Wrap the primary content of the page in <main>.', severity: 'warning' });
        } else {
            const nativeMains = mains.filter((el) => el.localName === 'main').length;
            mains.slice(1).forEach((el) => {
                report({
                    element: el,
                    message: `Multiple <main> landmarks (${mains.length}): ${describeElement(el)}. A page should have only one visible main.`,
                    severity: nativeMains > 1 ? 'error' : 'warning',
                });
            });
        }

        const singletons: Array<[string, string]> = [['header', 'banner'], ['footer', 'contentinfo']];
        singletons.forEach(([tag, role]) => {
            const elements = landmarkElements(document, tag, role, true);
            elements.slice(1).forEach((el) => {
                report({
                    element: el,
                    message: `Multiple page-level <${tag}> (role ${role}) found (${elements.length}): ${describeElement(el)}. A page should have only one.`,
                    severity: 'warning',
                });
            });
        });

        const navs = landmarkElements(document, 'nav', 'navigation');
        if (navs.length > 1) {
            navs.filter((el) => !hasLabel(el)).forEach((el) => {
                report({
                    element: el,
                    message: `Multiple <nav> landmarks (${navs.length}) and ${describeElement(el)} has no aria-label/aria-labelledby to tell them apart.`,
                    severity: 'warning',
                });
            });
        }
    },
};
