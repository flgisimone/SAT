import { describeElement, queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";
import { GOOGLE_TYPES, NESTED_TYPES, type Requirements } from "./google-structured-data";

type Json = null | boolean | number | string | Json[] | JsonObject;
type JsonObject = { [key: string]: Json };

function isObject(value: Json | undefined): value is JsonObject {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

/** The entities of a JSON-LD block: the top-level object, the items of an array, or of `@graph`. */
function entities(data: Json): Json[] {
    if (Array.isArray(data)) return data.flatMap(entities);
    if (isObject(data) && !('@type' in data) && Array.isArray(data['@graph'])) return data['@graph'];
    return [data];
}

/** `@type` as a list of schema.org names (`https://schema.org/Product` → `Product`). */
function types(node: JsonObject): string[] {
    const type = node['@type'];
    return (Array.isArray(type) ? type : [type])
        .filter((name): name is string => typeof name === 'string')
        .map((name) => name.replace(/^(https?:\/\/schema\.org\/|schema:)/, ''));
}

function list(items: string[]): string {
    return items.length > 1 ? `${items.slice(0, -1).join(', ')} or ${items[items.length - 1]}` : items[0];
}

/**
 * JSON-LD structured data (`<script type="application/ld+json">`), errors because Google drops the block
 * or shows no rich result: invalid JSON (with the parser's position), entities without `@type`, and the
 * properties Google requires for the types in `google-structured-data.ts`. Nodes with the same `@id`,
 * in any block of the page, are one node. Recommended properties are not checked.
 */
export const structuredData: Rule = {
    id: 'structured-data',
    title: 'Structured data is complete',
    source: 'Google',
    category: 'seo',
    defaultSeverity: 'error',
    run({ document, report }) {
        const found: { script: HTMLScriptElement; node: Json }[] = [];
        queryTargets<HTMLScriptElement>('script[type="application/ld+json" i]', document).forEach((script) => {
            try {
                entities(JSON.parse(script.textContent ?? '')).forEach((node) => found.push({ script, node }));
            } catch (error) {
                // V8 and Firefox include the position ("at position 7 (line 1 column 8)"); Safari doesn't.
                const detail = error instanceof Error ? error.message : String(error);
                report({ element: script, message: `Invalid JSON-LD in ${describeElement(script)}: ${detail}.` });
            }
        });

        const byId = new Map<string, JsonObject>();
        found.forEach(({ node }) => {
            const id = isObject(node) ? node['@id'] : undefined;
            if (isObject(node) && typeof id === 'string') byId.set(id, { ...byId.get(id), ...node });
        });
        const resolve = (node: JsonObject): JsonObject => {
            const id = node['@id'];
            return typeof id === 'string' && byId.has(id) ? { ...byId.get(id), ...node } : node;
        };

        /** True when the path leads to a value; in an array one item is enough. */
        const has = (value: Json | undefined, path: string[]): boolean => {
            if (Array.isArray(value)) return value.some((item) => has(item, path));
            if (!path.length) return value !== undefined && value !== null && value !== '';
            return isObject(value) && has(resolve(value)[path[0]], path.slice(1));
        };

        const check = (script: HTMLScriptElement, node: JsonObject, requirements: Requirements, label: string, last: boolean) => {
            requirements.required.forEach((alternatives) => {
                if (last && alternatives.every((path) => requirements.notRequiredOnLast?.includes(path))) return;
                if (alternatives.some((path) => has(node, path.split('.')))) return;
                const paths = alternatives.map((path) => path.split('.').join(' > '));
                report({
                    element: script,
                    message: `Missing ${label} > ${list(paths)} in JSON-LD ${describeElement(script)}: Google requires it for rich results (${requirements.page}).`,
                });
            });
            requirements.nested?.forEach((property) => {
                const value = node[property];
                const items = Array.isArray(value) ? value : [value];
                items.forEach((item, index) => {
                    if (!isObject(item)) return;
                    const child = resolve(item);
                    const childLabel = `${label} > ${property}${items.length > 1 ? `[${index}]` : ''}`;
                    new Set(types(child).map((type) => NESTED_TYPES[type]).filter(Boolean))
                        .forEach((nested) => check(script, child, nested, childLabel, index === items.length - 1));
                });
            });
        };

        const untyped = new Map<HTMLScriptElement, number>();
        const checked = new Set<string>();
        found.forEach(({ script, node }) => {
            const merged = isObject(node) ? resolve(node) : undefined;
            if (!merged || !types(merged).length) {
                untyped.set(script, (untyped.get(script) ?? 0) + 1);
                return;
            }
            const id = merged['@id'];
            if (typeof id === 'string') {
                if (checked.has(id)) return;
                checked.add(id);
            }
            const matches = new Map<Requirements, string>();
            types(merged).forEach((type) => {
                const requirements = GOOGLE_TYPES[type];
                if (requirements && !matches.has(requirements)) matches.set(requirements, type);
            });
            matches.forEach((type, requirements) => check(script, merged, requirements, type, false));
        });
        untyped.forEach((count, script) => {
            report({ element: script, message: `JSON-LD in ${describeElement(script)}: ${count} item(s) without "@type".` });
        });
    },
};
