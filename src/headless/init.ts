import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

// sat-check init: prepares a project for coding agents. It writes only the SAT section of a
// Markdown file (between the markers) and the `sat` key of a JSON file; the rest stays as it is.

const START = '<!-- sat:start -->';
const END = '<!-- sat:end -->';

export interface InitOptions {
    /** Folder of the project. */
    root: string;
    /** Port of `vite dev`, for the URL of the MCP server. */
    port: number;
    /** Routes the Claude Code hook checks after an edit. */
    routes: string[];
    /** Adds the Claude Code skill and hook. */
    claude: boolean;
    /** Says what would change, writes nothing. */
    dryRun: boolean;
}

export interface Change {
    file: string;
    /** `manual`: SAT can't change the file safely, `detail` says what to do. */
    action: 'create' | 'update' | 'unchanged' | 'manual';
    detail?: string;
}

const agentsSection = (url: string) => `${START}
## Accessibility and SEO: SAT

This project checks its pages with SAT (seo-accessibility-tool). Its MCP server, \`sat\`, runs inside \`vite dev\` at ${url}.

- After changing a page or a component (markup, styles, text), call \`sat_check\` with a route that shows it, e.g. \`/cart\`, and fix the issues you introduced before you finish. The answer starts with what was fixed, what is new and what remains.
- Before writing or fixing an image, a form field, a link, a heading, a dialog or another interactive element, read its rule with \`sat_rule\` (e.g. \`image-alt\`, \`form-label\`): it shows the patterns that pass.
- Each issue has a rule, a severity, a CSS selector, the element's HTML and, when SAT knows it, the component file: fix it there, with the smallest change.
- For the page the user has open in the browser (logged in, with their data), use \`sat_issues\`, then \`sat_recheck\` after a fix.
- Fix the source code. Don't patch the page in the DOM, don't turn rules off or lower their severity, and don't add roles or \`aria-*\` attributes only to silence an issue.
- If the \`sat\` tools don't answer, \`vite dev\` isn't running: say so instead of guessing.
${END}`;

const CLAUDE_SECTION = `${START}
Accessibility and SEO checks with SAT: follow the SAT section of @AGENTS.md.
${END}`;

const SKILL_HEAD = `---
name: sat
description: Accessibility and SEO with SAT. Use when writing or changing UI (components, markup, styles, text), when the user asks about accessibility, WCAG, ARIA or SEO tags, or when SAT reports issues.
---
`;

const SKILL_BODY = `${START}
# SAT: accessibility and SEO checks

SAT checks the pages served by \`vite dev\` through the \`sat\` MCP server. After each edit to a UI file a hook checks the routes of the project and tells you the issues that are new.

## Workflow

1. Before writing an element a rule covers, read the rule: \`sat_rule\` with its id.
2. After the change, \`sat_check\` with the route that shows it. Read *fixed*, *new* and *remaining* first.
3. Fix what is new, in the component file SAT names, then \`sat_check\` again.
4. Pages that need a login: ask the user to open them, then \`sat_issues\` and \`sat_recheck\`.

## The common fixes

| Rule | Fix |
|---|---|
| \`image-alt\` | \`alt\` that says what the image shows; \`alt=""\` for a decorative image |
| \`form-label\` | A \`<label for>\` for each field, or a label around it; a placeholder is not a label |
| \`accessible-name\` | Visible text in the button or link; for an icon only, \`aria-label\` |
| \`color-contrast\` | Darker text or lighter background, to 4.5:1 (3:1 for large text), in the design tokens if the project has them |
| \`link-text\` | Text that says where the link goes, not "click here" |
| \`heading-levels\` | No skipped levels: change the heading element, keep the look with CSS |
| \`html-lang\` | \`lang\` on \`<html>\`, in \`index.html\` or the layout |
| \`seo-meta\` | A unique \`<title>\` and \`<meta name="description">\` per page |

For any other rule, \`sat_rule\` has the full page.

## Don't

- Patch the DOM at run time, turn rules off or lower their severity in the SAT config.
- Add \`role\` or \`aria-*\` that the rule page doesn't ask for: native HTML first.
${END}
`;

/** Replaces the SAT section of a Markdown text, or adds it at the end. */
export function upsertSection(text: string, section: string): string {
    const start = text.indexOf(START);
    const end = text.indexOf(END, start);
    if (start !== -1 && end !== -1) return text.slice(0, start) + section + text.slice(end + END.length);
    return `${text.trimEnd()}${text.trim() ? '\n\n' : ''}${section}\n`;
}

function read(file: string): string | undefined {
    return existsSync(file) ? readFileSync(file, 'utf8') : undefined;
}

export function mcpUrl(port: number): string {
    return `http://localhost:${port}/__sat/mcp`;
}

/** The hook command for Claude Code: `npx --no-install` never downloads a package. */
export function hookCommand(port: number, routes: string[]): string {
    return `npx --no-install sat-check hook --port ${port} ${routes.join(' ')}`;
}

/**
 * Prepares the project: the SAT section of AGENTS.md (and CLAUDE.md), the MCP configuration of the
 * agents found in the project, `sat({ mcp: true })` in a simple Vite config and, with `claude`, the skill and the hook.
 */
