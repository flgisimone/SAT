# F19 — Il ciclo dell'agente

**Obiettivo**: l'agente verifica da solo quello che ha scritto. Dal server MCP controlla qualsiasi route del dev server in Chromium headless, senza che l'utente apra la pagina; sa cosa ha corretto, cosa resta e cosa ha rotto; per i problemi visivi riceve l'immagine dell'elemento; con React arriva al file e alla riga come già succede con Vue e Svelte.

> **Stato: da fare.** Dipende da F18. Fonte: analisi del cutover del 28/10/2026.

---

## 1. Decisioni

| Tema | Decisione | Motivo |
|---|---|---|
| Controllo headless | Strumento MCP `sat_check`: il dev server apre la route in Chromium con Playwright, riusando `checkPage`; Playwright resta peer dependency opzionale e, se manca, lo strumento lo dice con il comando d'installazione | Oggi `sat_recheck` funziona solo con la pagina aperta dall'utente: l'agente non è autonomo |
| Pagine aperte e headless | `sat_issues` e `sat_recheck` restano per le pagine aperte; `sat_check` per tutto il resto | Le pagine aperte hanno lo stato dell'utente (login, dati), quelle headless no |
| Identità dei problemi | ID stabile = regola + selettore (+ indice per i duplicati); il server tiene l'esecuzione precedente per URL | Serve a dire corretti / nuovi / rimasti, e alla baseline di F20 |
| Immagini | Solo con `sat_check` e su richiesta (`screenshots: true`), per le regole visive (`color-contrast`, `target-size`, `h1-visible`) | Le immagini costano token; dal pannello non si catturano senza permessi |
| Sorgente React | Prima lo spike senza trasformazioni (`_debugStack` delle fiber di React 19 + source map di Vite); se non regge, `data-sat-source` opt-in solo sugli elementi HTML | La pagina e il codice dell'app non si toccano finché si può (F12-04, CONVENTIONS §6.3) |

## 2. Task

#### F19-01 · Spike: Playwright dal dev server — S
**Dipendenze**: —
- Dal plugin Vite, risolvere `playwright` o `@playwright/test` dalla root del progetto e lanciare Chromium; misurare l'avvio a freddo e a caldo (browser tenuto aperto fra le chiamate, chiuso con il dev server).
- Cosa succede senza i browser installati (`npx playwright install chromium`), con `server.https`, con una route protetta da login.
- Decidere: browser condiviso o uno per chiamata, timeout, limite di pagine parallele.

**Criteri di accettazione**
- [ ] Tempi e decisioni nelle note della fase; i limiti (login, dati) scritti come `ponytail:`.

#### F19-02 · Spike: file e riga con React 19 — S
**Dipendenze**: —
- In dev, dal nodo DOM alla fiber (`__reactFiber$…`), poi `_debugStack` del suo owner; dallo stack all'URL del modulo servito da Vite e alla riga, poi alla riga del sorgente con la source map del modulo (`server.transformRequest` o il file `.map`).
- Provare con React 19 e `@vitejs/plugin-react` (Babel e SWC/oxc); con React 18 (`_debugSource`).
- Se lo stack non porta al componente giusto in almeno 9 casi su 10 della fixture: piano B, trasformazione opt-in `data-sat-source` sui soli tag in minuscolo, nel plugin Vite.

**Criteri di accettazione**
- [ ] Esito e scelta nelle note, con la fixture usata.

#### F19-03 · Strumento `sat_check` — M
**Dipendenze**: F18, F19-01
- `src/integrations/mcpServer.ts`: `sat_check({ url, viewport?, colorScheme?, waitFor? })`; `url` è un path del dev server o un URL sulla sua origine (nessun altro host: il server non diventa un proxy).
- Riusa `checkPage` di `src/headless/playwright.ts` con le opzioni del plugin (axe compreso); risultato nello stesso formato di `sat_issues` (prompt di `fixPrompt` ed elenco strutturato).
- Messaggi chiari se Playwright o Chromium mancano, se la pagina non risponde, se va in timeout.

**Criteri di accettazione**
- [ ] Test unitari: URL di un altro host rifiutato, Playwright mancante, parametri non validi.
- [ ] Test in Chromium: `sat_check({ url: '/' })` sulla pagina con errori voluti restituisce i conteggi di `expected.json` senza nessuna pagina aperta.

#### F19-04 · ID stabili e differenze fra esecuzioni — S
**Dipendenze**: F18
- `id` in `ReportedIssue` (`src/sat/mcpResults.ts`) e nel report di `checkPage`: regola + selettore, con indice per i duplicati.
- Il server tiene l'esecuzione precedente per URL; `sat_recheck` e `sat_check` restituiscono `fixed`, `new` e `remaining`, e il testo per il modello comincia da lì («2 fixed, 1 new: …»).

**Criteri di accettazione**
- [ ] Test unitari: stesso problema → stesso id fra due esecuzioni; un problema sparito è `fixed`, uno comparso `new`.

#### F19-05 · Immagine dell'elemento — S
**Dipendenze**: F19-03
- Con `screenshots: true`, `sat_check` aggiunge al risultato un contenuto `image` (PNG, `locator.screenshot` con un margine) per ogni problema delle regole visive, al massimo 5.
- Il testo dice a quale problema corrisponde ogni immagine.

**Criteri di accettazione**
- [ ] Test in Chromium: il problema di contrasto della fixture ha un'immagine; senza `screenshots` nessuna immagine.

#### F19-06 · File e riga per React — M
**Dipendenze**: F19-02
- Secondo l'esito dello spike: `componentSource` (`src/core/fixPrompt.ts`) legge React come legge Vue e Svelte, oppure il plugin Vite aggiunge `data-sat-source` con l'opzione scelta nello spike.
- Il campo `component` arriva nel prompt, in MCP e nel pannello.

**Criteri di accettazione**
- [ ] Test con `examples/react` in dev: il prompt contiene il file e la riga giusti; in `vite build` non c'è nulla.

#### F19-07 · Documentazione — S
**Dipendenze**: F19-03 … F19-06
- README («Use it with your AI agent»), `docs/guides/ai-agents.md`, `troubleshooting.md` (Playwright mancante, route con login), `SECURITY.md` (`sat_check` resta sull'origine del dev server).

**Criteri di accettazione**
- [ ] `tests/guides.test.ts` passa; `npm run verify` e `npm run verify:e2e` passano.
