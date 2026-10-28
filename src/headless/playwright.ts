import { expect as baseExpect, type Expect, type Page } from '@playwright/test';
import type { SATOptions, SATReport } from '../core/seoAccessibilityTool';
import { addSAT } from './addSAT';
import { formatIssues, plural } from './report';

export type { SATReport, IssueData } from '../core/seoAccessibilityTool';

/** SAT options that can cross into the page (no functions), plus `axe` to run axe-core too. */
export interface CheckPageOptions extends Omit<SATOptions, 'engines' | 'enabled' | 'observeDom'> {
    /** Adds axe-core (an optional peer dependency) to the page and runs it as an engine. */
    axe?: boolean;
}

/**
 * Runs SAT in the page as it is now, in its browser, and returns the issues with their selectors.
 * SAT is added to the page for the run; the page needs no SAT import and is not changed otherwise.
 */
export async function checkPage(page: Page, options: CheckPageOptions = {}): Promise<SATReport> {
    const { axe = false, ...satOptions } = options;
    await addSAT(page, axe);
    return page.evaluate(([opts, useAxe]) => window.__sat!.run(opts, useAxe), [satOptions, axe] as const);
}

const matchers = {
    async toHaveNoSATErrors(page: Page, options: CheckPageOptions = {}) {
        const { issues } = await checkPage(page, options);
        const errors = issues.filter((issue) => issue.severity === 'error');
        return {
            name: 'toHaveNoSATErrors',
            pass: errors.length === 0,
            message: () => (errors.length ? `Expected no SAT errors, found ${plural(errors.length, 'error')}:\n${formatIssues(errors)}` : 'Expected SAT errors, found none'),
        };
    },
};

/** Playwright's `expect` with `toHaveNoSATErrors()`: fails with the list of SAT errors on the page. */
export const expect: Expect<typeof matchers> = baseExpect.extend(matchers);