export function init({ root, port, routes, claude, dryRun }: InitOptions): Change[] {
    const changes: Change[] = [];
    const url = mcpUrl(port);

    const write = (file: string, before: string | undefined, after: string) => {
        if (before === after) return changes.push({ file, action: 'unchanged' });
        changes.push({ file, action: before === undefined ? 'create' : 'update' });
        if (dryRun) return;
        mkdirSync(dirname(join(root, file)), { recursive: true });
        writeFileSync(join(root, file), after);
    };

    const section = (file: string, text: string, head = '') => {
        const before = read(join(root, file));
        write(file, before, upsertSection(before ?? head, text));
    };

    /** Sets `keys` (e.g. ["mcpServers", "sat"]) of a JSON file to `value`, keeping the rest. */
    const jsonKey = (file: string, keys: string[], value: unknown, update?: (current: unknown) => unknown) => {
        const before = read(join(root, file));
        let data: Record<string, unknown>;
        try {
            data = before === undefined ? {} : JSON.parse(before);
            if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('not an object');
        } catch {
            // JSON with comments, or not JSON: SAT doesn't rewrite it.
            return changes.push({ file, action: 'manual', detail: `add ${keys.map((key) => `"${key}"`).join(' → ')}: ${JSON.stringify(value)}` });
        }
        let target = data;
        for (const key of keys.slice(0, -1)) {
            const next = target[key];
            target = target[key] = next && typeof next === 'object' && !Array.isArray(next) ? next as Record<string, unknown> : {};
        }
        const last = keys.at(-1)!;
        target[last] = update ? update(target[last]) : value;
        const after = `${JSON.stringify(data, null, 2)}\n`;
        // Same content, other formatting: not a change.
        write(file, before !== undefined && JSON.stringify(JSON.parse(before)) === JSON.stringify(data) ? after : before, after);
    };

    section('AGENTS.md', agentsSection(url));
    const claudeMd = read(join(root, 'CLAUDE.md'));
    // A CLAUDE.md that imports AGENTS.md already reads the section.
    if (claudeMd !== undefined && (!claudeMd.includes('@AGENTS.md') || claudeMd.includes(START))) section('CLAUDE.md', CLAUDE_SECTION);

    // Claude Code always; VS Code reads .mcp.json too. The others when their folder is in the project.
    jsonKey('.mcp.json', ['mcpServers', 'sat'], { type: 'http', url });
    const has = (folder: string) => existsSync(join(root, folder));
    if (has('.cursor')) jsonKey('.cursor/mcp.json', ['mcpServers', 'sat'], { url });
    if (has('.vscode')) jsonKey('.vscode/mcp.json', ['servers', 'sat'], { type: 'http', url });
    if (has('.gemini')) jsonKey('.gemini/settings.json', ['mcpServers', 'sat'], { httpUrl: url });
    // ponytail: TOML without a parser; write it if a Codex user asks.
    if (has('.codex')) changes.push({ file: '.codex/config.toml', action: 'manual', detail: `add:\n[mcp_servers.sat]\nurl = "${url}"` });

    changes.push(viteConfig(root, dryRun));

    if (claude) {
        section('.claude/skills/sat/SKILL.md', SKILL_BODY.trimEnd(), SKILL_HEAD);
        const command = hookCommand(port, routes);
        const entry = { matcher: 'Edit|Write|MultiEdit', hooks: [{ type: 'command', command, timeout: 60 }] };
        jsonKey('.claude/settings.json', ['hooks', 'PostToolUse'], entry, (current) => {
            const list = Array.isArray(current) ? current as Array<{ hooks?: Array<{ command?: string }> }> : [];
            const ours = (item: (typeof list)[number]) => item.hooks?.some((hook) => hook.command?.includes('sat-check hook'));
            return list.some(ours) ? list.map((item) => (ours(item) ? entry : item)) : [...list, entry];
        });
    }
    return changes;
}

const VITE_CONFIGS = ['vite.config.ts', 'vite.config.mts', 'vite.config.js', 'vite.config.mjs'];
const PLUGIN_LINE = 'sat({ mcp: true })';

/** Adds `sat({ mcp: true })` to a Vite config with one `plugins: [` and one-line imports; otherwise says what to add. */
function viteConfig(root: string, dryRun: boolean): Change {
    const file = VITE_CONFIGS.find((name) => existsSync(join(root, name)));
    const howTo = `add import { sat } from "seo-accessibility-tool/vite" and ${PLUGIN_LINE} to the plugins, with server: { strictPort: true }`;
    if (!file) return { file: 'vite.config.*', action: 'manual', detail: `no Vite config found: ${howTo}` };
    const text = readFileSync(join(root, file), 'utf8');
    if (text.includes('seo-accessibility-tool/vite')) {
        return /mcp:\s*true/.test(text) ? { file, action: 'unchanged' } : { file, action: 'manual', detail: 'add mcp: true to the options of sat()' };
    }
    const firstImport = /^import .+ from (['"]).+\1;?$/m.exec(text);
    if (!firstImport || text.split('plugins: [').length !== 2) return { file, action: 'manual', detail: howTo };
    const quote = firstImport[1];
    const after = text
        .replace(firstImport[0], `import { sat } from ${quote}seo-accessibility-tool/vite${quote};\n${firstImport[0]}`)
        .replace(/plugins: \[(\s*\])?/, (_, empty?: string) => (empty ? `plugins: [${PLUGIN_LINE}]` : `plugins: [${PLUGIN_LINE}, `));
    if (!dryRun) writeFileSync(join(root, file), after);
    return { file, action: 'update', ...(!text.includes('strictPort') && { detail: 'add server: { strictPort: true }, so the MCP URL keeps its port' }) };
}
