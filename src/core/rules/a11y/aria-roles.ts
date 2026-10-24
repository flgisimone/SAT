import { describeElement, queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";

/** Concrete (non-abstract) WAI-ARIA 1.2 roles. */
export const validRoles: string[] = [
    'alert', 'alertdialog', 'application', 'article',
    'banner', 'blockquote', 'button', 'caption', 'cell', 'checkbox', 'code', 'columnheader',
    'combobox', 'complementary', 'contentinfo', 'definition', 'deletion',
    'dialog', 'directory', 'document', 'emphasis', 'feed', 'figure',
    'form', 'generic', 'grid', 'gridcell', 'group', 'heading', 'img', 'insertion',
    'link', 'list', 'listbox', 'listitem', 'log', 'main',
    'marquee', 'math', 'menu', 'menubar', 'menuitem',
    'menuitemcheckbox', 'menuitemradio', 'meter', 'navigation', 'none',
    'note', 'option', 'paragraph', 'presentation', 'progressbar', 'radio',
    'radiogroup', 'region', 'row', 'rowgroup', 'rowheader',
    'scrollbar', 'search', 'searchbox', 'separator', 'slider',
    'spinbutton', 'status', 'strong', 'subscript', 'superscript', 'switch', 'tab', 'table',
    'tablist', 'tabpanel', 'term', 'textbox', 'time', 'timer',
    'toolbar', 'tooltip', 'tree', 'treegrid', 'treeitem'
];

const SECTIONING_SELECTOR = 'article, aside, main, nav, section';

/** True when a <header>/<footer> is nested in sectioning content and so is not a page landmark. */
export function isScopedToSection(el: Element): boolean {
    return el.parentElement?.closest(SECTIONING_SELECTOR) != null;
}

function inputRole(input: HTMLInputElement): string | null {
    const type = (input.getAttribute('type') || 'text').toLowerCase();
    switch (type) {
        case 'button':
        case 'submit':
        case 'reset':
        case 'image':
            return 'button';
        case 'checkbox':
            return 'checkbox';
        case 'radio':
            return 'radio';
        case 'range':
            return 'slider';
        case 'number':
            return 'spinbutton';
        case 'search':
            return input.hasAttribute('list') ? 'combobox' : 'searchbox';
        case 'email':
        case 'tel':
        case 'text':
        case 'url':
            return input.hasAttribute('list') ? 'combobox' : 'textbox';
        default:
            return null;
    }
}

/**
 * The role an element already has without a role attribute (HTML-AAM).
 * Only the common cases are covered; null means "no implicit role" or "not covered".
 */
export function implicitRole(el: Element): string | null {
    const tag = el.tagName.toLowerCase();
    switch (tag) {
        case 'a':
        case 'area':
            return el.hasAttribute('href') ? 'link' : null;
        case 'article': return 'article';
        case 'aside': return 'complementary';
        case 'button': return 'button';
        case 'dialog': return 'dialog';
        case 'fieldset': return 'group';
        case 'figure': return 'figure';
        case 'footer': return isScopedToSection(el) ? null : 'contentinfo';
        case 'form': return 'form';
        case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6':
            return 'heading';
        case 'header': return isScopedToSection(el) ? null : 'banner';
        case 'hr': return 'separator';
        case 'img': return el.getAttribute('alt') === '' ? 'presentation' : 'img';
        case 'input': return inputRole(el as HTMLInputElement);
        case 'li': return 'listitem';
        case 'main': return 'main';
        case 'menu':
        case 'ol':
        case 'ul':
            return 'list';
        case 'nav': return 'navigation';
        case 'option': return 'option';
        case 'output': return 'status';
        case 'progress': return 'progressbar';
        case 'search': return 'search';
        case 'section':
            return el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby') ? 'region' : null;
        case 'select': {
            const select = el as HTMLSelectElement;
            return select.multiple || select.size > 1 ? 'listbox' : 'combobox';
        }
        case 'table': return 'table';
        case 'tbody':
        case 'tfoot':
        case 'thead':
            return 'rowgroup';
        case 'td': return 'cell';
        case 'textarea': return 'textbox';
        case 'tr': return 'row';
        default:
            return null;
    }
}

/**
 * Explicit `role` attributes (WAI-ARIA 1.2, WCAG 4.1.2).
 *
 * - Error: role values that don't exist in WAI-ARIA (or are abstract roles).
 * - Warning: redundant roles that repeat the element's native role (e.g. <button role="button">).
 *
 * Native elements without a role attribute are not reported: their role is implicit,
 * and adding it explicitly goes against the first rule of ARIA.
 */
export const ariaRoles: Rule = {
    id: 'aria-roles',
    category: 'a11y',
    defaultSeverity: 'error',
    wcag: ['4.1.2'],
    run({ document, report }) {
        queryTargets<HTMLElement>('[role]', document).forEach((el) => {
            const roles = (el.getAttribute('role') || '').trim().toLowerCase().split(/\s+/).filter(Boolean);

            if (roles.length === 0) {
                report({
                    element: el,
                    message: `Empty role attribute on ${describeElement(el)}. Remove it or set a valid role.`,
                    highlight: { outline: '2px dashed magenta', title: 'Empty role attribute' },
                });
                return;
            }

            const invalid = roles.filter((role) => !validRoles.includes(role)).join(', ');
            if (invalid) {
                report({
                    element: el,
                    message: `Invalid role(s) [${invalid}] on ${describeElement(el)}.`,
                    highlight: { outline: '2px dashed magenta', title: `Invalid role(s): ${invalid}` },
                });
                return;
            }

            const native = implicitRole(el);
            if (native && roles[0] === native) {
                report({
                    element: el,
                    message: `Redundant role="${native}" on ${describeElement(el)}: the element already has this role natively. Remove the attribute.`,
                    severity: 'warning',
                    highlight: { outline: '2px dashed purple', title: `Redundant role: ${native}` },
                });
            }
        });
    },
};
