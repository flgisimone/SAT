# F15 — Guide all'adozione

**Obiettivo**: chi ha provato SAT lo mette nel proprio lavoro quotidiano: lo configura, capisce i risultati, lo porta in CI e sa cosa fare quando qualcosa non va.

> **Stato: completata (25/10/2026).** Guide in `docs/guides/`, template `examples/vite-vanilla`; tre difetti della CLI corretti strada facendo (§3). Il template si installa da npm solo dopo la pubblicazione della 1.18.0. Fonte: roadmap di crescita del 25/10/2026, fase 6.

---

## 1. Decisioni

- **Solo documentazione e esempi** di ciò che esiste già: nessuna funzione nuova finché i feedback non la chiedono.
- **Il README resta la porta d'ingresso**; le guide stanno in `docs/guides/` e il README le collega.
- **Ogni snippet è provato**: viene da un esempio di `examples/` o da un test.

## 2. Task

#### F15-01 · Guida alla CI — S
**Dipendenze**: F13-03
- `docs/guides/ci.md`: `sat-check` su GitHub Actions e GitLab CI, soglie (`--max-errors`, `--max-warnings`), report come artifact, crawler (`--depth`, `--not-found`), come partire su un progetto con molti problemi (soglia attuale, poi a scendere).
- In alternativa, l'helper per Playwright dentro una suite che esiste già.
- Un report JSON e uno HTML d'esempio, generati dalla pagina con errori voluti.

**Criteri di accettazione**
- [x] Il workflow d'esempio è quello provato in `examples/vite-vanilla` (non `examples/cli`, vedi §3): `tests/guides.test.ts` controlla che la guida lo riporti alla lettera, `npm run smoke` ne esegue gli script.

#### F15-02 · Configurazione e regole — S
**Dipendenze**: —
- `docs/guides/configuration.md`: dove si mettono le opzioni per ogni integrazione, gravità per regola, `wcagLevel`, spegnere una regola, `allowedLinkTexts`, axe-core, una configurazione condivisa fra pannello e CLI.

**Criteri di accettazione**
- [x] Ogni opzione citata esiste nei tipi pubblici: `tests/guides.test.ts` controlla la tabella «All the options» contro `SATOptions`, `SATViteOptions` e `CheckPageOptions`; gli snippet TypeScript sono passati da `tsc` contro i `.d.ts` del pacchetto.

#### F15-03 · App a pagina singola — S
**Dipendenze**: —
- `docs/guides/spa.md`: cambi di route, `observeDom`, contenuti caricati dopo, link rotti con `--not-found`, cosa resta fuori (stati che compaiono solo interagendo).

**Criteri di accettazione**
- [x] Il comportamento descritto corrisponde ai test SPA esistenti (`panel.spec.ts`, «SPA: a route change…»; `cli.spec.ts`, crawler e `--not-found`) e al codice (`onRouteChange`, `observeDom`, attesa di `networkidle` fino a 5 s).

#### F15-04 · Troubleshooting — S
**Dipendenze**: F13-02
- `docs/guides/troubleshooting.md`: il pannello non compare (`NODE_ENV`, ordine dei plugin, CSP), la CLI non trova Chromium, axe-core non installato, Fix with AI senza `claude` o senza accesso, un falso positivo (come segnalarlo).
- Ogni voce: sintomo, causa, soluzione.

**Criteri di accettazione**
- [x] Ogni messaggio d'errore citato è quello che il codice stampa davvero: provati in un'installazione dal tarball (CLI senza Chromium, server spento, `--axe` senza axe-core, plugin con `axe: true` senza axe-core, CSP) o copiati dal sorgente (Fix with AI).

#### F15-05 · Template da clonare — S
**Dipendenze**: F13-03
- `examples/vite-vanilla` usabile come punto di partenza: istruzioni con `npx degit flgisimone/SAT/examples/vite-vanilla`, già con plugin, script per `sat-check` e workflow di CI.

**Criteri di accettazione**
- [ ] Il comando `degit` funziona su `develop` dopo il push e l'esempio parte senza modifiche. *Provato il 25/10/2026: `degit` copia la cartella con `.github/workflows/sat.yml`; con il tarball di `npm pack` l'esempio fa `build`, `preview` e `check` senza modifiche (5 errori, 3 avvisi). `npm install` da npm fallisce (`ETARGET`, `^1.18.0` non pubblicata): si segna dopo la pubblicazione.*

## 3. Note

- **Il workflow sta in `examples/vite-vanilla`, non in `examples/cli`**: F15-05 vuole il template con plugin, `sat-check` e CI, e un workflow realistico serve la build con un server (`vite preview`), mentre `examples/cli` controlla un file con `file://`. Il template ha gli script `preview` (porta 4173 fissa) e `check`; il workflow li chiama e basta. `npm run smoke` ora avvia `npm run preview` quando un esempio lo ha, e poi `npm run check`, come il workflow. Il job fallisce sulla pagina con errori voluti: è il controllo che funziona, e il README del template lo dice.
- **Configurazione condivisa**: `sat.config.json` importato in `vite.config.js` con `with { type: "json" }` (senza, Vite 8 avvisa che il loader nativo non lo supporterà) e passato a `sat-check --config`. In TypeScript il JSON va tipizzato (`as SATViteOptions`): senza, `tsc` rifiuta `string` per la gravità.
- **GitLab CI** non è provato alla lettera: usa gli stessi script del workflow GitHub.
- **Report d'esempio** in `docs/guides/reports/`, rifatti da `npm run media` (server su `localhost:4173`, l'URL del template); l'HTML è pubblicato anche su Pages come `report.html` (`pages.yml`), perché GitHub mostra il sorgente.
- **Difetti trovati scrivendo le guide** (CONVENTIONS §11.2), corretti alla causa con test in `cli.spec.ts` che falliscono sul codice di prima:
  - `sat-check` si fermava su ogni pagina con una CSP stretta (`addScriptTag` bloccato): ora apre le pagine con `bypassCSP: true`.
  - `"axe": true` nel file di `--config` veniva sovrascritto da `--axe` assente: ora il flag aggiunge e non toglie.
  - Senza axe-core, `checkPage`/`sat-check --axe` stampavano «Cannot find module 'axe-core/axe.min.js'»: ora «axe-core is not installed: npm install -D axe-core».
- **SvelteKit**: il plugin Vite non aggiunge SAT, perché SvelteKit non chiama `transformIndexHtml` (verificato nel sorgente di `@sveltejs/kit` 2.70.3 e in un'app minima: nessun pannello col plugin, pannello con `satChecker()` nell'`onMount` di `+layout.svelte`). Il README lo dava per supportato: ora indica il layout, e il troubleshooting lo spiega.
- **«Ordine dei plugin»** (F15-04) non è nel troubleshooting: il plugin non dipende dall'ordine e non è emerso un caso in cui conti. Meglio una voce mancante che una falsa.
- **CHANGELOG**: voci nella 1.18.0, non ancora pubblicata, come per F14.

