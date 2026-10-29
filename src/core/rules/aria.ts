import { isInTabOrder, tabIndexValue } from '../../sat/satDom';
import { implicitRole } from './a11y/aria-roles';

/**
 * WAI-ARIA states and properties (1.2, plus the 1.3 draft ones browsers already support), without
 * the "aria-" prefix. Values are checked for the typed ones only: ID references and strings take
 * any value.
 */
type AttributeType = 'boolean' | 'token' | 'tokens' | 'integer' | 'number' | 'idref' | 'idrefs' | 'string';

interface AriaAttribute {
    type: AttributeType;
    values?: string[];
    global?: boolean;
}

const TRISTATE = ['false', 'mixed', 'true', 'undefined'];
const TRUE_FALSE_UNDEFINED = ['true', 'false', 'undefined'];

export const ARIA_ATTRIBUTES: Record<string, AriaAttribute> = {
    actions: { type: 'idrefs', global: true },
    activedescendant: { type: 'idref' },
    atomic: { type: 'boolean', global: true },
    autocomplete: { type: 'token', values: ['inline', 'list', 'both', 'none'] },
    braillelabel: { type: 'string', global: true },
    brailleroledescription: { type: 'string', global: true },
    busy: { type: 'boolean', global: true },
    checked: { type: 'token', values: TRISTATE },
    colcount: { type: 'integer' },
    colindex: { type: 'integer' },
    colindextext: { type: 'string' },
    colspan: { type: 'integer' },
    controls: { type: 'idrefs', global: true },
    current: { type: 'token', values: ['page', 'step', 'location', 'date', 'time', 'true', 'false'], global: true },
    describedby: { type: 'idrefs', global: true },
    description: { type: 'string', global: true },
    details: { type: 'idrefs', global: true },
    disabled: { type: 'boolean', global: true },
    dropeffect: { type: 'tokens', values: ['copy', 'execute', 'link', 'move', 'none', 'popup'], global: true },
    errormessage: { type: 'idrefs', global: true },
    expanded: { type: 'token', values: TRUE_FALSE_UNDEFINED },
    flowto: { type: 'idrefs', global: true },
    grabbed: { type: 'token', values: TRUE_FALSE_UNDEFINED, global: true },
    haspopup: { type: 'token', values: ['true', 'false', 'menu', 'listbox', 'tree', 'grid', 'dialog'], global: true },
    hidden: { type: 'token', values: TRUE_FALSE_UNDEFINED, global: true },
    invalid: { type: 'token', values: ['grammar', 'false', 'spelling', 'true'], global: true },
    keyshortcuts: { type: 'string', global: true },
    label: { type: 'string', global: true },
    labelledby: { type: 'idrefs', global: true },
    level: { type: 'integer' },
    live: { type: 'token', values: ['assertive', 'off', 'polite'], global: true },
    modal: { type: 'boolean' },
    multiline: { type: 'boolean' },
    multiselectable: { type: 'boolean' },
    orientation: { type: 'token', values: ['horizontal', 'undefined', 'vertical'] },
    owns: { type: 'idrefs', global: true },
    placeholder: { type: 'string' },
    posinset: { type: 'integer' },
    pressed: { type: 'token', values: TRISTATE },
    readonly: { type: 'boolean' },
    relevant: { type: 'tokens', values: ['additions', 'all', 'removals', 'text'], global: true },
    required: { type: 'boolean' },
    roledescription: { type: 'string', global: true },
    rowcount: { type: 'integer' },
    rowindex: { type: 'integer' },
    rowindextext: { type: 'string' },
    rowspan: { type: 'integer' },
    selected: { type: 'token', values: TRUE_FALSE_UNDEFINED },
    setsize: { type: 'integer' },
    sort: { type: 'token', values: ['ascending', 'descending', 'none', 'other'] },
    valuemax: { type: 'number' },
    valuemin: { type: 'number' },
    valuenow: { type: 'number' },
    valuetext: { type: 'string' },
};

interface RoleAttributes {
    /** Non-global states and properties the role supports or requires. */
    allowed: string;
    /** Required states and properties (WAI-ARIA 1.2), when no native state provides them. */
    required?: string;
    /** Global properties the role prohibits. */
    prohibited?: string;
}

const NAME_PROHIBITED = 'actions label labelledby braillelabel';

