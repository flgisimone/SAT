# F20 — Prevenzione: l'agente scrive giusto e non torna indietro

**Obiettivo**: l'agente conosce le regole prima di scrivere, controlla da solo dopo ogni modifica alla UI e non può introdurre problemi nuovi in CI. Un comando, `sat-check init`, prepara il progetto: istruzioni per l'agente, configurazione MCP, skill e hook di Claude Code.

> **Stato: completata il 28/10/2026.** Dipende da F19 (ID stabili per la baseline, `sat_check` per l'hook). Fonte: analisi del cutover del 28/10/2026.

---

## 1. Decisioni

| Tema | Decisione | Motivo |
|---|---|---|
| Istruzioni | `sat-check init` scrive una sezione delimitata in `AGENTS.md` (e il rimando in `CLAUDE.md` se c'è) e la configurazione MCP dei client trovati nel progetto; si può rilanciare senza duplicare | `AGENTS.md` lo leggono quasi tutti gli agenti; una sezione delimitata si aggiorna senza toccare il resto |
| Regole all'agente | Le pagine di `docs/rules/` entrano nel pacchetto e arrivano via MCP (strumento `sat_rule` e resource) | L'agente legge il pattern corretto prima di scrivere il componente |
| Hook | Solo per i client che li documentano, scelti nello spike; Claude Code per primo. Gli altri usano l'istruzione in `AGENTS.md` | Con l'hook il controllo non dipende dalla memoria dell'agente |
| Baseline | `sat-check --baseline <file>`: i problemi già presenti passano, i nuovi fanno fallire; `--update-baseline` la riscrive | Le PR scritte da un agente non devono peggiorare la pagina, anche in un progetto con problemi vecchi |

## 2. Task

#### F20-01 · Spike: istruzioni, skill e hook nei client — S
**Dipendenze**: —
- Dalla documentazione di ogni client di F17-01, al 2026: file di istruzioni letti (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules`, `GEMINI.md`…), supporto ai prompt e alle resource MCP, hook dopo una modifica di file (evento, formato, come si restituisce un testo all'agente), skill.
- Decidere quali client ricevono hook e skill da `init`.

**Criteri di accettazione**
- [x] Tabella client → istruzioni, prompt e resource MCP, hook, skill nelle note, con link e data. *Hook e skill da `init` solo per Claude Code.*

#### F20-02 · Regole via MCP — S
**Dipendenze**: F18
- `docs/rules/*.md` nel pacchetto (`files` di `package.json`).
- Strumento `sat_rule({ id })` e resource `sat://rules/<id>` (con `resources/list`) in `src/integrations/mcpServer.ts`, se lo spike conferma che i client le leggono; altrimenti solo lo strumento.
- Le istruzioni del server (`instructions`) dicono di leggere la regola prima di correggere.

**Criteri di accettazione**
- [x] Test unitari: `sat_rule` per una regola esistente e per una sconosciuta; ogni regola del registro ha la sua pagina nel pacchetto (`npm pack --dry-run`). *`tests/viteMcp.test.ts` confronta registro e pagine; `npm run smoke` controlla che il tarball abbia tutte le pagine di `docs/rules/`.*

#### F20-03 · Prompt MCP — S
**Dipendenze**: F19-03, F20-01
- `prompts/list` e `prompts/get` con `sat-fix` (correggi i problemi della pagina indicata, poi verifica con `sat_check`) e `sat-audit` (controlla le route indicate e riassumi).
- Solo se lo spike conferma che i client li mostrano (Claude Code come comandi slash).

**Criteri di accettazione**
- [x] Test unitari dei due metodi; prova a mano con Claude Code nelle note.

#### F20-04 · `sat-check init` — M
**Dipendenze**: F20-01
- `src/headless/cli.ts`: sottocomando `init` con:
  - aggiunta di `sat({ mcp: true })` a `vite.config.*` solo se il file è semplice, altrimenti stampa la riga da aggiungere;
  - sezione delimitata (`<!-- sat:start -->` … `<!-- sat:end -->`) in `AGENTS.md`: quando chiamare `sat_check`, come leggere i problemi, cosa non fare (non correggere nel DOM, non spegnere le regole);
  - configurazione MCP per i client trovati (`.mcp.json`, `.cursor/mcp.json`, `.vscode/mcp.json`…) con i formati di F17-01.
- `--dry-run` stampa le modifiche; nessun file viene sovrascritto fuori dalla sezione o dalla chiave `sat`.

**Criteri di accettazione**
- [x] Test in una cartella temporanea: due esecuzioni danno lo stesso risultato; un `AGENTS.md` esistente conserva il resto; `--dry-run` non scrive. *`tests/init.test.ts`.*

#### F20-05 · Skill e hook per Claude Code — M
**Dipendenze**: F20-04, F19-03
- `init --claude`: skill in `.claude/skills/sat/SKILL.md` (come si usa SAT, come si correggono i problemi più comuni, rimando a `sat_rule`) e hook dopo le modifiche ai file della UI (`.tsx`, `.jsx`, `.vue`, `.svelte`, `.html`, `.css`) che chiama `sat-check hook`.
- `sat-check hook`: legge l'evento, chiede al dev server `sat_check` sulle route note e restituisce all'agente solo i problemi `new` (F19-04); con il dev server spento non fa nulla ed esce senza errori.
- Gli altri client della tabella di F20-01 che hanno hook: stesso comando, se costa poco; altrimenti `ponytail:` e una riga nelle note.

**Criteri di accettazione**
- [x] Test unitari di `sat-check hook` con un evento finto: dev server spento, nessun problema nuovo, problemi nuovi. *`tests/hook.test.ts`.*
- [x] Prova a mano con Claude Code: dopo una modifica che toglie un `alt`, l'agente riceve il problema senza chiederlo.

#### F20-06 · Baseline in CI — S
**Dipendenze**: F19-04
- `sat-check --baseline <file>` e `--update-baseline`: file JSON con gli id per URL; i limiti (`--max-errors`…) contano solo i problemi fuori dalla baseline; il report dice quali sono stati corretti.
- `docs/guides/ci.md` e il workflow di `examples/vite-vanilla`.

**Criteri di accettazione**
- [x] Test: baseline uguale → esce con 0; un problema nuovo → esce con 1 e lo indica; `--update-baseline` riscrive il file. *`tests/baseline.test.ts` e `tests/browser/cli.spec.ts`.*

#### F20-07 · Documentazione — S
**Dipendenze**: F20-02 … F20-06
- README (sezione «Set up your agent» con `npx sat-check init`), `docs/guides/ai-agents.md`, `ci.md`, `CHANGELOG.md`.

**Criteri di accettazione**
- [x] `npm run verify`, `npm run verify:e2e` e `npm run smoke` passano.

## 3. Note

### F20-01 · Istruzioni, prompt, resource, hook e skill nei client (verificato il 28/10/2026)

| Client | Istruzioni | Prompt MCP | Resource MCP | Hook dopo una modifica | Skill |
|---|---|---|---|---|---|
| Claude Code | `CLAUDE.md` (importa `@AGENTS.md`) | sì, `/mcp__<server>__<prompt>` ([mcp](https://code.claude.com/docs/en/mcp)) | sì, `@server:uri` e strumenti per leggerle | `PostToolUse` in `.claude/settings.json`, `matcher` sul nome dello strumento, evento JSON su stdin (`tool_input.file_path`), testo all'agente con `hookSpecificOutput.additionalContext` o exit 2 ([hooks](https://code.claude.com/docs/en/hooks)) | `.claude/skills/<nome>/SKILL.md`, frontmatter facoltativo ([skills](https://code.claude.com/docs/en/skills)) |
| Cursor | `AGENTS.md`, `.cursor/rules` | sì | sì ([mcp](https://cursor.com/docs/context/mcp)) | `.cursor/hooks.json`: `afterFileEdit` senza uscita verso l'agente; `postToolUse` con `additional_context` ([hooks](https://cursor.com/docs/agent/hooks)) | — |
| VS Code (Copilot) | `AGENTS.md`, `.github/copilot-instructions.md` | sì, `/<server>.<prompt>` | sì, Add Context → MCP Resources ([mcp](https://code.visualstudio.com/docs/copilot/customization/mcp-servers)) | sì (pagina «Hooks»), non approfondito | sì (Agent Skills), non approfondito |
| Gemini CLI | `GEMINI.md` (configurabile per `AGENTS.md`) | sì, come comandi slash | sì, `@server://…` ([mcp](https://geminicli.com/docs/tools/mcp-server/)) | `AfterTool` in `.gemini/settings.json`, `hookSpecificOutput.additionalContext` ([hooks](https://geminicli.com/docs/hooks/)) | — |
| Codex CLI, Windsurf, Zed | `AGENTS.md` | non verificato | non verificato | non verificato | — |

**Decisione.** `init` scrive `AGENTS.md` per tutti; resource e prompt li servono tutti i client principali, quindi F20-02 e F20-03 si fanno per intero. Hook e skill solo per Claude Code (`--claude`). `ponytail:` Cursor (`postToolUse`) e Gemini CLI (`AfterTool`) potrebbero usare lo stesso `sat-check hook`, ma ognuno ha un evento e un formato d'uscita propri: si aggiungono quando qualcuno li chiede.

### Prove a mano (28/10/2026, Claude Code 2.1.310)

Progetto temporaneo con `index.html`, `vite.config.js` semplice e SAT installato dalla cartella del repository.
- `sat-check init --claude --port 5199`: crea `AGENTS.md`, `.mcp.json`, la skill e l'hook; aggiunge `sat({ mcp: true })` a `vite.config.js`. Con `vite dev` spento `sat-check hook` non stampa nulla ed esce con 0.
- **Hook**: `claude -p` con l'istruzione di togliere l'`alt` dall'`<img>` e di riportare cosa ha ricevuto: «PostToolUse:Edit hook additional context: SAT: your edit added 1 issue on /. - error image-alt: <img src="/logo.svg"> has no alt attribute…». L'agente lo riceve senza chiederlo.
- **Prompt**: `claude -p "/mcp__sat__sat-audit /" --mcp-config .mcp.json` chiama `sat_check` e riassume 1 errore e 3 avvisi per regola, senza modificare file.

### Scelte durante la fase

- Le pagine delle regole le legge il server dalla cartella del pacchetto (`docs/rules/`, accanto a `package.json`): niente copia in `dist/`, e l'elenco viene dalla cartella, non dal registro; un test controlla che coincidano.
- L'hook confronta con l'ultima risposta che il server ha dato per quella route (la stessa memoria di `sat_check`): al primo controllo dopo l'avvio di `vite dev` non ha un termine di paragone e elenca i problemi una volta, dicendo che possono essere precedenti alla modifica. `ponytail:` niente file di stato dell'hook.
- Le route dell'hook stanno nel comando (`sat-check hook --port 5173 / /cart`), `/` di default.
- `init` non riscrive un JSON con commenti né un `vite.config` con più `plugins: [` o import su più righe: stampa la riga da aggiungere. TOML di Codex: solo stampato.
- La baseline è per URL, con gli `id` di F19-04; `--update-baseline` conserva le URL non controllate in quell'esecuzione. L'esempio `vite-vanilla` resta senza baseline (lo smoke test si aspetta l'uscita 1); il workflow ha il commento su come attivarla.
