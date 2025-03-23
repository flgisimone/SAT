export const validRoles: string[] = [
    'alert', 'alertdialog', 'application', 'article',
    'banner', 'button', 'cell', 'checkbox', 'columnheader',
    'combobox', 'complementary', 'contentinfo', 'definition',
    'dialog', 'directory', 'document', 'feed', 'figure',
    'form', 'grid', 'gridcell', 'group', 'heading', 'img',
    'link', 'list', 'listbox', 'listitem', 'log', 'main',
    'marquee', 'math', 'menu', 'menubar', 'menuitem',
    'menuitemcheckbox', 'menuitemradio', 'navigation', 'none',
    'note', 'option', 'presentation', 'progressbar', 'radio',
    'radiogroup', 'region', 'row', 'rowgroup', 'rowheader',
    'scrollbar', 'search', 'searchbox', 'separator', 'slider',
    'spinbutton', 'status', 'switch', 'tab', 'table',
    'tablist', 'tabpanel', 'term', 'textbox', 'timer',
    'toolbar', 'tooltip', 'tree', 'treegrid', 'treeitem'
];

const recommendedRolesMap: Record<string, string[]> = {
    header: ['banner'],
    footer: ['contentinfo'],
    nav: ['navigation'],
    main: ['main'],
    aside: ['complementary'],
    section: ['region'],
    form: ['form'],
    button: ['button'],
    a: ['link'],
    ul: ['list'],
    ol: ['list'],
    li: ['listitem'],
    article: ['article'],
    table: ['table'],
    tr: ['row'],
    td: ['cell'],
    th: ['columnheader', 'rowheader'],
    input: ['textbox', 'checkbox', 'radio', 'combobox', 'searchbox', 'spinbutton'],
    textarea: ['textbox'],
    select: ['listbox'],
};

/**
 * Checks for ARIA role attribute validity on various HTML elements.
 *
 * ✔️ Validates if elements have valid ARIA roles (according to the ARIA specification).
 * ✔️ Recommends appropriate roles based on the element type.
 * ✔️ Logs issues and suggestions in the browser console.
 * ✔️ Visually highlights problematic elements with different outline colors:
 *
 *   - 🔴 Magenta dashed outline for **invalid roles**
 *   - 🔵 Turquoise dashed outline for **missing recommended roles**
 *   - 🟣 Purple dashed outline for **non-recommended roles**
 *
 * @returns {void}
 */
export function checkAriaRolesWithSuggestions(enableCheckAriaRolesWithSuggestions: boolean): void {
    if (!enableCheckAriaRolesWithSuggestions) return;

    const elementsWithRoles = Array.from(document.querySelectorAll<HTMLElement>(`
    [role], header, footer, nav, main, aside, section, form, button, a, ul, ol, li, article, table, tr, td, th, input, textarea, select
  `));

    elementsWithRoles.forEach((el) => {
        const roleAttr = el.getAttribute('role');
        const tagName = el.tagName.toLowerCase();

        const recommendedRoles = recommendedRolesMap[tagName] || [];

        if (!roleAttr) {
            if (recommendedRoles.length > 0) {
                console.error(`❌ <${tagName}> is missing a 'role' attribute. Recommended role(s): [${recommendedRoles.join(', ')}].`);

                el.style.outline = '2px dashed turquoise';
                el.title = `Recommended role(s): ${recommendedRoles.join(', ')}`;
            }

            return;
        }

        const roles = roleAttr.trim().split(/\s+/);
        const invalidRoles = roles.filter(r => !validRoles.includes(r));

        if (invalidRoles.length > 0) {
            console.error(`❌ <${tagName}> has invalid role(s): [${invalidRoles.join(', ')}]. Recommended: ${recommendedRoles.length ? recommendedRoles.join(', ') : 'None'}`);

            el.style.outline = '2px dashed magenta';
            el.title = `Invalid ARIA role(s): ${invalidRoles.join(', ')}. Recommended: ${recommendedRoles.join(', ')}`;
        } else if (recommendedRoles.length && !roles.some(role => recommendedRoles.includes(role))) {
            console.warn(`ℹ️ <${tagName}> has a valid role but not the recommended one. Recommended role(s): [${recommendedRoles.join(', ')}]. Current role(s): [${roles.join(', ')}]`);

            el.style.outline = '2px dashed purple';
            el.title = `Consider using: ${recommendedRoles.join(', ')}`;
        }
    });
}

/**
 * Checks for unique ARIA landmark elements in the document.
 *
 * According to accessibility best practices and WAI-ARIA guidelines, the following landmarks
 * should typically appear only once per page:
 *
 * - <header> (`banner`)
 * - <nav> (`navigation`)
 * - <main> (`main`)
 * - <footer> (`contentinfo`)
 *
 * If multiple instances of these landmarks exist, each **must** be distinguished by
 * either an `aria-label` or an `aria-labelledby` attribute.
 *
 * This function:
 * ✅ Ensures only one instance of each landmark exists (or has accessible labels if repeated).
 * ✅ Logs warnings and informational messages in the console.
 * ✅ Highlights problematic elements by adding an orange dashed outline.
 *
 * @returns {void}
 */
export function checkUniqueLandmarks(enableCheckUniqueLandmarks?: boolean): void {
    if (!enableCheckUniqueLandmarks) return;

    const landmarksToCheck = [
        { role: 'banner', selector: 'header' },
        { role: 'navigation', selector: 'nav' },
        { role: 'main', selector: 'main' },
        { role: 'contentinfo', selector: 'footer' },
    ];

    landmarksToCheck.forEach(({ role, selector }) => {
        const elements = Array.from(document.querySelectorAll(selector)) as HTMLElement[];

        if (elements.length > 1) {
            elements.forEach((el, index) => {
                const hasAriaLabel =
                    el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby');

                if (!hasAriaLabel) {
                    console.error(
                        `❌ Multiple <${selector}> elements found (${elements.length}). Element ${
                            index + 1
                        } is missing aria-label or aria-labelledby. Role: ${role}`
                    );
                    el.style.outline = '2px dashed orange';
                    el.title = `❌ Duplicate <${selector}> without aria-label`;
                } else {
                    console.warn(
                        `ℹ️ Duplicate <${selector}> with aria-label or aria-labelledby: OK`
                    );
                }
            });
        } else {
            console.error(`❌ Missing <${selector}> landmark role: ${role}`);
        }
    });
}