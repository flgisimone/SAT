# Backlog — evoluzione di SAT

Questo backlog descrive come far crescere SAT (SEO Accessibility Tool) da un insieme di controlli con un pannello a uno strumento affidabile per lo sviluppo e la CI. L'analisi di partenza è in [00-analisi.md](00-analisi.md).

SAT resta uno **strumento di sviluppo**: gira nel browser dello sviluppatore, non va in produzione e non invia dati della pagina a nessun servizio. Fanno eccezione la correzione con l'IA (F12) e il server MCP (F17), che vanno attivati esplicitamente: i dati li manda l'agente dell'utente, non SAT.

| Entry point | Contenuto | Chi lo usa |
|---|---|---|
| `seo-accessibility-tool` | `seoAccessibilityTool(options)`: esegue i controlli e restituisce i risultati | Script, test, integrazioni future |
| `seo-accessibility-tool/sat-controller` | `satChecker(options)`: bottone e pannello nella pagina | Progetti senza Vite (SvelteKit, Angular, Next.js, vanilla) |
| `seo-accessibility-tool/vite` | `sat(options)`: plugin che aggiunge SAT alle pagine di `vite dev`, con il server MCP per gli agenti IA (`mcp: true`) e axe-core se installato | Progetti Vite (Svelte, Solid, React, Vue…) |
| `seo-accessibility-tool/axe` | `axe(options)`: axe-core come motore aggiuntivo (`engines: [axe()]`) | Chi vuole le circa 90 regole di axe |
| `seo-accessibility-tool/playwright` | `checkPage(page, options)`, `expect(page).toHaveNoSATErrors()` | Test end-to-end |
| `sat-check` (bin) | CLI: report in console, JSON e HTML, soglie | CI |

## Decisioni

