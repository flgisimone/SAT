// @vitest-environment node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { hookCommand, init, type InitOptions } from '../src/headless/init';

// sat-check init in a temporary project.

let root: string;
const options = (more: Partial<InitOptions> = {}): InitOptions => ({ root, port: 5173, routes: ['/'], claude: false, dryRun: false, ...more });
const read = (file: string) => readFileSync(join(root, file), 'utf8');
const json = (file: string) => JSON.parse(read(file));

/** Every file of the project with its content. */
function snapshot(dir = root, prefix = ''): Record<string, string> {
    return Object.fromEntries(readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const path = join(dir, entry.name);
        return entry.isDirectory() ? Object.entries(snapshot(path, `${prefix}${entry.name}/`)) : [[`${prefix}${entry.name}`, readFileSync(path, 'utf8')]];
    }));
}

beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'sat-init-'));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('sat-check init', () => {
    it('gives the same result when run twice', () => {
        writeFileSync(join(root, 'vite.config.ts'), "import { defineConfig } from 'vite';\nimport vue from '@vitejs/plugin-vue';\n\nexport default defineConfig({\n  plugins: [vue()],\n});\n");
        mkdirSync(join(root, '.cursor'));
        mkdirSync(join(root, '.vscode'));

        init(options({ claude: true }));
        const first = snapshot();
        const again = init(options({ claude: true }));

        expect(snapshot()).toEqual(first);
        expect(again.every(({ action }) => action === 'unchanged')).toBe(true);
        expect(first['vite.config.ts']).toBe("import { sat } from 'seo-accessibility-tool/vite';\nimport { defineConfig } from 'vite';\nimport vue from '@vitejs/plugin-vue';\n\nexport default defineConfig({\n  plugins: [sat({ mcp: true }), vue()],\n});\n");
        expect(json('.mcp.json')).toEqual({ mcpServers: { sat: { type: 'http', url: 'http://localhost:5173/__sat/mcp' } } });
        expect(json('.cursor/mcp.json')).toEqual({ mcpServers: { sat: { url: 'http://localhost:5173/__sat/mcp' } } });
        expect(json('.vscode/mcp.json')).toEqual({ servers: { sat: { type: 'http', url: 'http://localhost:5173/__sat/mcp' } } });
        expect(first['.claude/skills/sat/SKILL.md']).toMatch(/^---\nname: sat\ndescription: /);
        expect(json('.claude/settings.json').hooks.PostToolUse).toEqual([
            { matcher: 'Edit|Write|MultiEdit', hooks: [{ type: 'command', command: 'npx --no-install sat-check hook --port 5173 /', timeout: 60 }] },
        ]);
    });

    it('keeps the rest of AGENTS.md, CLAUDE.md and the JSON files, and updates only the SAT parts', () => {
        writeFileSync(join(root, 'AGENTS.md'), '# Rules\n\nUse tabs.\n');
        writeFileSync(join(root, 'CLAUDE.md'), '# Claude\n\nBe brief.\n');
        writeFileSync(join(root, '.mcp.json'), JSON.stringify({ mcpServers: { db: { command: 'db-mcp' } } }));
        mkdirSync(join(root, '.claude'));
        writeFileSync(join(root, '.claude/settings.json'), JSON.stringify({ permissions: { allow: ['Bash(npm test)'] }, hooks: { PostToolUse: [{ matcher: 'Write', hooks: [{ type: 'command', command: 'prettier' }] }] } }));

        init(options({ claude: true, port: 3000, routes: ['/', '/cart'] }));

        const agents = read('AGENTS.md');
        expect(agents.startsWith('# Rules\n\nUse tabs.\n\n<!-- sat:start -->\n## Accessibility and SEO: SAT')).toBe(true);
        expect(agents).toContain('http://localhost:3000/__sat/mcp');
        expect(read('CLAUDE.md')).toBe('# Claude\n\nBe brief.\n\n<!-- sat:start -->\nAccessibility and SEO checks with SAT: follow the SAT section of @AGENTS.md.\n<!-- sat:end -->\n');
        expect(json('.mcp.json').mcpServers).toEqual({ db: { command: 'db-mcp' }, sat: { type: 'http', url: 'http://localhost:3000/__sat/mcp' } });
        const settings = json('.claude/settings.json');
        expect(settings.permissions).toEqual({ allow: ['Bash(npm test)'] });
        expect(settings.hooks.PostToolUse.map((entry: { hooks: Array<{ command: string }> }) => entry.hooks[0].command)).toEqual(['prettier', hookCommand(3000, ['/', '/cart'])]);

        // A changed section is replaced, the text around it stays.
        writeFileSync(join(root, 'AGENTS.md'), agents.replace('## Accessibility and SEO: SAT', '## Old SAT text') + '\n## After\n');
        init(options({ port: 3000 }));
        expect(read('AGENTS.md')).toBe(`${agents}\n## After\n`);
    });

    it('leaves alone what it cannot change safely, and a CLAUDE.md that imports AGENTS.md', () => {
        writeFileSync(join(root, 'CLAUDE.md'), '@AGENTS.md\n');
        mkdirSync(join(root, '.vscode'));
        writeFileSync(join(root, '.vscode/mcp.json'), '{\n  // mine\n  "servers": {}\n}\n');
        writeFileSync(join(root, 'vite.config.js'), 'module.exports = { plugins: [a()], build: { rollupOptions: { plugins: [b()] } } };\n');

        const changes = init(options());

        expect(read('CLAUDE.md')).toBe('@AGENTS.md\n');
        expect(read('.vscode/mcp.json')).toBe('{\n  // mine\n  "servers": {}\n}\n');
        expect(changes).toContainEqual({ file: '.vscode/mcp.json', action: 'manual', detail: 'add "servers" → "sat": {"type":"http","url":"http://localhost:5173/__sat/mcp"}' });
        expect(changes).toContainEqual(expect.objectContaining({ file: 'vite.config.js', action: 'manual' }));
    });

    it('--dry-run says what would change and writes nothing', () => {
        writeFileSync(join(root, 'vite.config.ts'), "import { defineConfig } from 'vite';\nexport default defineConfig({ plugins: [] });\n");
        const before = snapshot();

        const changes = init(options({ claude: true, dryRun: true }));

        expect(snapshot()).toEqual(before);
        expect(existsSync(join(root, 'AGENTS.md'))).toBe(false);
        expect(changes.filter(({ action }) => action === 'create').map(({ file }) => file)).toEqual(['AGENTS.md', '.mcp.json', '.claude/skills/sat/SKILL.md', '.claude/settings.json']);
        expect(changes).toContainEqual(expect.objectContaining({ file: 'vite.config.ts', action: 'update' }));
    });
});
