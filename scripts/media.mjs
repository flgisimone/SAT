// npm run media: the README images, made again from the page with known issues (examples/page).
// Screenshots of the panel in both themes, the social image (1280×640) and a GIF of SAT at work,
// in docs/images/. Needs the build (dist/) and, for the GIF, ffmpeg in the PATH.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const ROOT = new URL('../', import.meta.url);
const DIST = new URL('dist/', ROOT);
const IMAGES = new URL('docs/images/', ROOT).pathname;
const ORIGIN = 'http://shop.example';
const OPTIONS = JSON.parse(readFileSync(new URL('examples/page/expected.json', ROOT), 'utf8')).options;
const MAX_GIF = 5 * 1024 * 1024;

// The page as an app in development would have it: SAT imported, not started yet.
// Its content moves to the right, so the panel (on the left) doesn't cover it.
const PAGE = readFileSync(new URL('examples/page/index.html', ROOT), 'utf8')
    .replace('</head>', '<style>body { margin-right: 3rem }</style>\n</head>')
    .replace('</body>',
    `<script type="module">import { satChecker } from '/sat-controller.js'; satChecker(${JSON.stringify({ enabled: true, ...OPTIONS })});</script>\n</body>`);

// The video has no mouse pointer: a dot follows the mouse so the clicks can be seen. Only in the recording.
const POINTER = `addEventListener('DOMContentLoaded', () => {
    const dot = document.createElement('div');
    dot.style.cssText = 'position:fixed;z-index:2147483647;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:rgb(9 105 218 / 0.5);border:2px solid #fff;pointer-events:none;left:-50px;top:-50px';
    document.documentElement.append(dot);
    addEventListener('mousemove', (event) => { dot.style.left = event.clientX + 'px'; dot.style.top = event.clientY + 'px'; }, true);
});`;

async function open(browser, options) {
    const context = await browser.newContext({ viewport: { width: 1200, height: 760 }, ...options });
    await context.route(`${ORIGIN}/**`, (route) => {
        const path = new URL(route.request().url()).pathname;
        if (path === '/') return route.fulfill({ contentType: 'text/html; charset=utf-8', body: PAGE });
        const file = new URL(`.${path}`, DIST);
        if (!existsSync(file)) return route.fulfill({ status: 404, body: '' });
        return route.fulfill({ contentType: 'text/javascript', body: readFileSync(file) });
    });
    const page = await context.newPage();
    await page.goto(`${ORIGIN}/`);
    return { context, page };
}

/** Moves the mouse to the element as a person would, then clicks it. */
async function click(page, locator, pause = 1200) {
    await locator.scrollIntoViewIfNeeded();
    const box = await locator.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 25 });
    await page.waitForTimeout(250);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(pause);
}

/** The issue of a rule in the panel, by the rule's title. */
const issue = (page, title) => page.locator('.rule', { hasText: title }).locator('.item').first();

/** SAT on, panel open, the image-alt issue clicked: its box flashing. */
async function showPanel(page, pause) {
    await click(page, page.locator('#sat-run-button'), pause);
    await page.locator('.results').getByText('5 errors').waitFor();
    await click(page, page.locator('.results'), pause);
    await click(page, issue(page, 'Images have alternative text'), pause);
}

const browser = await chromium.launch();

for (const colorScheme of ['light', 'dark']) {
    const { context, page } = await open(browser, { colorScheme, deviceScaleFactor: 2 });
    await showPanel(page, 300);
    await page.screenshot({ path: join(IMAGES, `panel-${colorScheme}.png`), scale: 'css' });
    await context.close();
}

{
    const { context, page } = await open(browser, { viewport: { width: 1280, height: 640 } });
    await showPanel(page, 300);
    await page.screenshot({ path: join(IMAGES, 'social.png') });
    await context.close();
}

const videos = mkdtempSync(join(tmpdir(), 'sat-media-'));
const size = { width: 1200, height: 720 };
const { context, page } = await open(browser, { viewport: size, recordVideo: { dir: videos, size } });
await page.addInitScript(POINTER);
await page.reload();
await page.waitForTimeout(1500);
await showPanel(page, 1800);
await click(page, issue(page, 'Form fields have a label'), 1800);
await click(page, page.getByRole('button', { name: /^Structure/ }), 2200);
const video = await page.video().path();
await context.close();
await browser.close();

const gif = join(IMAGES, 'sat.gif');
if (spawnSync('ffmpeg', ['-version']).error) {
    // ponytail: no npm dependency for the conversion; ffmpeg is a single install where it's missing.
    console.log(`Screenshots saved in docs/images/. For the GIF install ffmpeg (brew install ffmpeg, apt install ffmpeg) and run npm run media again, or convert ${video} yourself.`);
} else {
    const filter = 'fps=10,scale=800:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle';
    // -ss: the first frames are blank, before the page has loaded.
    const run = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '0.8', '-i', video, '-vf', filter, gif], { stdio: 'inherit' });
    rmSync(videos, { recursive: true });
    if (run.status !== 0) process.exit(1);
    const bytes = statSync(gif).size;
    console.log(`docs/images/: panel-light.png, panel-dark.png, social.png, sat.gif (${(bytes / 1024 / 1024).toFixed(1)} MB)`);
    if (bytes > MAX_GIF) {
        console.error('sat.gif is over 5 MB: shorten the recording or lower fps/scale in scripts/media.mjs.');
        process.exit(1);
    }
}