| Tema | Decisione | Motivo |
|---|---|---|
| Precisione sulle app reali | Prima di regole o funzioni nuove, SAT si prova su un'app vera accanto ad axe; quello che SAT non può decidere (focus trap, sentinelle) è un avviso | La prova su oneoffice: 258 errori su 446 erano falsi positivi su pattern di Radix e shadcn (F22) |
| Cutover 2.0 | **2.0.0**, pubblicata una volta alla fine di F21: via API legacy (`enableCheck*`, `errorMessages`/`warningMessages`, `satReset`), estensione, crawler della CLI con `link-broken`, wrapper React e Vue | 1.19.0 appena pubblicata e quasi nessun utente: rompere ora costa meno; il messaggio è il pannello in `vite dev` con l'agente (analisi del 28/10/2026, F18) |
| L'IA nello sviluppo | Oltre la correzione: l'agente controlla da solo in headless (`sat_check`), conosce le regole via MCP, riceve i problemi nuovi da un hook, la CI blocca le regressioni con una baseline; dal pannello «Send to agent» per qualsiasi agente MCP, «Fix with AI» resta per Claude Code | L'agente diventa autonomo nel ciclo scrivi → controlla → correggi (F19–F21, 28/10/2026) |
| Sorgente per React | Prima `_debugStack` delle fiber con le source map, senza trasformazioni; se non regge, `data-sat-source` opt-in solo sugli elementi HTML | Il codice dell'app non si tocca finché si può (F19-02) |
| Oltre Vite | Server MCP indipendente e Next.js dopo i feedback (almeno due persone) | Regola di F16 (28/10/2026) |
| Precisione | Meglio un problema mancato che un falso positivo: ogni controllo segue la specifica (WCAG, WAI-ARIA, HTML-AAM) e non segnala i pattern validi | Se il tool segnala cose corrette, gli sviluppatori smettono di guardarlo (F1-01) |
| Pagina ospite | SAT non modifica la pagina: i riquadri stanno in uno strato proprio, `satReset` è deprecato e non fa nulla | Il reset cancellava stili e tooltip dell'app (F1-01); i re-render cancellavano le evidenziazioni (F3-02) |
| Link rotti | Controllo spento di default, una richiesta per URL, massimo 5 alla volta, URL tipo logout/delete esclusi | Le richieste dal browser hanno effetti collaterali e nelle SPA non trovano i 404 (F1-01); la versione completa è nella CLI, `sat-check --depth` (F5-04) |
| Peer dependency | `react`, `vue`, `vite`, `axe-core` e `@playwright/test` opzionali | npm 7+ installava entrambe in ogni progetto (F1-02) |
| Strumenti | Gli stessi di oneoffice: Vitest 5 con jsdom, Playwright 1.64, ESLint 10 con typescript-eslint, TypeScript 6, tokensave, `npm run verify` / `verify:e2e` / `usage` | Un solo modo di lavorare fra i progetti (F1-06) |
| Test | Unit test in jsdom per la logica; test in Chromium sul bundle per tutto ciò che dipende da layout, colori e visibilità | jsdom non ha layout né canvas (F1-04) |
| Rilascio | Semver; i cambi di comportamento vanno in `CHANGELOG.md`; la pubblicazione su npm la fa il maintainer | CONVENTIONS §8 |
| Gravità | Errore per un requisito normativo (WCAG A/AA, «must» di HTML e WAI-ARIA, requisito di Google), avviso per una raccomandazione, niente per ciò che le fonti dichiarano valido; ogni regola cita la sua fonte | Revisione del 24/10/2026 sulle fonti ufficiali ([00-analisi-linee-guida.md](00-analisi-linee-guida.md)) |
| Correzione con l'IA | «Copy fix prompt» ovunque; «Fix with AI» solo con il plugin Vite e `ai: true`, che lancia Claude Code (`claude -p`) con strumenti limitati; nessun altro agente nel pulsante; gli altri agenti passano dal server MCP (F17) | Serve un processo Node nel progetto; con un solo agente la sicurezza la controlla SAT (F12, decisione del 24/10/2026) |
| Dati della pagina | Non si inviano a nessun servizio, salvo con la correzione con l'IA o il server MCP attivati esplicitamente: li manda l'agente dell'utente, non SAT | Eccezione opt-in (F12, F17) |
| Crescita e adozione | Dopo F12 il lavoro passa dalla funzionalità alla distribuzione: installazione verificata, README, demo, guide, kit di lancio (F13–F16); le fasi successive nascono dai feedback | Roadmap del 25/10/2026: su npm c'è ancora la 1.6.0 e non esiste una demo pubblica |
| Messaggio e agenti IA | SAT si presenta come il pannello di accessibilità e SEO in `vite dev` che passa i problemi all'agente dell'utente; server MCP nel plugin Vite (`mcp: true`) per qualsiasi agente; «Fix with AI» resta per Claude Code; CLI, Playwright ed estensione restano in secondo piano | Valutazione del 25/10/2026: per CI, crawler ed estensione esistono strumenti più maturi, il pannello nel dev server con l'IA no (F17) |
| axe-core nel plugin Vite | Acceso da solo quando `axe-core` è installato nel progetto, `axe: false` lo spegne; resta peer dependency opzionale | Toglie l'obiezione «perché non axe?» senza rotture (F17) |
| Versione dopo F17 | **1.19.0**, la prima pubblicata dopo la 1.6.0; la 1.18.0 non si pubblica | Un rilascio solo prima del lancio (decisione del 25/10/2026) |
| Node | Minimo dichiarato 22 (`engines`), provato in CI dal job `smoke`; sviluppo e CI su Node 26 (`.nvmrc`) | Node 20 è fuori supporto dal 30/04/2026; il 26 è LTS dal 28/10/2026 (scelta del 25/10/2026) |
| Versione dopo F13 | **1.18.0**, la prima pubblicata dopo la 1.6.0: si passa da 1.6.0 a 1.18.0 su npm; LICENSE nel pacchetto, `engines.node >=22`, `examples/` provati dal tarball in CI (`npm run smoke`), limiti dichiarati nel README; nessuna modifica a regole, pannello e API | Si pubblica dopo aver verificato l'installazione pulita (decisione del 25/10/2026) |
| Demo pubblica | GitHub Pages, da un workflow del repository; niente StackBlitz | Gratuita e sotto controllo del maintainer (25/10/2026) |
| Estensione sul Chrome Web Store | Non ora; si riconsidera dopo i primi feedback | Account, privacy policy e revisione prima di sapere se serve (25/10/2026) |
| Ordine dopo F7 | Prima le regole (F8, F9, F10), poi il pannello (F11), che mostra così titoli e fonti definitivi | Scelta del 24/10/2026 |
| Versione dopo F12 | **1.17.0**: `fixPrompt`, «Copy fix prompt» nel pannello, «Fix with AI» con Claude Code dal plugin Vite (`ai: true`) | Funzioni nuove senza rotture di API (F12) |
| Versione dopo F11 | **1.16.0**: pannello in stile DevTools con temi, contatori che filtrano, titoli e fonti delle regole (`Issue.title`, `Issue.source`) | Funzioni nuove senza rotture di API (F11) |
| Versione dopo F10 | **1.15.0**: `structured-data` controlla le proprietà che Google dichiara obbligatorie | Funzione nuova senza rotture di API (F10) |
| Versione dopo F9 | **1.14.0**: dieci regole nuove da WCAG 2.2 e ACT, accese di default; i casi di test ACT fanno parte dei test | Funzioni nuove senza rotture di API (F9) |
| Versione dopo F8 | **1.13.0**: gravità dalle fonti ufficiali, fonte per ogni regola, `wcagLevel`, lingue valide | Cambiano gravità e default, non le API (F8) |
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
| F7 | [07-manutenzione-ci.md](07-manutenzione-ci.md) | CI di nuovo verde (`rollup-plugin-dts` compatibile con TypeScript 6), azioni GitHub su Node 24 | — |
| — | [00-analisi-linee-guida.md](00-analisi-linee-guida.md) | Regole contro WCAG 2.2, ACT, WAI-ARIA, HTML e Google Search Central; valutazione del pannello | — |
| F8 | [08-allineamento-regole.md](08-allineamento-regole.md) | Gravità dalle fonti ufficiali, fonte per ogni regola, `wcagLevel`, lingue valide, 1.13.0 | — |
| F9 | [09-regole-wcag-act.md](09-regole-wcag-act.md) | Regole nuove dalle regole ACT e da WCAG 2.2 (`target-size`, `aria-attributes`…), casi di test ACT nei test, 1.14.0 | F8 |
| F10 | [10-dati-strutturati-google.md](10-dati-strutturati-google.md) | Proprietà obbligatorie di Google nei dati strutturati, 1.15.0 | F8 |
| F11 | [11-pannello-professionale.md](11-pannello-professionale.md) | Pannello in stile DevTools: token, tema scuro, icone SVG, riepilogo, problemi leggibili con fonte, 1.16.0 | F8, F9 |
| F12 | [12-correzione-ia.md](12-correzione-ia.md) | Correzione con l'IA: prompt da copiare, link agli editor, «Fix with AI» con Claude Code dal plugin Vite, 1.17.0 | F11 |
| F13 | [13-pronto-da-provare.md](13-pronto-da-provare.md) | LICENSE, metadati, `npm pack` installato in progetti puliti in CI, `examples/`, pagina con errori voluti, limiti dichiarati, CONTRIBUTING e template, 1.18.0 pubblicata dal maintainer | F12 |
| F14 | [14-readme-demo.md](14-readme-demo.md) | Immagini riproducibili con Playwright, demo su GitHub Pages, README riscritto attorno al messaggio, impostazioni del repository | F13 |
| F15 | [15-guide-adozione.md](15-guide-adozione.md) | Guide in `docs/guides/`: CI, configurazione, SPA, troubleshooting; esempio da clonare | F13 |
| F16 | [16-kit-lancio.md](16-kit-lancio.md) | Script dei video, tutorial per Dev.to, post per le community, registro delle metriche, triage dei feedback | F14 (F16-04 subito) |
| F17 | [17-agenti-ia-posizionamento.md](17-agenti-ia-posizionamento.md) | Server MCP nel plugin Vite per ogni agente IA, axe acceso quando è installato, README e lancio attorno al pannello con l'IA, 1.19.0 | F16 |
| F18 | [18-cutover-2.md](18-cutover-2.md) | Cutover 2.0: via API legacy, estensione, crawler con `link-broken`, wrapper React e Vue; guida di migrazione | F17 |
| F19 | [19-ciclo-agente.md](19-ciclo-agente.md) | Ciclo dell'agente: `sat_check` headless, ID stabili e differenze, immagini degli elementi, file e riga per React | F18 |
| F20 | [20-prevenzione.md](20-prevenzione.md) | Prevenzione: regole e prompt via MCP, `sat-check init`, skill e hook per Claude Code, baseline in CI | F19 |
| F21 | [21-pannello-agente.md](21-pannello-agente.md) | «Send to agent» dal pannello, stato dell'agente, demo e lancio, 2.0.0 | F19 (meglio dopo F20) |
| F22 | [22-precisione.md](22-precisione.md) | Falsi positivi su shadcn/Radix trovati su oneoffice: nome dai `<label>`, roving tabindex, intestazioni di gruppo, modali, 2.0.1 | F21 |

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
