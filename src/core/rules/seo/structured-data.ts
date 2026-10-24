import { describeElement, queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

/** The entities of a JSON-LD block: the top-level object, the items of an array, or of `@graph`. */
function entities(data: Json): Json[] {
    if (Array.isArray(data)) return data.flatMap(entities);
    if (data && typeof data === 'object' && !('@type' in data) && Array.isArray(data['@graph'])) return data['@graph'];
    return [data];
}

/**
 * JSON-LD structured data (`<script type="application/ld+json">`), errors because search engines
 * drop the block: invalid JSON (with the parser's position) and entities without `@type`.
 * Properties required by each type are not checked: use the Rich Results Test for those.
 */
export const structuredData: Rule = {
    id: 'structured-data',
    category: 'seo',
    defaultSeverity: 'error',
    run({ document, report }) {

        queryTargets<HTMLScriptElement>('script[type="application/ld+json" i]', document).forEach((script) => {
            let data: Json;
            try {
                data = JSON.parse(script.textContent ?? '');
            } catch (error) {
                // V8 and Firefox include the position ("at position 7 (line 1 column 8)"); Safari doesn't.
                const detail = error instanceof Error ? error.message : String(error);
                report({ element: script, message: `Invalid JSON-LD in ${describeElement(script)}: ${detail}.` });
                return;
            }

            const untyped = entities(data).filter((entity) => !entity || typeof entity !== 'object' || Array.isArray(entity) || !entity['@type']);
            if (untyped.length) {
                report({ element: script, message: `JSON-LD in ${describeElement(script)}: ${untyped.length} item(s) without "@type".` });
            }
        });
    },
};
