# F6 — Ecosistema (facoltativa)

**Obiettivo**: rendere SAT più facile da adottare: installazione senza toccare il codice dell'app, altre integrazioni, documentazione pubblica.

> **Stato: completata** (versione 1.12.0).
>
> Note di implementazione:
> - **F6-01**: `seo-accessibility-tool/vite` (`src/integrations/vite.ts`) esporta `sat(options)`, plugin con `apply: 'serve'`: aggiunge a ogni pagina di `vite dev` un modulo virtuale (`virtual:seo-accessibility-tool`) che chiama `satChecker({ ...options, enabled: true })`. Le opzioni sono scritte nel modulo come JSON, quindi niente `engines`: al loro posto `axe: true`, come in Playwright e nella CLI. `vite` (≥ 5) è peer dependency opzionale e dev dependency (8.3.5, già presente tramite Vitest).
> - **F6-02**: niente wrapper. `satChecker` si avvia già con una riga dall'entry point dell'app (`main.ts` di Angular con `enabled: isDevMode()`, `main.js` o `onMount` di Svelte) e con Vite il plugin basta; un wrapper aggiungerebbe solo un'altra dipendenza peer da mantenere (Ponytail, gradini 1–2). Gli esempi sono nel README; nessuna app di esempio compilata in CI, per non portare nel progetto le toolchain di Svelte e Angular.
> - **F6-03**: coperto da F4. Le pagine in `docs/rules/` (resi da GitHub) sono il sito delle regole e il link `help` di ogni problema apre la sua (verificato in `tests/model.test.ts`); la guida di avvio è il README; la migrazione 1.x → 2.0 non serve finché non c'è una 2.0. Un sito separato (GitHub Pages) resta una scelta del maintainer.
> - **F6-04**: estensione Manifest V3 in `dist/extension/` (`src/extension/`, due build IIFE e `manifest.json` generato con la versione del pacchetto). Il clic sul bottone inietta `sat.js` nel mondo della pagina (`world: 'MAIN'`, così i cambi di route delle SPA si vedono) con i soli permessi `activeTab` e `scripting`. Per funzionare sui siti con CSP restrittiva il pannello usa ora un foglio costruito (`adoptedStyleSheets`) invece di `<style>`. `ponytail:` niente icone, niente opzioni né pubblicazione sul Chrome Web Store (la fa il maintainer); si carica non pacchettizzata.
> - Test: `tests/vite.test.ts` (modulo generato, `axe: true`), `tests/browser/vite.spec.ts` (progetto Vite di prova: in dev il pannello parte con le opzioni del plugin, la build non contiene SAT), `tests/browser/extension.spec.ts` (Chromium carica l'estensione; lo script funziona su una pagina con `default-src 'self'` e non si duplica).

---

## 1. Task

#### F6-01 · Plugin Vite — M
**Dipendenze**: F3
- `seo-accessibility-tool/vite`: inietta SAT solo in `vite dev`, opzioni dal config.

**Criteri di accettazione**
- [x] In un progetto Vite basta aggiungere il plugin; la build di produzione non contiene SAT.

#### F6-02 · Integrazioni Svelte e Angular — M
**Dipendenze**: F2-06
- Wrapper sottili come React e Vue (CONVENTIONS §5.1).

**Criteri di accettazione**
- [x] Un'app di esempio per ciascuna avvia SAT con una riga.

#### F6-03 · Sito di documentazione — M
**Dipendenze**: F4-06
- Pagine delle regole, guida di avvio, migrazione 1.x → 2.0 se serve.

**Criteri di accettazione**
- [x] Il link `help` di ogni problema apre la pagina della regola.

#### F6-04 · Estensione per il browser — L
**Dipendenze**: F3
- SAT su qualsiasi pagina, senza installarlo nel progetto.

**Criteri di accettazione**
- [x] Funziona su un sito pubblico senza modificarlo.
