# F5 — CI e automazione

**Obiettivo**: usare SAT anche fuori dal browser dello sviluppatore: nei test end-to-end, in uno script e nella pipeline, con report e soglie.

> **Stato: completata** (versione 1.11.0).
>
> Note di implementazione:
> - **F5-01**: `runSAT(options?, document?)` nell'entry `.`, con la stessa firma di `seoAccessibilityTool` (non `(document, options)` come scritto nel task) per coerenza; restituisce `{ issues, summary: { errors, warnings } }` con gli issue senza `element` (`IssueData`).
> - **F5-02**: `seo-accessibility-tool/playwright` (`src/headless/playwright.ts`). SAT entra nella pagina con uno script autonomo, `dist/sat-inject.js` (build IIFE di `src/headless/inject.ts`), aggiunto con `page.addScriptTag`: la pagina non deve importare SAT. Le opzioni attraversano `page.evaluate`, quindi niente `engines`: al loro posto `axe: true`, che aggiunge `axe-core/axe.min.js` alla pagina (nello script iniettato axe-core è letto da `window.axe` al momento della run). `expect` è quello di Playwright esteso con `toHaveNoSATErrors()`; si unisce ad altri con `mergeExpects`.
> - **F5-03**: comando `sat-check` (`bin` → `dist/cli.js`), argomenti con `node:util` `parseArgs`, report in console, `--json`, `--html` (pagina autonoma), `--config` (JSON con le opzioni), `--axe`, `--max-errors` (default 0) e `--max-warnings` sul totale delle pagine; exit code 0/1, 2 per comando sbagliato o Playwright mancante. `@playwright/test` è peer dependency opzionale (una sola, dà anche `chromium`). Workflow di esempio nel README.
> - **F5-04**: `--depth` (default 0), `--max-pages` (default 100), `--not-found <testo>`. Ogni link si apre con una navigazione vera, quindi il router della SPA risolve la route; rotto = 4xx/5xx, navigazione fallita o testo di not-found nella pagina. I link si raccolgono nella pagina con `collectInternalLinks` (stessa origine, URL tipo logout esclusi) e il problema è un `link-broken` sulla pagina che contiene il link; nel CLI la regola in pagina (HEAD) è spenta. Il testo di not-found è un'opzione e non un'euristica di default (per esempio «404» nel titolo), per non segnalare pagine valide. `ponytail:` una pagina alla volta.
> - Test: `tests/model.test.ts` (JSON di `runSAT`), `tests/browser/playwright-helper.spec.ts`, `tests/browser/cli.spec.ts` (SPA di prova servita con fallback come un dev server: route inesistente, 404 del server, `/logout` mai richiesto, limiti e severità da `--config`).

---

## 1. Decisioni

| Tema | Decisione | Motivo |
|---|---|---|
| Esecuzione | I controlli girano sempre in un browser vero (Playwright), mai in jsdom | Contrasto e visibilità hanno bisogno del layout |
| CLI | Pacchetto separato o entry `bin` con Playwright come peer dependency opzionale | Chi usa solo il pannello non deve scaricare un browser |
| Link rotti | Nella CLI, non nel browser: crawler con routing SPA reale | Dal browser non si trovano i 404 delle SPA (F1, `brokenInternalLinksChecker`) |

---

## 2. Task

#### F5-01 · API senza interfaccia — S
**Dipendenze**: F2-04
- `runSAT(document, options)` → `{ issues, summary }` serializzabile in JSON (senza `Element`).

**Criteri di accettazione**
- [x] Il risultato passa da `JSON.stringify` e mantiene selettori e messaggi.

#### F5-02 · Helper per Playwright — M
**Dipendenze**: F5-01
- `seo-accessibility-tool/playwright`: `await checkPage(page, options)` e `expect(page).toHaveNoSATErrors()`.

**Criteri di accettazione**
- [x] Il test fallisce con l'elenco leggibile dei problemi; passa su una pagina pulita.

#### F5-03 · CLI — L
**Dipendenze**: F5-02
- `npx sat-check <url…>`: report in console, JSON e HTML; `--max-errors`, `--max-warnings`; exit code per la pipeline.

**Criteri di accettazione**
- [x] Usata in un workflow di GitHub Actions di esempio nel README.

#### F5-04 · Link rotti nella CLI — M
**Dipendenze**: F5-03
- Visita dei link interni con Playwright (stesso dominio, profondità configurabile), esclusione degli URL tipo logout.

**Criteri di accettazione**
- [x] In un'app SPA di prova una route inesistente è segnalata.
