# F21 — Dal pannello all'agente, e la 2.0.0

**Obiettivo**: dal pannello si mandano i problemi a qualsiasi agente MCP con «Send to agent» e si vede cosa ne fa: preso in carico, corretto, verificato. «Fix with AI» resta la scorciatoia per Claude Code. La fase chiude con la 2.0.0.

> **Stato: completata il 28/10/2026, versione 2.0.0** (la pubblica il maintainer, checklist in [F13 §4](13-pronto-da-provare.md#4-checklist-di-rilascio-maintainer)). Note di implementazione in fondo.

---

## 1. Decisioni

| Tema | Decisione | Motivo |
|---|---|---|
| «Send to agent» | Coda nel dev server, riempita dal pannello; `sat_issues` restituisce per primi i problemi in coda, segnati come richiesti dall'utente. Solo con `mcp: true`, con «Copy fix prompt» sempre disponibile | Funziona con qualsiasi agente MCP senza avviare processi; MCP senza sessioni non può spingere i problemi all'agente, quindi è l'agente a chiederli |
| «Fix with AI» | Resta per Claude Code (`ai: true`), come seconda azione accanto a «Send to agent» | È il percorso con un clic e SAT controlla gli strumenti concessi (F12) |
| Stato nel pannello | Dalle chiamate MCP: in coda → preso in carico (`sat_issues`) → corretto (sparito) → verificato (sparito dopo `sat_check` o `sat_recheck`) | L'utente vede che l'agente ha lavorato senza guardare il terminale |
| Versione | **2.0.0**, comprende F18–F21; la pubblica il maintainer | Un solo rilascio maggiore (F18) |
| Oltre Vite | Fuori da questo giro: un server MCP indipendente (`sat-check mcp`, Next.js e altri) entra nel piano quando lo chiedono almeno due persone | Regola dei feedback di F16 |

## 2. Task

#### F21-01 · Coda «Send to agent» — M
**Dipendenze**: F19-04
- Pannello (`src/ui/satUI.ts`): «Send to agent» su ogni problema e su ogni regola, solo con `mcp`; conferma annunciata con `aria-live`.
- `POST /__sat/queue` nel plugin con la protezione di `/__sat/results` (`refusal` di `fixServer.ts`): aggiunge o toglie id dalla coda per URL.
- `sat_issues`: i problemi in coda per primi, con `requested: true`, e una riga nel testo («The user asked to fix these first»); parametro `requested: true` per avere solo quelli.
- Un problema corretto esce dalla coda da solo.

**Criteri di accettazione**
- [x] Test unitari: coda senza token rifiutata, ordine in `sat_issues`, uscita dalla coda quando il problema sparisce.
- [x] Test in Chromium: clic su «Send to agent», poi `sat_issues` restituisce quel problema per primo.

#### F21-02 · Stato dell'agente nel pannello — S
**Dipendenze**: F21-01
- Il server manda alle pagine l'evento `sat:status` su `server.ws` quando cambia lo stato di un problema in coda.
- Il pannello mostra lo stato accanto al problema (icona e testo, non solo colore) e lo annuncia con `aria-live`.

**Criteri di accettazione**
- [x] Test in Chromium: in coda → preso in carico dopo `sat_issues` → verificato dopo la modifica della fixture e `sat_recheck`.
- [x] Il pannello passa SAT e axe-core in entrambi i temi (F11-06).

#### F21-03 · Azioni del problema riordinate — S
**Dipendenze**: F21-01
- Ordine delle azioni: «Send to agent» (con `mcp`), «Fix with Claude Code» (con `ai`), «Copy fix prompt» sempre. Senza `mcp` e senza `ai`, il pannello suggerisce `sat({ mcp: true })` una volta sola.

**Criteri di accettazione**
- [x] Test in Chromium sulle tre combinazioni di opzioni.

#### F21-04 · Demo, README e lancio della 2.0 — M
**Dipendenze**: F21-01 … F21-03
- README in alto: `npx sat-check init`, poi il ciclo (l'agente scrive, `sat_check`, corregge; dal pannello «Send to agent»).
- `demo/`, `npm run media`, `plan/lancio/` (video «L'agente controlla da solo», post per la 2.0), riferimenti portati alla 2.0.0.

**Criteri di accettazione**
- [x] Ogni materiale mostra solo funzioni della 2.0.0; nessuna promessa assoluta (F14).

#### F21-05 · Rilascio 2.0.0 — S
**Dipendenze**: F21-01 … F21-04
- `CHANGELOG.md` 2.0.0 (F18–F21, con la guida di migrazione di F18-05); versione in `package.json`; checklist del maintainer di F13 §4 aggiornata a `v2.0.0`.

**Criteri di accettazione**
- [x] `npm run verify`, `npm run verify:e2e` e `npm run smoke` passano; la pubblicazione resta al maintainer.

## 3. Note di implementazione

- **Coda** in `src/integrations/queueServer.ts` (`agentQueue`, `queueMiddleware`), tipi condivisi con la pagina in `src/sat/agentQueue.ts`. Chiave della pagina: percorso e query (`pageKey`), come le differenze di F19. Il pannello manda con ogni problema il suo `fixPrompt`: la pagina ha l'elemento, il server no; così `sat_issues({ requested: true })` restituisce i prompt dei soli problemi inviati.
- **Stati**: `queued` all'invio; `taken` quando `sat_issues` li restituisce; `fixed` quando i risultati della pagina non li hanno più; `verified` quando spariscono dopo `sat_check` o `sat_recheck` (anche passando direttamente da `taken`). `fixed` e `verified` escono dalla coda ma restano nell'elenco del pannello finché l'utente non preme «Clear done».
- **`sat:status`**: il server lo manda dopo ogni modifica della coda e dopo ogni risultato di una pagina che ha problemi inviati, anche senza cambiamenti: una pagina ricaricata dalla correzione ritrova così il suo elenco.
- **Pannello**: «Send to agent» è un interruttore (`aria-pressed`) e gli stati si aggiornano senza ridisegnare l'elenco, per non perdere il focus. Gli annunci: l'invio dal pannello, poi solo i cambi di stato fatti dall'agente.
- **«Fix with AI» diventa «Fix with Claude Code»** nei pulsanti; l'opzione resta `ai: true`.
- **Suggerimento di `mcp`**: solo dal plugin Vite (opzione interna `suggestMcp`), finché l'utente non lo chiude (`localStorage`).
- **Media**: `npm run media` mostra «Send to agent» con un endpoint finto che risponde come il dev server; le PNG sono rifatte, la GIF no perché `ffmpeg` non era installato: la rifà il maintainer prima del rilascio (checklist F13 §4).
- **Da provare a mano** prima del lancio: il ciclo con un agente vero (Claude Code e almeno un altro client MCP), che i test sostituiscono con chiamate dirette all'endpoint.
