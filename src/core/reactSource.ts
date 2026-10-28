// File and line of the JSX that rendered an element, in React development builds, without changing the app:
// React 19 keeps on each fiber the stack of the jsxDEV call that created it (`_debugStack`); the frame below
// jsxDEV is the component's module as the dev server serves it, and its source map gives the line in the source.
// React 18 has the source position on the fiber (`_debugSource`).

interface Fiber {
    _debugStack?: { stack?: string };
    _debugSource?: { fileName?: string; lineNumber?: number };
}

interface Position {
    /** Address of the module as the browser loaded it. */
    url: string;
    line: number;
    column: number;
}

/** `file:line` of each generated position already mapped, by `url:line:column`. */
const mapped = new Map<string, string>();
/** Modules already looked up (or being looked up), by address: each is fetched once. */
const modules = new Map<string, Promise<void>>();
/** Source maps of the modules, by address. */
const maps = new Map<string, { mappings?: string }>();

function fiberOf(element: Element): Fiber | undefined {
    const key = Object.keys(element).find((name) => name.startsWith('__reactFiber$'));
    return key ? (element as unknown as Record<string, Fiber>)[key] : undefined;
}

const FRAME = /((?:https?|file):\/\/[^\s()]+?):(\d+):(\d+)\)?$/;

/** The first frame of the app's code in the stack of the jsxDEV call: React's own frames are in node_modules. */
function jsxPosition(fiber: Fiber): Position | undefined {
    for (const line of fiber._debugStack?.stack?.split('\n').slice(1) ?? []) {
        const match = FRAME.exec(line.trim());
        if (!match || match[1].includes('/node_modules/')) continue;
        return { url: match[1], line: Number(match[2]), column: Number(match[3]) };
    }
    return undefined;
}

const key = ({ url, line, column }: Position) => `${url}:${line}:${column}`;

/** Path of the module on the dev server, e.g. /src/App.jsx: the file in the project. */
const modulePath = (url: string) => new URL(url).pathname;

/**
 * `file:line` of the JSX that rendered `element` (React 18 and 19 in development), or just the file while
 * `prepareReactSources` has not mapped the line yet. Undefined for elements React didn't render.
 */
export function reactSource(element: Element): string | undefined {
    const fiber = fiberOf(element);
    if (!fiber) return undefined;
    const old = fiber._debugSource;
    if (old?.fileName) return old.lineNumber ? `${old.fileName}:${old.lineNumber}` : old.fileName;
    const position = jsxPosition(fiber);
    return position && (mapped.get(key(position)) ?? modulePath(position.url));
}

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** The numbers of one segment of `mappings` (Base64 VLQ). */
function decode(segment: string): number[] {
    const values: number[] = [];
    let value = 0;
    let shift = 0;
    for (const char of segment) {
        const digit = BASE64.indexOf(char);
        value += (digit & 31) << shift;
        if (digit & 32) {
            shift += 5;
        } else {
            values.push(value & 1 ? -(value >>> 1) : value >>> 1);
            value = shift = 0;
        }
    }
    return values;
}

/**
 * Line in the source (1-based) of a generated position (1-based line and column), from the `mappings` of a source map:
 * the last mapping at or before the column, else the first of the line.
 * ponytail: one source per map, as Vite serves each module; maps of bundles with many sources would need the source index.
 */
export function sourceLine(mappings: string, line: number, column: number): number | undefined {
    let original = 0;
    let found: number | undefined;
    const lines = mappings.split(';');
    for (let index = 0; index < line && index < lines.length; index++) {
        let generated = 0;
        for (const segment of lines[index].split(',')) {
            if (!segment) continue;
            const fields = decode(segment);
            generated += fields[0];
            if (fields.length < 4) continue;
            original += fields[2];
            if (index < line - 1) continue;
            if (found !== undefined && generated > column - 1) break;
            found = original + 1;
        }
    }
    return found;
}

/** The source map of a module: inline (`data:`, as Vite serves them) or at its own address. */
async function sourceMap(url: string): Promise<{ mappings?: string } | undefined> {
    const code = await (await fetch(url)).text();
    const reference = /\/\/# sourceMappingURL=(\S+)\s*$/.exec(code)?.[1];
    if (!reference) return undefined;
    const inline = /^data:application\/json;(?:charset=utf-8;)?base64,(.+)$/.exec(reference);
    if (inline) return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(inline[1]), (char) => char.charCodeAt(0)))) as { mappings?: string };
    return (await fetch(new URL(reference, url))).json() as Promise<{ mappings?: string }>;
}

/**
 * Maps the JSX positions of these elements to lines in the source, fetching each module's source map once
 * from the page's own server (the browser has the modules in its cache). Nothing to do without React in development;
 * a module of another origin, or one that can't be fetched, keeps just its file.
 */
export async function prepareReactSources(elements: Array<Element | undefined>): Promise<void> {
    const byModule = new Map<string, Position[]>();
    for (const element of elements) {
        for (let node: Element | null = element ?? null; node; node = node.parentElement) {
            const fiber = fiberOf(node);
            if (!fiber) continue;
            const position = !fiber._debugSource && jsxPosition(fiber);
            // Only the page's own server: the modules of the app, never another host.
            if (position && new URL(position.url).origin !== node.ownerDocument.location?.origin) break;
            if (position && !mapped.has(key(position))) byModule.set(position.url, [...(byModule.get(position.url) ?? []), position]);
            break;
        }
    }
    await Promise.all(Array.from(byModule, async ([url, positions]) => {
        if (!modules.has(url)) modules.set(url, sourceMap(url).then((map) => void (map && maps.set(url, map)), () => undefined));
        await modules.get(url);
        const mappings = maps.get(url)?.mappings;
        if (!mappings) return;
        for (const position of positions) {
            const line = sourceLine(mappings, position.line, position.column);
            if (line) mapped.set(key(position), `${modulePath(url)}:${line}`);
        }
    }));
}
