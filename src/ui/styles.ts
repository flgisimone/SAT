/**
 * SAT's own styles, inside its shadow root: the page's CSS doesn't reach them and they don't leak out.
 * Colors are tokens (red and amber only for severities) on the three top-level elements (not on :host), so the panel's markup keeps them
 * when the self-check copies it into a page of its own. Every text color reaches 4.5:1 on every
 * background of its theme.
 */
export const STYLES = `
:host { all: initial; }
[hidden] { display: none !important; }
* { box-sizing: border-box; }

.layer, .dock, .panel {
    --sat-bg: #ffffff;
    --sat-surface: #f6f8fa;
    --sat-hover: #eef1f4;
    --sat-selected: #ddf4ff;
    --sat-fg: #1f2328;
    --sat-muted: #59636e;
    --sat-border: #d1d9e0;
    --sat-accent: #0969da;
    --sat-error: #cf222e;
    --sat-warning: #9a6700;
    --sat-shadow: 0 8px 24px rgba(31, 35, 40, 0.16), 0 1px 3px rgba(31, 35, 40, 0.12);
    color-scheme: light;
}
@media (prefers-color-scheme: dark) {
    .layer, .dock, .panel {
        --sat-bg: #161b22;
        --sat-surface: #0d1117;
        --sat-hover: #21262d;
        --sat-selected: #11294a;
        --sat-fg: #e6edf3;
        --sat-muted: #9198a1;
        --sat-border: #3d444d;
        --sat-accent: #4493f8;
        --sat-error: #ff7b72;
        --sat-warning: #d29922;
        --sat-shadow: 0 8px 24px rgba(1, 4, 9, 0.6), 0 0 0 1px rgba(240, 246, 252, 0.04);
        color-scheme: dark;
    }
}

.layer { position: fixed; inset: 0; pointer-events: none; z-index: 2147483646; }
.box { position: fixed; border: 2px solid; border-radius: 2px; }
.box.error { border-color: var(--sat-error); background: color-mix(in srgb, var(--sat-error) 8%, transparent); }
.box.warning { border-color: var(--sat-warning); border-style: dashed; background: color-mix(in srgb, var(--sat-warning) 8%, transparent); }
.box.pulse { border: 3px solid var(--sat-accent); box-shadow: 0 0 0 4px color-mix(in srgb, var(--sat-accent) 30%, transparent); }
.tag {
    position: fixed; max-width: min(360px, calc(100vw - 8px)); padding: 4px 8px; border-radius: 6px;
    background: var(--sat-bg); color: var(--sat-fg); border: 1px solid var(--sat-border); box-shadow: var(--sat-shadow);
    font: 12px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.tag div { display: flex; gap: 6px; align-items: center; }

.dock, .panel {
    position: fixed; left: 16px; z-index: 2147483647;
    font: 13px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: var(--sat-fg);
    -webkit-font-smoothing: antialiased;
}
.dock.right, .panel.right { left: auto; right: 16px; }
.dock { bottom: 16px; display: flex; gap: 6px; align-items: center; }
button { font: inherit; color: inherit; cursor: pointer; margin: 0; }
a { color: var(--sat-accent); }
:focus-visible { outline: 2px solid var(--sat-accent); outline-offset: 2px; }
svg { flex: none; width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
svg .solid { fill: currentColor; stroke: none; }
svg .ink { stroke: var(--sat-bg); stroke-width: 1.75; }
svg .ink-dot { fill: var(--sat-bg); stroke: none; }
.sev-error { color: var(--sat-error); }
.sev-warning { color: var(--sat-warning); }

.icon, .results {
    height: 36px; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    background: var(--sat-bg); border: 1px solid var(--sat-border); box-shadow: var(--sat-shadow);
}
.icon { width: 36px; border-radius: 10px; padding: 0; }
.icon:hover, .results:hover { background: var(--sat-hover); }
.run[aria-label^="Run"] { background: var(--sat-accent); border-color: var(--sat-accent); color: var(--sat-bg); }
.results { border-radius: 10px; padding: 0 12px; font-weight: 600; font-variant-numeric: tabular-nums; }

.panel {
    bottom: 64px; width: min(420px, calc(100vw - 32px)); max-height: min(72vh, 680px);
    display: flex; flex-direction: column; overflow: hidden;
    background: var(--sat-bg); border: 1px solid var(--sat-border); border-radius: 12px; box-shadow: var(--sat-shadow);
    animation: sat-in 140ms ease-out;
}
@keyframes sat-in { from { opacity: 0; transform: translateY(6px); } }

.header { display: flex; align-items: center; gap: 8px; padding: 10px 10px 10px 14px; }
.brand { display: flex; align-items: center; gap: 8px; margin-right: auto; font-weight: 700; font-size: 14px; }
.brand svg { width: 20px; height: 20px; color: var(--sat-accent); }
.time { font-weight: 400; font-size: 12px; color: var(--sat-muted); }
.ghost { width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; padding: 0; border: none; border-radius: 6px; background: none; color: var(--sat-muted); }
.ghost:hover { background: var(--sat-hover); color: var(--sat-fg); }

.summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; padding: 0 14px 10px; }
.counter {
    display: flex; flex-direction: column; align-items: flex-start; gap: 2px; min-height: 52px; padding: 6px 10px;
    border: 1px solid var(--sat-border); border-radius: 8px; background: var(--sat-bg); text-align: left;
}
.counter:hover { background: var(--sat-hover); }
.counter[aria-pressed="false"] { background: var(--sat-surface); }
.counter[aria-pressed="false"] .count { color: var(--sat-muted); text-decoration: line-through; }
.counter[aria-pressed="true"] { border-color: var(--sat-accent); box-shadow: inset 0 0 0 1px var(--sat-accent); }
.count { font-size: 18px; font-weight: 700; font-variant-numeric: tabular-nums; line-height: 1.2; }
.counter span:last-child { display: flex; gap: 4px; align-items: center; font-size: 12px; color: var(--sat-muted); }
.counter svg { width: 12px; height: 12px; }

.tabs { display: flex; gap: 2px; padding: 0 14px; border-bottom: 1px solid var(--sat-border); }
.tab { display: inline-flex; gap: 6px; align-items: center; padding: 8px 10px; border: none; border-bottom: 2px solid transparent; background: none; color: var(--sat-muted); font-weight: 600; }
.tab:hover { color: var(--sat-fg); }
.tab[aria-pressed="true"] { color: var(--sat-fg); border-bottom-color: var(--sat-accent); }
.pill { min-width: 20px; padding: 0 6px; border-radius: 10px; background: var(--sat-hover); color: var(--sat-fg); font-size: 12px; font-variant-numeric: tabular-nums; text-align: center; }

.view { overflow: auto; padding: 4px 0 10px; background: var(--sat-surface); flex: 1; }
.view > p { margin: 0; padding: 16px 14px; color: var(--sat-muted); }
.category { display: flex; gap: 6px; align-items: center; margin: 0; padding: 10px 14px 4px; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--sat-muted); }
.rule { margin: 6px 10px; border: 1px solid var(--sat-border); border-radius: 8px; background: var(--sat-bg); }
.rule-head { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; padding: 8px 10px 6px; }
.rule-title { font-weight: 600; flex: 1 1 auto; min-width: 0; }
.chip { padding: 0 6px; border: 1px solid var(--sat-border); border-radius: 4px; font-size: 11px; color: var(--sat-muted); white-space: nowrap; }
.rule-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 12px; margin: 0 10px 4px; }
.docs { display: inline-flex; gap: 4px; align-items: center; min-height: 24px; font-size: 12px; text-decoration: none; }
.link { display: inline-flex; gap: 4px; align-items: center; min-height: 24px; padding: 0 4px; border: none; border-radius: 4px; background: none; color: var(--sat-accent); font-size: 12px; font-weight: 600; }
.link:hover { background: var(--sat-hover); }
.link svg { width: 12px; height: 12px; }
.docs:hover { text-decoration: underline; }
.docs svg { width: 12px; height: 12px; }
ul { margin: 0; padding: 0; list-style: none; }
.rule > ul > li { border-top: 1px solid var(--sat-border); }
.row { display: flex; align-items: flex-start; }
.row .item { flex: 1; min-width: 0; }
.row .ghost { flex: none; margin: 2px 2px 0 0; }
.item { display: flex; gap: 8px; align-items: flex-start; width: 100%; min-height: 32px; padding: 6px 10px; border: none; background: none; text-align: left; overflow-wrap: anywhere; }
button.item:hover { background: var(--sat-hover); }
.item svg { margin-top: 2px; }
.more { width: 100%; min-height: 32px; padding: 6px 10px; border: none; border-top: 1px solid var(--sat-border); border-radius: 0 0 8px 8px; background: none; color: var(--sat-accent); font-weight: 600; text-align: left; }
.more:hover { background: var(--sat-hover); }

.live { font-size: 12px; color: var(--sat-muted); }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.prompt-box, .fix { margin: 0 14px 10px; padding: 6px 10px 8px; border: 1px solid var(--sat-border); border-radius: 8px; background: var(--sat-surface); font-size: 12px; }
.box-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.box-head p { margin: 0; }
.prompt-box textarea {
    display: block; width: 100%; margin-top: 4px; padding: 6px; resize: vertical;
    font: 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--sat-fg);
    background: var(--sat-bg); border: 1px solid var(--sat-border); border-radius: 6px;
}
.fix p, .fix ul { margin: 4px 0 0; overflow-wrap: anywhere; }
.fix-warning { display: flex; gap: 6px; align-items: flex-start; }
.fix-log, .fix-summary { color: var(--sat-muted); }
.fix-files li { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.fix-label { font-weight: 600; }

.outline { padding: 6px 10px; }
.outline ul { padding-left: 18px; border-left: 1px solid var(--sat-border); margin-left: 14px; }
.outline .item { border-radius: 6px; }
.level { min-width: 24px; font-weight: 700; color: var(--sat-muted); font-variant-numeric: tabular-nums; }
.skip { color: var(--sat-error); font-weight: 600; }

@media (prefers-reduced-motion: reduce) {
    .panel { animation: none; }
}
`;
