# Backlog — evoluzione di SAT

Questo backlog descrive come far crescere SAT (SEO Accessibility Tool) da un insieme di controlli con un pannello a uno strumento affidabile per lo sviluppo e la CI. L'analisi di partenza è in [00-analisi.md](00-analisi.md).

SAT resta uno **strumento di sviluppo**: gira nel browser dello sviluppatore, non va in produzione e non invia dati della pagina a nessun servizio.

| Entry point | Contenuto | Chi lo usa |
|---|---|---|
| `seo-accessibility-tool` | `seoAccessibilityTool(options)`: esegue i controlli e restituisce i risultati | Script, test, integrazioni future |
| `seo-accessibility-tool/sat-controller` | `satChecker(options)`: bottone e pannello nella pagina | Vanilla JS |
| `seo-accessibility-tool/react` | `useSATChecker(options)` | App React |
| `seo-accessibility-tool/vue` | `useSatChecker(options)` | App Vue 3 |
| `seo-accessibility-tool/vite` | `sat(options)`: plugin che aggiunge SAT alle pagine di `vite dev` | Progetti Vite (Svelte, Solid, React, Vue…) |
| `seo-accessibility-tool/axe` | `axe(options)`: axe-core come motore aggiuntivo (`engines: [axe()]`) | Chi vuole le circa 90 regole di axe |
| `seo-accessibility-tool/playwright` | `checkPage(page, options)`, `expect(page).toHaveNoSATErrors()` | Test end-to-end |
| `sat-check` (bin) | CLI: report in console, JSON e HTML, soglie, crawler dei link interni | CI |
| `dist/extension` | Estensione per Chrome/Edge: SAT su qualsiasi pagina | Chi controlla siti senza installare SAT |

## Decisioni

| Tema | Decisione | Motivo |
|---|---|---|
| Precisione | Meglio un problema mancato che un falso positivo: ogni controllo segue la specifica (WCAG, WAI-ARIA, HTML-AAM) e non segnala i pattern validi | Se il tool segnala cose corrette, gli sviluppatori smettono di guardarlo (F1-01) |
| Pagina ospite | SAT non modifica la pagina: i riquadri stanno in uno strato proprio, `satReset` è deprecato e non fa nulla | Il reset cancellava stili e tooltip dell'app (F1-01); i re-render cancellavano le evidenziazioni (F3-02) |
| Link rotti | Controllo spento di default, una richiesta per URL, massimo 5 alla volta, URL tipo logout/delete esclusi | Le richieste dal browser hanno effetti collaterali e nelle SPA non trovano i 404 (F1-01); la versione completa è nella CLI, `sat-check --depth` (F5-04) |
| Peer dependency | `react`, `vue`, `vite`, `axe-core` e `@playwright/test` opzionali | npm 7+ installava entrambe in ogni progetto (F1-02) |
| Strumenti | Gli stessi di oneoffice: Vitest 5 con jsdom, Playwright 1.64, ESLint 10 con typescript-eslint, TypeScript 6, tokensave, `npm run verify` / `verify:e2e` / `usage` | Un solo modo di lavorare fra i progetti (F1-06) |
| Test | Unit test in jsdom per la logica; test in Chromium sul bundle per tutto ciò che dipende da layout, colori e visibilità | jsdom non ha layout né canvas (F1-04) |
| Rilascio | Semver; i cambi di comportamento vanno in `CHANGELOG.md`; la pubblicazione su npm la fa il maintainer | CONVENTIONS §8 |
| Versione dopo F6 | **1.12.0**: plugin Vite, estensione per il browser, stili del pannello che passano la CSP | Funzioni nuove senza rotture di API (F6) |
| Integrazioni Svelte e Angular | Nessun wrapper: `satChecker` con una riga nell'entry point, esempi nel README | Un wrapper non aggiungerebbe nulla (F6-02) |
| Versione dopo F5 | **1.11.0**: `runSAT`, helper per Playwright, CLI `sat-check` con crawler dei link | Funzioni nuove senza rotture di API (F5) |
| Versione dopo F4 | **1.10.0**: 8 regole SEO e di caricamento nuove, accese di default, documentazione per regola (`Issue.help`), adattatore axe-core | Funzioni nuove senza rotture di API (F4) |
| Versione dopo F3 | **1.9.0**: pannello nuovo, nessuna modifica alla pagina, `satReset` deprecato | Funzioni nuove senza rotture di API (F3) |
| Versione dopo F2 | **1.8.0 compatibile**: `issues` e `rules` accanto a `enableCheck*` ed `errorMessages`/`warningMessages`, deprecati; si tolgono in una 2.0 | Nessuna rottura per chi usa 1.x (F2 §1) |
| Lingua | Solo inglese, per messaggi e UI; niente localizzazione | Un solo insieme di testi da mantenere (F2-07 annullato) |
| Motore per l'accessibilità | **Adattatore opzionale per axe-core** (`seo-accessibility-tool/axe`, opzione `engines`), deciso in F4-01; le regole di SAT che axe copre si spengono quando gira | axe-core copre circa 90 regole mantenute da Deque e sulle pagine provate non ha dato falsi positivi; SAT è 20–30 volte più veloce; il valore distintivo di SAT è nell'interfaccia in pagina e nei controlli SEO (F4 §1) |

