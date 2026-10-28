import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import type { IssueData } from '../core/seoAccessibilityTool';
import type { PageReport } from './report';

/** The ids of the issues accepted on each page, by URL. */
export type Baseline = Record<string, string[]>;

/** What a page has compared with the baseline: the issues that aren't in it, the ids that went away. */
export interface BaselineChanges {
    new: IssueData[];
    fixed: string[];
}

export function readBaseline(file: string): Baseline | undefined {
    if (!existsSync(file)) return undefined;
    const data = JSON.parse(readFileSync(file, 'utf8')) as unknown;
    if (!data || typeof data !== 'object' || Array.isArray(data) || !Object.values(data).every((ids) => Array.isArray(ids))) {
        throw new Error(`${file} is not a SAT baseline: expected { "<url>": ["<issue id>", …] }.`);
    }
    return data as Baseline;
}

/** The baseline of these pages; the other URLs of `previous` stay. */
export function writeBaseline(file: string, pages: PageReport[], previous: Baseline = {}): void {
    const baseline = { ...previous, ...Object.fromEntries(pages.map((page) => [page.url, page.issues.map((issue) => issue.id)])) };
    writeFileSync(file, `${JSON.stringify(baseline, null, 2)}\n`);
}

export function compareBaseline(page: PageReport, baseline: Baseline): BaselineChanges {
    const accepted = new Set(baseline[page.url] ?? []);
    const now = new Set(page.issues.map((issue) => issue.id));
    return { new: page.issues.filter((issue) => !accepted.has(issue.id)), fixed: [...accepted].filter((id) => !now.has(id)) };
}