/** Concrete WAI-ARIA roles with the states and properties each one allows, requires or prohibits. */
export const ROLE_ATTRIBUTES: Record<string, RoleAttributes> = {
    alert: { allowed: 'expanded' },
    alertdialog: { allowed: 'expanded modal' },
    application: { allowed: 'activedescendant expanded' },
    article: { allowed: 'posinset setsize expanded' },
    banner: { allowed: 'expanded' },
    blockquote: { allowed: '' },
    button: { allowed: 'expanded pressed' },
    caption: { allowed: '', prohibited: NAME_PROHIBITED },
    cell: { allowed: 'colindex colindextext colspan rowindex rowindextext rowspan expanded' },
    checkbox: { allowed: 'checked readonly expanded required', required: 'checked' },
    code: { allowed: '', prohibited: NAME_PROHIBITED },
    columnheader: { allowed: 'sort colindex colindextext colspan expanded readonly required rowindex rowindextext rowspan selected' },
    combobox: { allowed: 'expanded controls owns autocomplete readonly required activedescendant orientation', required: 'expanded' },
    comment: { allowed: 'level posinset setsize' },
    complementary: { allowed: 'expanded' },
    contentinfo: { allowed: 'expanded' },
    definition: { allowed: 'expanded' },
    deletion: { allowed: '', prohibited: NAME_PROHIBITED },
    dialog: { allowed: 'expanded modal' },
    directory: { allowed: 'expanded' },
    document: { allowed: 'expanded' },
    emphasis: { allowed: '', prohibited: NAME_PROHIBITED },
    feed: { allowed: 'expanded' },
    figure: { allowed: 'expanded' },
    form: { allowed: 'expanded' },
    generic: { allowed: '', prohibited: `${NAME_PROHIBITED} roledescription brailleroledescription` },
    grid: { allowed: 'level multiselectable readonly activedescendant colcount expanded rowcount' },
    gridcell: { allowed: 'readonly required selected colindex colindextext colspan expanded rowindex rowindextext rowspan' },
    group: { allowed: 'activedescendant expanded' },
    heading: { allowed: 'level expanded', required: 'level' },
    image: { allowed: 'expanded' },
    img: { allowed: 'expanded' },
    insertion: { allowed: '', prohibited: NAME_PROHIBITED },
    link: { allowed: 'expanded' },
    list: { allowed: 'expanded' },
    listbox: { allowed: 'multiselectable readonly required activedescendant expanded orientation' },
    listitem: { allowed: 'level posinset setsize expanded' },
    log: { allowed: 'expanded' },
    main: { allowed: 'expanded' },
    mark: { allowed: '', prohibited: NAME_PROHIBITED },
    marquee: { allowed: 'expanded' },
    math: { allowed: 'expanded' },
    menu: { allowed: 'activedescendant expanded orientation' },
    menubar: { allowed: 'activedescendant expanded orientation' },
    menuitem: { allowed: 'posinset setsize expanded' },
    menuitemcheckbox: { allowed: 'checked expanded posinset readonly setsize', required: 'checked' },
    menuitemradio: { allowed: 'checked expanded posinset readonly setsize', required: 'checked' },
    meter: { allowed: 'valuenow valuemax valuemin valuetext', required: 'valuenow' },
    navigation: { allowed: 'expanded' },
    none: { allowed: '', prohibited: `${NAME_PROHIBITED} roledescription brailleroledescription` },
    note: { allowed: 'expanded' },
    option: { allowed: 'selected checked posinset setsize' },
    paragraph: { allowed: '', prohibited: NAME_PROHIBITED },
    presentation: { allowed: '', prohibited: `${NAME_PROHIBITED} roledescription brailleroledescription` },
    progressbar: { allowed: 'expanded valuemax valuemin valuenow valuetext' },
    radio: { allowed: 'checked posinset setsize required', required: 'checked' },
    radiogroup: { allowed: 'readonly required activedescendant expanded orientation' },
    region: { allowed: 'expanded' },
    row: { allowed: 'colindex level rowindex rowindextext selected activedescendant expanded posinset setsize' },
    rowgroup: { allowed: '' },
    rowheader: { allowed: 'sort colindex colindextext colspan expanded readonly required rowindex rowindextext rowspan selected' },
    scrollbar: { allowed: 'valuenow controls orientation valuemax valuemin valuetext', required: 'valuenow' },
    search: { allowed: 'expanded' },
    searchbox: { allowed: 'activedescendant autocomplete multiline placeholder readonly required' },
    sectionfooter: { allowed: '' },
    sectionheader: { allowed: '' },
    // aria-valuenow is required only on a focusable separator (a splitter): see requiredAttributes.
    separator: { allowed: 'valuenow valuemax valuemin orientation valuetext' },
    slider: { allowed: 'valuenow valuemax valuemin orientation readonly required valuetext', required: 'valuenow' },
    spinbutton: { allowed: 'valuemax valuemin readonly required activedescendant valuetext valuenow' },
    status: { allowed: 'expanded' },
    strong: { allowed: '', prohibited: NAME_PROHIBITED },
    subscript: { allowed: '', prohibited: NAME_PROHIBITED },
    suggestion: { allowed: '', prohibited: NAME_PROHIBITED },
    superscript: { allowed: '', prohibited: NAME_PROHIBITED },
    switch: { allowed: 'checked expanded readonly required', required: 'checked' },
    tab: { allowed: 'posinset selected setsize expanded' },
    table: { allowed: 'colcount rowcount expanded' },
    tablist: { allowed: 'level multiselectable orientation activedescendant expanded' },
    tabpanel: { allowed: 'expanded' },
    term: { allowed: 'expanded' },
    textbox: { allowed: 'activedescendant autocomplete multiline placeholder readonly required' },
    time: { allowed: '' },
    timer: { allowed: 'expanded' },
    toolbar: { allowed: 'orientation activedescendant expanded' },
    tooltip: { allowed: 'expanded' },
    tree: { allowed: 'multiselectable required activedescendant expanded orientation' },
    treegrid: { allowed: 'activedescendant colcount expanded level multiselectable orientation readonly required rowcount' },
    treeitem: { allowed: 'checked expanded level posinset selected setsize' },
};

