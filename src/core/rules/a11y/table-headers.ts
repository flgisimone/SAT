import { describeElement, isHiddenFromAssistiveTech, queryTargets } from "../../../sat/satDom";
import { explicitRole } from "../aria";
import type { Rule } from "../rule";

const TABLE_ROLES = ['table', 'grid', 'treegrid'];
const CELL_ROLES = ['cell', 'gridcell', 'columnheader', 'rowheader'];

/** A cell placed in the table grid, spans included. */
interface Slot {
    cell: Element;
    row: number;
    col: number;
    rows: number;
    cols: number;
}

type HeaderScope = 'column' | 'row' | null;

/** True for <table> elements and ARIA tables whose role keeps them tables. */
function isTable(el: Element): boolean {
    const role = explicitRole(el);
    return role ? TABLE_ROLES.includes(role) : el.tagName === 'TABLE';
}

/** The table grid (HTML table model, simplified): every cell with its position and spans. */
function tableSlots(table: Element): Slot[] {
    const rows: Element[][] = table.tagName === 'TABLE'
        ? Array.from((table as HTMLTableElement).rows, (row) => Array.from(row.cells))
        : queryTargets('[role="row" i]', table)
            .filter((row) => row.parentElement?.closest('table, [role]:is([role~="table" i], [role~="grid" i], [role~="treegrid" i])') === table)
            .map((row) => Array.from(row.children).filter((cell) => CELL_ROLES.includes(explicitRole(cell) ?? '')));

    const taken: boolean[][] = [];
    const slots: Slot[] = [];
    rows.forEach((cells, row) => {
        let col = 0;
        cells.forEach((cell) => {
            while (taken[row]?.[col]) col++;
            const cols = Math.max(1, (cell as HTMLTableCellElement).colSpan || 1);
            const span = (cell as HTMLTableCellElement).rowSpan;
            const rowSpan = span === 0 ? rows.length - row : Math.max(1, span || 1);
            for (let r = row; r < row + rowSpan; r++) {
                taken[r] ??= [];
                for (let c = col; c < col + cols; c++) taken[r][c] = true;
            }
            slots.push({ cell, row, col, rows: rowSpan, cols });
            col += cols;
        });
    });
    return slots;
}

function isHeaderCell(cell: Element): boolean {
    const role = explicitRole(cell);
    if (role) return role === 'columnheader' || role === 'rowheader';
    return cell.tagName === 'TH';
}

/** Column or row header (HTML "column header"/"row header"); null when the table model can't tell. */
function headerScope(slot: Slot, slots: Slot[]): HeaderScope {
    const role = explicitRole(slot.cell);
    if (role === 'columnheader') return 'column';
    if (role === 'rowheader') return 'row';
    const scope = slot.cell.getAttribute('scope')?.trim().toLowerCase();
    if (scope === 'col' || scope === 'colgroup') return 'column';
    if (scope === 'row' || scope === 'rowgroup') return 'row';

    const inRows = (other: Slot) => other.row < slot.row + slot.rows && slot.row < other.row + other.rows;
    const inCols = (other: Slot) => other.col < slot.col + slot.cols && slot.col < other.col + other.cols;
    if (!slots.some((other) => inRows(other) && !isHeaderCell(other.cell))) return 'column';
    if (!slots.some((other) => inCols(other) && !isHeaderCell(other.cell))) return 'row';
    return null;
}

/**
 * True when some cell is assigned to the header: through its headers attribute, or, for cells
 * without one, by sharing the header's columns (column header) or rows (row header).
 * Cells on either side count, so right-to-left tables and footers are not reported.
 */
function hasAssignedCells(header: Slot, scope: Exclude<HeaderScope, null>, slots: Slot[]): boolean {
    const id = header.cell.id;
    // scope="rowgroup": the header covers its row and the rows below it in the same row group (HTML "row group header").
    const group = header.cell.getAttribute('scope')?.trim().toLowerCase() === 'rowgroup' ? header.cell.closest('thead, tbody, tfoot') : null;
    return slots.some((other) => {
        if (other === header) return false;
        const headers = other.cell.getAttribute('headers')?.trim();
        if (headers) return !!id && headers.split(/\s+/).includes(id);
        if (group && other.row >= header.row && other.cell.closest('thead, tbody, tfoot') === group) return true;
        return scope === 'column'
            ? other.col < header.col + header.cols && header.col < other.col + other.cols
            : other.row < header.row + header.rows && header.row < other.row + other.rows;
    });
}

/**
 * Data tables relate cells and headers (WCAG 1.3.1):
 * - ACT a25f45: every ID in a headers attribute is another cell of the same table;
 * - ACT d0f69e: every header cell has cells assigned to it (no empty column or row under a header);
 *   a row group header (scope="rowgroup") covers the rows of its group, and a header with a collapsed
 *   disclosure (aria-expanded="false") is skipped, its rows appear when it opens.
 * Tables with role="presentation" (or another non-table role) and hidden tables or headers are skipped.
 */
export const tableHeaders: Rule = {
    id: 'table-headers',
    title: 'Table headers match their cells',
    category: 'a11y',
    defaultSeverity: 'error',
    wcag: ['1.3.1'],
    run({ document, report }) {
        queryTargets('table, [role]', document).forEach((table) => {
            if (!isTable(table) || isHiddenFromAssistiveTech(table)) return;
            const slots = tableSlots(table);

            if (table.tagName === 'TABLE') {
                slots.filter(({ cell }) => cell.getAttribute('headers')?.trim()).forEach(({ cell }) => {
                    const wrong = cell.getAttribute('headers')!.trim().split(/\s+/).filter((id) => {
                        const target = document.getElementById(id);
                        return !target || target === cell || !slots.some((slot) => slot.cell === target);
                    });
                    if (wrong.length === 0) return;
                    report({
                        element: cell,
                        message: `headers="${cell.getAttribute('headers')}" on ${describeElement(cell)} points to ${wrong.map((id) => `"${id}"`).join(', ')}, which ${wrong.length > 1 ? 'are not other cells' : 'is not another cell'} of the same table.`,
                    });
                });
            }

            slots.forEach((slot) => {
                if (!isHeaderCell(slot.cell) || isHiddenFromAssistiveTech(slot.cell)) return;
                const scope = headerScope(slot, slots);
                if (!scope || hasAssignedCells(slot, scope, slots)) return;
                // A collapsed group (a disclosure with aria-expanded="false" in the header) has its rows only once opened.
                if (slot.cell.querySelector('[aria-expanded="false" i]')) return;
                report({
                    element: slot.cell,
                    message: `Header cell ${describeElement(slot.cell)} has no cells in its ${scope}. Add the data cells, or make it a normal cell if it isn't a header.`,
                });
            });
        });
    },
};
