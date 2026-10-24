import { describeElement, getExplicitName, isHiddenFromAssistiveTech, queryTargets, tabIndexValue } from "../../../sat/satDom";
import type { Rule } from "../rule";

/**
 * Frames reachable with Tab have an accessible name (ACT cae760, WCAG 4.1.2): title, aria-label or
 * aria-labelledby. The name attribute is not one. Frames hidden from assistive technologies, with
 * tabindex="-1" or role="none"/"presentation" are skipped.
 */
export const iframeName: Rule = {
    id: 'iframe-name',
    category: 'a11y',
    defaultSeverity: 'error',
    wcag: ['4.1.2'],
    run({ document, report }) {
        queryTargets<HTMLIFrameElement>('iframe', document).forEach((frame) => {
            const role = frame.getAttribute('role')?.trim().toLowerCase();
            if (role === 'none' || role === 'presentation') return;
            if ((tabIndexValue(frame) ?? 0) < 0 || isHiddenFromAssistiveTech(frame) || getExplicitName(frame)) return;

            report({
                element: frame,
                message: `<iframe> without an accessible name: ${describeElement(frame)}${frame.src ? ` (${frame.getAttribute('src')})` : ''}. Add a title that describes its content, e.g. title="Map of the office".`,
            });
        });
    },
};
