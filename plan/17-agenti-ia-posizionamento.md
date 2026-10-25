# F17 — Ogni agente IA e un messaggio solo

**Obiettivo**: SAT si presenta come una cosa sola, il pannello di accessibilità e SEO nel dev server Vite che passa i problemi all'IA, e funziona con qualsiasi agente che parla MCP (Claude Code, Cursor, Copilot in VS Code, Codex, Gemini CLI, Windsurf, Zed) con una riga di configurazione. axe-core diventa il motore consigliato e si accende da solo quando è installato. Esito: la 1.19.0, la prima pubblicata dopo la 1.6.0.

> **Stato: completata (25/10/2026), con un passo del maintainer aperto**: la prova a mano con Cursor o VS Code (F17-03), che qui non sono installati. Versione 1.19.0, da pubblicare a cura del maintainer (checklist di F13 §4). Fonte: valutazione del 25/10/2026 (76 download al mese, 0 stelle; per CI, crawler ed estensione esistono `@axe-core/playwright`, `pa11y-ci`, `unlighthouse`, axe DevTools e Lighthouse; il pannello nel dev server con SEO e correzione con l'IA non ha un equivalente diffuso fuori da Astro).

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
- [x] Tabella client → trasporto, configurazione, `Origin` nelle note della fase, con link e data.
- [x] Decisione su ponte stdio scritta nelle note. *Nessun ponte: tutti e sette i client supportano HTTP.*

#### F17-02 · Risultati dal pannello al dev server — S
**Dipendenze**: —
- Con `mcp: true`, dopo ogni esecuzione il controller manda a `POST /__sat/results` URL della pagina, titolo e `Issue[]` (con il componente sorgente di F12-04 quando c'è). Protezione uguale a `/__sat/fix`: loopback, `Origin` del dev server, token del modulo virtuale (`refusal` di `fixServer.ts`, riusata).
- Il server tiene l'ultimo risultato per URL, in memoria (nessun file). `ponytail:` solo le pagine aperte in questa esecuzione del dev server.
- Il plugin può chiedere una nuova analisi alle pagine aperte con un evento personalizzato su `server.ws` (`sat:run`); il controller risponde rieseguendo e rimandando i risultati.

**Criteri di accettazione**
- [x] Test unitari: richiesta senza token, da un'altra origine o con `mcp` spento rifiutata; l'ultimo risultato sostituisce il precedente per lo stesso URL. *`tests/viteMcp.test.ts`, `tests/mcpResults.test.ts`.*
- [x] `vite build` non contiene né l'endpoint né il token. *Test di build in `tests/browser/vite.spec.ts` con `ai` e `mcp` accesi.*

#### F17-03 · Endpoint MCP — M
**Dipendenze**: F17-01, F17-02
- `POST /__sat/mcp` in `src/integrations/mcpServer.ts`: JSON-RPC 2.0 con risposte `application/json`, senza SDK (`ponytail:` metodi minimi della specifica; l'SDK solo se servono sessioni o SSE). `GET` risponde 405.
- Strumenti:
  - `sat_issues` (`url` opzionale): le pagine controllate e, per ciascuna, il prompt di `fixPrompt` per tutti i problemi (l'estratto della pagina resta nel blocco dati) più l'elenco strutturato (regola, gravità, selettore, file sorgente, link alla documentazione).
  - `sat_recheck` (`url` opzionale): manda `sat:run`, aspetta i risultati (massimo 10 s) e restituisce cosa resta; se nessuna pagina è aperta lo dice («open the page in the browser»).
- Sicurezza: solo connessioni da loopback; header `Host` locale (`localhost`, `127.0.0.1`, `[::1]` con la porta del dev server), contro il DNS rebinding; un `Origin`, se presente, deve essere del dev server. Nessun token, perché la configurazione del client è fissa: lo scrive la nota in `SECURITY.md`.
- All'avvio di `vite dev` il plugin stampa l'URL dell'endpoint e il comando per Claude Code; con `server.strictPort` spento avvisa che la porta può cambiare.

**Criteri di accettazione**
- [x] Test unitari: `initialize`, `tools/list`, `tools/call` per i due strumenti, metodo sconosciuto (errore JSON-RPC), richiesta non da loopback, `Host` estraneo, `Origin` estraneo, `mcp` spento. *Anche le richieste 2026-07-28: `server/discover`, header da confrontare, versione sconosciuta; `sat_recheck` con un client WebSocket al posto della pagina.*
- [x] Test in Chromium con il plugin: la pagina con errori voluti manda i risultati, `sat_issues` restituisce i suoi 5 errori e 3 avvisi, `sat_recheck` dopo una modifica del file della fixture restituisce un problema in meno.
- [ ] Prova a mano con almeno due client della tabella di F17-01 (Claude Code e uno fra Cursor e VS Code), con l'esito nelle note. *Claude Code 2.1.310 e il client dell'SDK TypeScript ufficiale (quello di Gemini CLI) funzionano; Cursor e VS Code non sono installati qui: passo del maintainer.*

#### F17-04 · axe acceso quando è installato — S
**Dipendenze**: —
- In `sat()` ([src/integrations/vite.ts](../src/integrations/vite.ts)): se `options.axe` non è impostato, `axe` è vero quando `createRequire(root).resolve('axe-core')` riesce. `axe: false` lo spegne.
- Riga all'avvio: «SAT: axe-core found, running it as an engine» (o niente se manca).
- Gli altri entry point (controller, React, Vue) non cambiano: senza un bundler che lo controlli, l'import di un pacchetto mancante rompe la pagina. La documentazione lo dice.
- `examples/` e `expected.json`: gli esempi Vite installano `axe-core`, i contatori attesi si aggiornano; lo smoke test lo prova dal tarball.

**Criteri di accettazione**
- [x] Test unitari: con `axe-core` risolvibile il modulo virtuale importa l'adattatore, senza no, con `axe: false` no anche se c'è.
- [x] `npm run smoke` passa con gli esempi aggiornati. *vite-vanilla con axe-core: 4 errori e 3 avvisi nel pannello (`panelWithAxe`).*

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
- [x] Ogni configurazione del README corrisponde a quella verificata in F17-01, con la data.
- [x] Gli esempi di codice del README sono provati (smoke test o test in Chromium). *`sat({ mcp: true })` con `strictPort` è il config di vite-vanilla (smoke); il comando per Claude Code è quello della prova a mano.*

#### F17-06 · Demo e materiali di lancio — S
**Dipendenze**: F17-05
- `demo/`: la barra spiega il pannello e rimanda alla configurazione per gli agenti; la pagina resta quella di F13-04.
- `plan/lancio/`: video, tutorial per Dev.to e post per le community riscritti attorno al messaggio; un video «SAT + il tuo agente via MCP»; riferimenti alla 1.18.0 portati alla 1.19.0.
- `npm run media` rigenera le immagini se il pannello cambia.

**Criteri di accettazione**
- [x] Ogni materiale mostra solo funzioni della 1.19.0; nessuna promessa assoluta (F14). *I video sono sette: il nuovo è il 2, quello del feedback diventa il 7. Conteggi con axe verificati (4 → 3 errori dopo l'`alt`).*

#### F17-07 · Rilascio 1.19.0 — S
**Dipendenze**: F17-01 … F17-06
- `CHANGELOG.md`: la 1.18.0 confluisce nella 1.19.0, mai pubblicata; «Upgrading from 1.6.0» passa alla 1.19.0.
- Versione in `package.json`; checklist del maintainer di F13 §4 aggiornata a `v1.19.0`; F13, F15, F16 rimandano alla 1.19.0 per i passi dopo la pubblicazione.

**Criteri di accettazione**
- [x] `npm run verify`, `npm run verify:e2e` e `npm run smoke` passano; la pubblicazione resta al maintainer. *190 test unitari, 81 in Chromium, smoke con il tarball 1.19.0.*

## 3. Note

### F17-01 · MCP nei client (verificato il 25/10/2026)

**Specifica.** La versione corrente è la [2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/changelog.md): niente più handshake `initialize`, versione e capacità del client in `_meta` di ogni richiesta, `server/discover` obbligatorio, `ping` rimosso, `resultType` in ogni risultato, header `MCP-Protocol-Version`, `Mcp-Method` e `Mcp-Name` obbligatori e da confrontare col corpo (`400`, `-32020`), versione sconosciuta → `400` con `UnsupportedProtocolVersionError` (`-32022`), metodo sconosciuto → `404` con `-32601`, `GET`/`DELETE` → `405`, notifiche → `202`. `Origin` presente e non valido → `403` ([Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http.md)). I client in circolazione parlano ancora le versioni con `initialize` (l'SDK TypeScript 1.32.2 usa la 2025-11-25): il server di SAT è quindi **dual-era** ([Versioning](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning.md)): `initialize` sceglie la versione vecchia, una richiesta con `_meta` quella nuova. Senza sessioni e senza SSE, risposte `application/json`.

| Client | HTTP streamable | Configurazione | Fonte |
|---|---|---|---|
| Claude Code | sì | `claude mcp add --transport http sat <url>`; `.mcp.json` → `mcpServers.sat = { type: "http", url }` (senza `type` è stdio) | [code.claude.com/docs/en/mcp](https://code.claude.com/docs/en/mcp) |
| Cursor | sì | `.cursor/mcp.json` o `~/.cursor/mcp.json` → `mcpServers.sat = { url }` | [cursor.com/docs/context/mcp](https://cursor.com/docs/context/mcp) |
| VS Code (Copilot) | sì | `.vscode/mcp.json` → `servers.sat = { type: "http", url }`; formato portabile `.mcp.json` con `mcpServers` | [code.visualstudio.com/docs/agents/reference/mcp-configuration](https://code.visualstudio.com/docs/agents/reference/mcp-configuration) |
| Codex CLI | sì | `~/.codex/config.toml` (o `.codex/config.toml` nei progetti fidati) → `[mcp_servers.sat] url = …`; `codex mcp add sat --url <url>` | [learn.chatgpt.com/docs/extend/mcp](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) |
| Gemini CLI | sì | `.gemini/settings.json` → `mcpServers.sat = { httpUrl }` (`url` è SSE); `gemini mcp add --transport http sat <url>` | [geminicli.com/docs/tools/mcp-server](https://geminicli.com/docs/tools/mcp-server/) |
| Windsurf | sì | `~/.codeium/windsurf/mcp_config.json` → `mcpServers.sat = { serverUrl }`; la documentazione è passata a docs.devin.ai (Devin Desktop: `~/.config/devin/mcp_config.json`) | [docs.devin.ai/desktop/cascade/mcp](https://docs.devin.ai/desktop/cascade/mcp) |
| Zed | sì | `settings.json` → `context_servers.sat = { url }`; senza `Authorization` propone OAuth solo se il server lo chiede | [zed.dev/docs/ai/mcp](https://zed.dev/docs/ai/mcp) |

`Origin`: nessuna documentazione lo dichiara; sono processi Node, Rust o Electron fuori da una pagina e le richieste di Claude Code e dell'SDK TypeScript arrivano senza. Il server accetta le richieste senza `Origin` e rifiuta quelle con un `Origin` diverso dal dev server.

**Ponte stdio: no.** Tutti e sette supportano HTTP; la guida di troubleshooting dice cosa fare con un client solo stdio e chiede di aprire una issue.

### F17-03 · Prove a mano

- **Claude Code 2.1.310** (`claude -p --mcp-config` con `type: "http"`, pagina d'esempio aperta in Chromium): `sat_issues` e `sat_recheck` restituiscono 5 errori (color-contrast, form-label, image-alt, html-lang, seo-meta) e 3 avvisi (heading-levels, link-text, canonical). Prima prova fallita per colpa del test (`spawnSync` bloccava il processo del dev server), non del server.
- **SDK TypeScript ufficiale 1.32.2** (`StreamableHTTPClientTransport`, lo stesso di Gemini CLI; protocollo 2025-11-25): `initialize` con istruzioni e `serverInfo`, `tools/list`, `sat_issues` (5 errori, 3 avvisi), `sat_recheck` con `url: "/"`.
- Cursor e VS Code non sono installati sulla postazione: la prova con uno dei due resta da fare al maintainer prima del lancio.

### Scelte durante la fase

- `sat_recheck` aspetta 1 s prima di chiedere la nuova analisi: senza, la pagina rispondeva prima che Vite la ricaricasse dopo la modifica dell'agente (test in Chromium). `ponytail:` attesa fissa come `HMR_DELAY` di F12.
- `sat:run` accende SAT nella pagina se era spento: altrimenti un agente non avrebbe risultati finché l'utente non preme play.
- Con axe acceso la pagina d'esempio dà 4 errori e 3 avvisi (axe accetta il placeholder come nome del campo email): `expected.json` ha `panelWithAxe`, che lo smoke test usa per vite-vanilla; `sat-check` resta senza axe e confronta gli 8 problemi di SAT.
- I messaggi di rifiuto di `refusal` dicono «SAT accepts…» invece di «Fix with AI accepts…», perché valgono anche per `/__sat/results`.
