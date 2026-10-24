/** SAT's own styles, inside its shadow root: the page's CSS doesn't reach them and they don't leak out. */
export const STYLES = `
:host { all: initial; }
[hidden] { display: none !important; }
* { box-sizing: border-box; }

.layer { position: fixed; inset: 0; pointer-events: none; z-index: 2147483646; }
.box { position: fixed; border: 2px solid; border-radius: 2px; }
.box.error { border-color: #d0021b; background: rgba(208, 2, 27, 0.08); }
.box.warning { border-color: #f08c00; border-style: dashed; background: rgba(240, 140, 0, 0.08); }
.box.pulse { border: 3px solid #0057d9; box-shadow: 0 0 0 4px rgba(0, 87, 217, 0.3); }

.dock, .panel {
    position: fixed; left: 12px; z-index: 2147483647;
    font: 14px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #1a1a1a;
}
.dock { bottom: 12px; display: flex; gap: 8px; align-items: center; }
button { font: inherit; color: inherit; cursor: pointer; margin: 0; }
:focus-visible { outline: 3px solid #0057d9; outline-offset: 2px; }
.round, .results { height: 44px; border: 2px solid #43d8d5; background: #fff; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25); }
.round { width: 44px; border-radius: 50%; font-size: 20px; padding: 0; }
.results { border-radius: 22px; padding: 0 14px; font-weight: 600; }

.panel {
    bottom: 68px; width: min(440px, calc(100vw - 24px)); max-height: 70vh;
    display: flex; flex-direction: column; background: #fff; border-radius: 10px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}
.header { display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-bottom: 1px solid #ddd; }
.title { font-weight: 700; margin-right: auto; }
.tab { border: 1px solid #bbb; background: #f5f5f5; border-radius: 6px; padding: 4px 10px; }
.tab[aria-pressed="true"] { background: #1a1a1a; border-color: #1a1a1a; color: #fff; }
.close { border: none; background: none; font-size: 16px; padding: 4px 8px; }
.view { overflow: auto; padding: 8px 10px; }

.filters { border: none; margin: 0 0 8px; padding: 0; }
.filters legend { font-weight: 600; padding: 0; margin-bottom: 4px; }
.filters div { display: flex; flex-wrap: wrap; gap: 4px 14px; }
.filters label { display: inline-flex; gap: 4px; align-items: center; }

details { border-bottom: 1px solid #eee; }
summary { padding: 6px 0; font-weight: 600; cursor: pointer; }
ul { margin: 0; padding: 0 0 6px; list-style: none; }
.docs { display: inline-block; margin: 0 6px 4px; padding: 3px 0; font-size: 13px; color: #0842a0; }
li > span { display: block; padding: 4px 6px; }
.item { display: block; width: 100%; text-align: left; border: none; background: none; padding: 4px 6px; border-radius: 4px; }
.item:hover { background: #eef5ff; }
.badge { display: inline-block; font-size: 12px; font-weight: 700; padding: 0 6px; border-radius: 4px; margin-right: 6px; }
.error .badge { background: #b00020; color: #fff; }
.warning .badge { background: #ffd166; color: #1a1a1a; }
.outline ul { padding-left: 18px; }
.level { font-weight: 700; margin-right: 6px; }
.skip { color: #b00020; font-weight: 600; }
`;
