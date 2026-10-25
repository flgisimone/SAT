// npm run smoke: packs SAT as npm would publish it (npm pack), installs the tarball in a copy of
// each folder of examples/ and checks that the example works as its README says.
// - the tarball has LICENSE, README.md, CHANGELOG.md and dist/ only, and every file package.json points to;
// - no optional peer dependency gets installed where the example doesn't ask for it;
// - examples with a "dev" script: `vite build` works, and in `vite dev` the panel shows the counts of expected.json;
// - examples with a "check" script: `npm run check` exits with 1 and its JSON report has exactly the issues of expected.json.
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const EXAMPLES = join(ROOT, 'examples');
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const pkg = readJson(join(ROOT, 'package.json'));
const expected = readJson(join(EXAMPLES, 'page/expected.json'));

const run = (command, args, cwd) => execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

/** Differences between the issues found and expected.json, by rule, severity and selector. */
function compareIssues(issues) {
    const key = ({ ruleId, severity, selector }) => JSON.stringify({ ruleId, severity, selector: selector ?? null });
    const found = issues.map(key);
    const wanted = expected.issues.map(key);
    const missing = wanted.filter((issue) => !found.includes(issue));
    const extra = found.filter((issue) => !wanted.includes(issue));
    if (missing.length || extra.length) {
        throw new Error(`issues differ from expected.json\n  missing: ${missing.join(', ') || '-'}\n  extra: ${extra.join(', ') || '-'}`);
    }
}

function checkTarball(files) {
    const always = ['LICENSE', 'README.md', 'CHANGELOG.md'];
    const unexpected = files.filter((file) => !file.startsWith('dist/') && file !== 'package.json' && !always.includes(file));
    const targets = [pkg.main, pkg.types, ...Object.values(pkg.bin), ...Object.values(pkg.exports).flatMap(Object.values)];
    const missing = [...new Set([...always, ...targets.map((target) => target.replace(/^\.\//, ''))])].filter((file) => !files.includes(file));
    if (unexpected.length) throw new Error(`tarball: files that shouldn't be published: ${unexpected.join(', ')}`);
    if (missing.length) throw new Error(`tarball: missing ${missing.join(', ')}`);
}

function checkPeers(dir, own) {
    const asked = { ...own.dependencies, ...own.devDependencies };
    const installed = Object.keys(pkg.peerDependencies).filter((peer) => !(peer in asked) && existsSync(join(dir, 'node_modules', peer, 'package.json')));
    if (installed.length) throw new Error(`${installed.join(', ')} installed without being asked for: is the peer dependency still optional?`);
}

function freePort() {
    return new Promise((resolve) => {
        const server = createServer().listen(0, '127.0.0.1', () => {
            const { port } = server.address();
            server.close(() => resolve(port));
        });
    });
}

async function waitForServer(url, server, log) {
    for (const start = Date.now(); Date.now() - start < 30_000; await new Promise((resolve) => setTimeout(resolve, 200))) {
        if (server.exitCode !== null) throw new Error(`vite exited:\n${log()}`);
        if (await fetch(url).then((response) => response.ok, () => false)) return;
    }
    throw new Error(`vite didn't answer at ${url}:\n${log()}`);
}

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

async function checkPanel(dir, browser) {
    const port = await freePort();
    const url = `http://127.0.0.1:${port}/`;
    const server = spawn(join(dir, 'node_modules/.bin/vite'), ['--port', String(port), '--strictPort', '--host', '127.0.0.1'], { cwd: dir });
    let output = '';
    server.stdout.on('data', (data) => { output += data; });
    server.stderr.on('data', (data) => { output += data; });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    try {
        await waitForServer(url, server, () => output);
        await page.goto(url);
        await page.locator('#sat-run-button').click({ timeout: 20_000 });
        const errorCount = expected.issues.filter((issue) => issue.severity === 'error').length;
        const counts = `${plural(errorCount, 'error')} · ${plural(expected.issues.length - errorCount, 'warning')}`;
        const results = page.locator('.results');
        await results.filter({ hasText: new RegExp(`^${counts}$`) }).waitFor({ timeout: 20_000 }).catch(async () => {
            const shown = await results.first().textContent({ timeout: 1000 }).catch(() => 'no panel');
            throw new Error(`the panel shows "${shown}", expected "${counts}"${errors.length ? `\n  page errors: ${errors.join('\n  ')}` : ''}`);
        });
    } finally {
        await page.close();
        server.kill();
    }
}

function checkCli(dir) {
    run('npx', ['playwright', 'install', 'chromium'], dir);
    const result = spawnSync('npm', ['run', 'check', '--silent'], { cwd: dir, encoding: 'utf8' });
    const output = `${result.stdout}${result.stderr}`;
    if (result.status !== 1) throw new Error(`npm run check: exit code ${result.status}, expected 1\n${output}`);
    if (!existsSync(join(dir, 'sat-report.json'))) throw new Error(`npm run check wrote no report\n${output}`);
    compareIssues(readJson(join(dir, 'sat-report.json')).pages[0].issues);
    if (!readFileSync(join(dir, 'sat-report.html'), 'utf8').includes('<html')) throw new Error('sat-report.html is not an HTML page');
}

const work = mkdtempSync(join(tmpdir(), 'sat-smoke-'));
const failures = [];
const browser = await chromium.launch();
try {
    const [packed] = JSON.parse(run('npm', ['pack', '--json', '--pack-destination', work], ROOT));
    const tarball = join(work, packed.filename);
    try {
        checkTarball(packed.files.map((file) => file.path));
        console.log(`ok   ${packed.filename} (${packed.files.length} files)`);
    } catch (error) {
        failures.push(error.message);
    }

    const examples = readdirSync(EXAMPLES).filter((name) => existsSync(join(EXAMPLES, name, 'package.json')));
    for (const name of examples) {
        const dir = join(work, name);
        try {
            cpSync(join(EXAMPLES, name), dir, { recursive: true, filter: (source) => !/[\\/](node_modules|dist|sat-report\.\w+)$/.test(source) });
            const own = readJson(join(dir, 'package.json'));
            run('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error', tarball], dir);
            checkPeers(dir, own);
            if (own.scripts.build) run('npm', ['run', 'build', '--silent'], dir);
            if (own.scripts.dev) await checkPanel(dir, browser);
            if (own.scripts.check) checkCli(dir);
            console.log(`ok   ${name}`);
        } catch (error) {
            failures.push(`${name}: ${error.message}`);
            console.log(`FAIL ${name}`);
        }
    }
} finally {
    await browser.close();
}

if (failures.length) {
    console.error(`\n${failures.join('\n\n')}\n\nThe copies are in ${work}`);
    process.exitCode = 1;
} else {
    rmSync(work, { recursive: true, force: true });
}
