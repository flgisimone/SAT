# F17 — Ogni agente IA e un messaggio solo

**Obiettivo**: SAT si presenta come una cosa sola, il pannello di accessibilità e SEO nel dev server Vite che passa i problemi all'IA, e funziona con qualsiasi agente che parla MCP (Claude Code, Cursor, Copilot in VS Code, Codex, Gemini CLI, Windsurf, Zed) con una riga di configurazione. axe-core diventa il motore consigliato e si accende da solo quando è installato. Esito: la 1.19.0, la prima pubblicata dopo la 1.6.0.

> **Stato: da fare.** Fonte: valutazione del 25/10/2026 (76 download al mese, 0 stelle; per CI, crawler ed estensione esistono `@axe-core/playwright`, `pa11y-ci`, `unlighthouse`, axe DevTools e Lighthouse; il pannello nel dev server con SEO e correzione con l'IA non ha un equivalente diffuso fuori da Astro).

---

## 1. Decisioni

| Tema | Decisione | Motivo |
|---|---|---|
| Messaggio | Il pannello in `vite dev`, accessibilità e SEO, con la correzione affidata all'agente dell'utente. Playwright, CLI ed estensione restano, in fondo al README come «Also» | È la parte senza alternative diffuse; il resto ce l'hanno strumenti più maturi |
| Agenti | **Server MCP nel plugin Vite** (`sat({ mcp: true })`, endpoint `/__sat/mcp`); nessun preset per singoli agenti nel pulsante | MCP lo parlano tutti gli agenti principali: un'implementazione sola, l'agente usa account, modello e permessi che l'utente ha già |
| «Fix with AI» | Resta com'è (Claude Code, `ai: true`): è il percorso con un clic | Con Claude Code SAT controlla gli strumenti concessi; per gli altri agenti c'è MCP |
| Dati della pagina | MCP spento di default; acceso, l'agente riceve problemi ed estratti di HTML e li manda al suo modello | Stessa regola di F12: opt-in, i dati li manda l'agente, non SAT |
| axe-core | Nel plugin Vite `axe` vale `true` da solo se `axe-core` si risolve dalla root del progetto; `axe: false` lo spegne. Resta peer dependency opzionale. Il comando d'installazione del README lo include | Toglie l'obiezione «perché non axe?»; nessuna rottura per chi non lo installa |
| Superficie | Nessuna rimozione né deprecazione: CLI, Playwright ed estensione restano, la documentazione li mette in secondo piano | Nessuna rottura di API; si decide dai feedback |
| Versione | **1.19.0**; la 1.18.0 non si pubblica | Un rilascio solo, il lancio parte da qui |

## 2. Task

#### F17-01 · Spike: MCP nei client — S
**Dipendenze**: —
- Dalla documentazione di ogni client, al 2026, verificare: trasporto HTTP «streamable» supportato, formato della configurazione (file e chiave), se manda `Origin`, versione del protocollo MCP accettata.
- Client: Claude Code, Cursor, VS Code (Copilot), Codex CLI, Gemini CLI, Windsurf, Zed.
- Versione corrente della specifica MCP e cosa richiede a un server minimo con risposte `application/json` (senza SSE): `initialize`, `notifications/initialized`, `tools/list`, `tools/call`, `ping`, header `Mcp-Protocol-Version`.
- Se un client importante supporta solo stdio: valutare un ponte `npx sat-check mcp --url <dev server>`; altrimenti niente ponte.

**Criteri di accettazione**
- [ ] Tabella client → trasporto, configurazione, `Origin` nelle note della fase, con link e data.
- [ ] Decisione su ponte stdio scritta nelle note.

#### F17-02 · Risultati dal pannello al dev server — S
**Dipendenze**: —
- Con `mcp: true`, dopo ogni esecuzione il controller manda a `POST /__sat/results` URL della pagina, titolo e `Issue[]` (con il componente sorgente di F12-04 quando c'è). Protezione uguale a `/__sat/fix`: loopback, `Origin` del dev server, token del modulo virtuale (`refusal` di `fixServer.ts`, riusata).
- Il server tiene l'ultimo risultato per URL, in memoria (nessun file). `ponytail:` solo le pagine aperte in questa esecuzione del dev server.
- Il plugin può chiedere una nuova analisi alle pagine aperte con un evento personalizzato su `server.ws` (`sat:run`); il controller risponde rieseguendo e rimandando i risultati.

**Criteri di accettazione**
- [ ] Test unitari: richiesta senza token, da un'altra origine o con `mcp` spento rifiutata; l'ultimo risultato sostituisce il precedente per lo stesso URL.
- [ ] `vite build` non contiene né l'endpoint né il token.

#### F17-03 · Endpoint MCP — M
**Dipendenze**: F17-01, F17-02
- `POST /__sat/mcp` in `src/integrations/mcpServer.ts`: JSON-RPC 2.0 con risposte `application/json`, senza SDK (`ponytail:` metodi minimi della specifica; l'SDK solo se servono sessioni o SSE). `GET` risponde 405.
- Strumenti:
  - `sat_issues` (`url` opzionale): le pagine controllate e, per ciascuna, il prompt di `fixPrompt` per tutti i problemi (l'estratto della pagina resta nel blocco dati) più l'elenco strutturato (regola, gravità, selettore, file sorgente, link alla documentazione).
  - `sat_recheck` (`url` opzionale): manda `sat:run`, aspetta i risultati (massimo 10 s) e restituisce cosa resta; se nessuna pagina è aperta lo dice («open the page in the browser»).
- Sicurezza: solo connessioni da loopback; header `Host` locale (`localhost`, `127.0.0.1`, `[::1]` con la porta del dev server), contro il DNS rebinding; un `Origin`, se presente, deve essere del dev server. Nessun token, perché la configurazione del client è fissa: lo scrive la nota in `SECURITY.md`.
- All'avvio di `vite dev` il plugin stampa l'URL dell'endpoint e il comando per Claude Code; con `server.strictPort` spento avvisa che la porta può cambiare.

**Criteri di accettazione**
- [ ] Test unitari: `initialize`, `tools/list`, `tools/call` per i due strumenti, metodo sconosciuto (errore JSON-RPC), richiesta non da loopback, `Host` estraneo, `Origin` estraneo, `mcp` spento.
- [ ] Test in Chromium con il plugin: la pagina con errori voluti manda i risultati, `sat_issues` restituisce i suoi 5 errori e 3 avvisi, `sat_recheck` dopo una modifica del file della fixture restituisce un problema in meno.
- [ ] Prova a mano con almeno due client della tabella di F17-01 (Claude Code e uno fra Cursor e VS Code), con l'esito nelle note.

#### F17-04 · axe acceso quando è installato — S
**Dipendenze**: —
- In `sat()` ([src/integrations/vite.ts](../src/integrations/vite.ts)): se `options.axe` non è impostato, `axe` è vero quando `createRequire(root).resolve('axe-core')` riesce. `axe: false` lo spegne.
- Riga all'avvio: «SAT: axe-core found, running it as an engine» (o niente se manca).
- Gli altri entry point (controller, React, Vue) non cambiano: senza un bundler che lo controlli, l'import di un pacchetto mancante rompe la pagina. La documentazione lo dice.
- `examples/` e `expected.json`: gli esempi Vite installano `axe-core`, i contatori attesi si aggiornano; lo smoke test lo prova dal tarball.

**Criteri di accettazione**
- [ ] Test unitari: con `axe-core` risolvibile il modulo virtuale importa l'adattatore, senza no, con `axe: false` no anche se c'è.
- [ ] `npm run smoke` passa con gli esempi aggiornati.

#### F17-05 · README, guide e documenti del progetto — M
**Dipendenze**: F17-03, F17-04
- README riscritto attorno al messaggio:
  - in alto il pannello in Vite e l'IA: `npm i -D seo-accessibility-tool axe-core`, `sat({ mcp: true })`, la riga per l'agente;
  - sezione «Use it with your AI agent»: configurazione per ogni client della tabella di F17-01, `sat_issues` e `sat_recheck`, cosa arriva al modello; poi «Fix with AI» con Claude Code;
  - poi gli altri framework (React, Vue, Svelte, Angular, vanilla);
  - in fondo «Also»: Playwright, CLI, estensione, risultati senza pannello;
  - «What SAT does not do» resta visibile.
- `docs/guides/`: guida nuova `ai-agents.md`; `configuration.md` con `mcp` e il nuovo default di `axe`; `troubleshooting.md` con porta cambiata, pagina non aperta, client senza HTTP.
- `SECURITY.md`: l'endpoint MCP e cosa protegge. `CONTRIBUTING.md` se cambia il setup.
- `plan/README.md`: decisioni (agenti, axe, superficie, versione), fase F17 nella tabella.

**Criteri di accettazione**
- [ ] Ogni configurazione del README corrisponde a quella verificata in F17-01, con la data.
- [ ] Gli esempi di codice del README sono provati (smoke test o test in Chromium).

#### F17-06 · Demo e materiali di lancio — S
**Dipendenze**: F17-05
- `demo/`: la barra spiega il pannello e rimanda alla configurazione per gli agenti; la pagina resta quella di F13-04.
- `plan/lancio/`: video, tutorial per Dev.to e post per le community riscritti attorno al messaggio; un video «SAT + il tuo agente via MCP»; riferimenti alla 1.18.0 portati alla 1.19.0.
- `npm run media` rigenera le immagini se il pannello cambia.

**Criteri di accettazione**
- [ ] Ogni materiale mostra solo funzioni della 1.19.0; nessuna promessa assoluta (F14).

#### F17-07 · Rilascio 1.19.0 — S
**Dipendenze**: F17-01 … F17-06
- `CHANGELOG.md`: la 1.18.0 confluisce nella 1.19.0, mai pubblicata; «Upgrading from 1.6.0» passa alla 1.19.0.
- Versione in `package.json`; checklist del maintainer di F13 §4 aggiornata a `v1.19.0`; F13, F15, F16 rimandano alla 1.19.0 per i passi dopo la pubblicazione.

**Criteri di accettazione**
- [ ] `npm run verify`, `npm run verify:e2e` e `npm run smoke` passano; la pubblicazione resta al maintainer.

## 3. Note

_Da scrivere durante la fase._