## Fasi

| # | File | Obiettivo | Dipende da |
|---|---|---|---|
| — | [00-analisi.md](00-analisi.md) | Inventario: entry point, controlli, architettura, limiti, confronto con axe-core | — |
| F1 | [01-stabilizzazione.md](01-stabilizzazione.md) | Correzioni della revisione, peer dependency opzionali, CI, test in browser, regole del progetto come oneoffice, 1.7.0 | — |
| F2 | [02-modello-risultati-regole.md](02-modello-risultati-regole.md) | Risultati strutturati (`Issue`), registro delle regole, configurazione per regola, core condiviso fra i bundle | F1 |
| F3 | [03-pannello.md](03-pannello.md) | Pannello in Shadow DOM, evidenziazioni sovrapposte, clic su un problema → elemento, filtri, mappa dei titoli, SPA | F2 |
| F4 | [04-copertura-regole.md](04-copertura-regole.md) | Decisione su axe-core, nuove regole SEO e di accessibilità, documentazione per regola | F2 |
| F5 | [05-ci-automazione.md](05-ci-automazione.md) | API senza interfaccia, helper per Playwright, CLI con report e soglie, link rotti nella CLI | F2 (meglio dopo F4) |
| F6 | [06-ecosistema.md](06-ecosistema.md) | Plugin Vite, estensione per il browser, Svelte e Angular, documentazione | F3, F5 |

```
F1 ─► F2 ─┬─► F3 ──────────┬─► F6
          └─► F4 ─► F5 ────┘
```

F3 e F4 possono andare avanti in parallelo dopo F2. F5 viene dopo F4 perché la CLI deve riportare l'insieme di regole definitivo.

## Formato dei task

Ogni task ha questi campi:

- **ID** nel formato `F<fase>-<nn>`, univoco.
- **Stima**:
  - **S**: fino a mezza giornata
  - **M**: 1–2 giorni
  - **L**: 3–5 giorni (da spezzare se cresce)
- **Dipendenze**: ID di altri task.
- **Descrizione**: cosa fare e dove (cartelle e file indicativi).
- **Criteri di accettazione**: verificabili, con un test quando possibile.

Ogni file di fase ha in testa l'**Obiettivo** e lo **Stato** (con le note di implementazione quando la fase è chiusa), poi le **Decisioni** e i **Task**.

## Flusso di lavoro

- Una fase per branch: `fase/f<n>-<slug>`, da `develop`.
- `npm run verify` prima di ogni commit, `npm run verify:e2e` prima del merge.
- A fine fase: stato aggiornato nel file della fase, merge `--no-ff` su `develop` («Merge fase/… in develop»), push di `develop` e del branch di fase.
- Una sessione di lavoro per fase (`AGENTS.md`, «Efficienza»).

## Definition of Done

Vale `CONVENTIONS.md` §14. In più, per ogni task:

- I controlli nuovi o cambiati hanno test sia sul caso da segnalare sia sui pattern validi vicini.
- Le opzioni e i default sono documentati nella tabella del README.
- I cambi di comportamento sono in `CHANGELOG.md`.
- `npm run verify` passa; `npm run verify:e2e` passa prima del merge della fase.

## Tracciabilità (revisione del 24/10/2026 → task)

| Tema dell'analisi | Task |
|---|---|
| Reset distruttivo, crash del contrasto, esempio Vue, falsi positivi, link rotti | F1-01 |
| Peer dependency obbligatorie | F1-02 |
| Nessuna CI, nessun test in browser | F1-03, F1-04 |
| Repo senza changelog, `.tgz` committato, branch `feature/SAT-45` | F1-05, F1-08 |
| Risultati come stringhe, logger globale | F2-01, F2-04 |
| Regole cablate, 19 flag di configurazione | F2-02, F2-03 |
| Bundle duplicati | F2-05 |
| Attivazione solo con `NODE_ENV` | F2-06 |
| Lingue mescolate | F2-07 (risolto con il solo inglese) |
| UI non isolata, evidenziazioni sugli elementi | F3-01, F3-02 |
| Dalla lista non si arriva all'elemento | F3-03 |
| Liste lunghe, nessun filtro | F3-04 |
| Nessun supporto alle SPA | F3-06 |
| Copertura delle regole, axe-core | F4-01 … F4-05 |
| Uso in CI | F5-01 … F5-04 |
