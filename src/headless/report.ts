import type { IssueData, SATReport } from '../core/seoAccessibilityTool';

/** The result of one page checked by the CLI. */
export interface PageReport extends SATReport {
    url: string;
}

/** One issue per entry: severity, rule, message, then the selector on its own line. */
export function formatIssues(issues: IssueData[]): string {
    return issues.map((issue) => {
        const head = `  ${issue.severity.padEnd(8)}${issue.ruleId.padEnd(22)}${issue.message}`;
        return issue.selector ? `${head}\n${' '.repeat(30)}${issue.selector}` : head;
    }).join('\n');
}

export function plural(count: number, word: string): string {
    return `${count} ${word}${count === 1 ? '' : 's'}`;
}

export function totals(pages: PageReport[]): SATReport['summary'] {
    return pages.reduce((sum, page) => ({ errors: sum.errors + page.summary.errors, warnings: sum.warnings + page.summary.warnings }), { errors: 0, warnings: 0 });
}

const escapeHtml = (text: string) => text.replace(/[&<>"]/g, (char) => `&#${char.charCodeAt(0)};`);

/** A standalone HTML page: one table of issues per page checked. */
export function htmlReport(pages: PageReport[]): string {
    const { errors, warnings } = totals(pages);
    const sections = pages.map((page) => {
        const rows = page.issues.map((issue) => `<tr class="${issue.severity}"><td>${issue.severity}</td>`
            + `<td>${issue.help ? `<a href="${escapeHtml(issue.help)}">${escapeHtml(issue.ruleId)}</a>` : escapeHtml(issue.ruleId)}</td>`
            + `<td>${escapeHtml(issue.message)}</td><td><code>${escapeHtml(issue.selector ?? '')}</code></td></tr>`).join('\n');
        const body = rows ? `<table><thead><tr><th>Severity</th><th>Rule</th><th>Message</th><th>Selector</th></tr></thead><tbody>\n${rows}\n</tbody></table>` : '<p>No issues.</p>';
        return `<section><h2>${escapeHtml(page.url)}</h2><p>${plural(page.summary.errors, 'error')}, ${plural(page.summary.warnings, 'warning')}</p>\n${body}</section>`;
    }).join('\n');

    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>SAT report</title>
<style>
:root { color-scheme: light dark; font-family: system-ui, sans-serif; }
body { margin: 0 auto; max-width: 72rem; padding: 1rem; }
table { border-collapse: collapse; width: 100%; }
th, td { border-bottom: 1px solid #8884; padding: .4rem; text-align: left; vertical-align: top; }
tr.error td:first-child { color: #d32f2f; font-weight: 600; }
tr.warning td:first-child { color: #b26a00; font-weight: 600; }
code { word-break: break-all; }
</style></head><body>
<h1>SAT report</h1>
<p>${plural(pages.length, 'page')}, ${plural(errors, 'error')}, ${plural(warnings, 'warning')}</p>
${sections}
</body></html>
`;
}