const PRESENTATIONAL = ['none', 'presentation'];

/**
 * Elements with no implicit role in `implicitRole` whose HTML-AAM role is known: generic containers,
 * text-level roles. <audio> and <video> have no role, but ARIA in HTML allows on them the global
 * attributes (aria-label included) and those of the application role: they take its attribute set.
 */
const OTHER_IMPLICIT_ROLES: Record<string, string> = {
    div: 'generic', span: 'generic', b: 'generic', i: 'generic', u: 'generic', s: 'generic', small: 'generic',
    audio: 'application', video: 'application',
    p: 'paragraph', code: 'code', del: 'deletion', ins: 'insertion', em: 'emphasis', strong: 'strong',
    sub: 'subscript', sup: 'superscript', mark: 'mark',
};

/** The first role of the role attribute that WAI-ARIA defines, or null. */
export function explicitRole(el: Element): string | null {
    const roles = el.getAttribute('role')?.trim().toLowerCase().split(/\s+/) ?? [];
    return roles.find((role) => role in ROLE_ATTRIBUTES) ?? null;
}

/** True when the element has a role attribute whose roles are all unknown here (e.g. DPUB roles). */
export function hasUnknownRole(el: Element): boolean {
    return !!el.getAttribute('role')?.trim() && explicitRole(el) === null;
}

/** True when the element can take focus: in the tab order, or with any valid tabindex. */
export function isFocusable(el: Element): boolean {
    return isInTabOrder(el) || tabIndexValue(el) !== null;
}

/**
 * The role an element exposes: its explicit role, or the implicit one when there is none or when a
 * presentational role is ignored because the element is focusable (WAI-ARIA presentational roles
 * conflict resolution). Null when the role is not known here.
 */
export function semanticRole(el: Element): string | null {
    const explicit = explicitRole(el);
    if (explicit && !(PRESENTATIONAL.includes(explicit) && isFocusable(el))) return explicit;
    if (hasUnknownRole(el)) return null;

    const implicit = implicitRole(el);
    // <img alt=""> is presentational only without global ARIA attributes: decided by the caller.
    if (implicit === 'presentation') return null;
    if (implicit === 'cell' && el.closest('table')?.matches('[role~="grid" i], [role~="treegrid" i]')) return 'gridcell';
    if (implicit) return implicit;
    const tag = el.tagName.toLowerCase();
    if (tag === 'a') return 'generic';
    return OTHER_IMPLICIT_ROLES[tag] ?? null;
}
