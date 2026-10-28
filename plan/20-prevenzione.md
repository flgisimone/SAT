# F20 — Prevenzione: l'agente scrive giusto e non torna indietro

**Obiettivo**: l'agente conosce le regole prima di scrivere, controlla da solo dopo ogni modifica alla UI e non può introdurre problemi nuovi in CI. Un comando, `sat-check init`, prepara il progetto: istruzioni per l'agente, configurazione MCP, skill e hook di Claude Code.

> **Stato: da fare.** Dipende da F19 (ID stabili per la baseline, `sat_check` per l'hook). Fonte: analisi del cutover del 28/10/2026.

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
- [ ] Tabella client → istruzioni, prompt e resource MCP, hook, skill nelle note, con link e data.

#### F20-02 · Regole via MCP — S
**Dipendenze**: F18
- `docs/rules/*.md` nel pacchetto (`files` di `package.json`).
- Strumento `sat_rule({ id })` e resource `sat://rules/<id>` (con `resources/list`) in `src/integrations/mcpServer.ts`, se lo spike conferma che i client le leggono; altrimenti solo lo strumento.
- Le istruzioni del server (`instructions`) dicono di leggere la regola prima di correggere.

**Criteri di accettazione**
- [ ] Test unitari: `sat_rule` per una regola esistente e per una sconosciuta; ogni regola del registro ha la sua pagina nel pacchetto (`npm pack --dry-run`).

#### F20-03 · Prompt MCP — S
**Dipendenze**: F19-03, F20-01
- `prompts/list` e `prompts/get` con `sat-fix` (correggi i problemi della pagina indicata, poi verifica con `sat_check`) e `sat-audit` (controlla le route indicate e riassumi).
- Solo se lo spike conferma che i client li mostrano (Claude Code come comandi slash).

**Criteri di accettazione**
- [ ] Test unitari dei due metodi; prova a mano con Claude Code nelle note.

#### F20-04 · `sat-check init` — M
**Dipendenze**: F20-01
- `src/headless/cli.ts`: sottocomando `init` con:
  - aggiunta di `sat({ mcp: true })` a `vite.config.*` solo se il file è semplice, altrimenti stampa la riga da aggiungere;
  - sezione delimitata (`<!-- sat:start -->` … `<!-- sat:end -->`) in `AGENTS.md`: quando chiamare `sat_check`, come leggere i problemi, cosa non fare (non correggere nel DOM, non spegnere le regole);
  - configurazione MCP per i client trovati (`.mcp.json`, `.cursor/mcp.json`, `.vscode/mcp.json`…) con i formati di F17-01.
- `--dry-run` stampa le modifiche; nessun file viene sovrascritto fuori dalla sezione o dalla chiave `sat`.

**Criteri di accettazione**
- [ ] Test in una cartella temporanea: due esecuzioni danno lo stesso risultato; un `AGENTS.md` esistente conserva il resto; `--dry-run` non scrive.

#### F20-05 · Skill e hook per Claude Code — M
**Dipendenze**: F20-04, F19-03
- `init --claude`: skill in `.claude/skills/sat/SKILL.md` (come si usa SAT, come si correggono i problemi più comuni, rimando a `sat_rule`) e hook dopo le modifiche ai file della UI (`.tsx`, `.jsx`, `.vue`, `.svelte`, `.html`, `.css`) che chiama `sat-check hook`.
- `sat-check hook`: legge l'evento, chiede al dev server `sat_check` sulle route note e restituisce all'agente solo i problemi `new` (F19-04); con il dev server spento non fa nulla ed esce senza errori.
- Gli altri client della tabella di F20-01 che hanno hook: stesso comando, se costa poco; altrimenti `ponytail:` e una riga nelle note.

**Criteri di accettazione**
- [ ] Test unitari di `sat-check hook` con un evento finto: dev server spento, nessun problema nuovo, problemi nuovi.
- [ ] Prova a mano con Claude Code: dopo una modifica che toglie un `alt`, l'agente riceve il problema senza chiederlo.

#### F20-06 · Baseline in CI — S
**Dipendenze**: F19-04
- `sat-check --baseline <file>` e `--update-baseline`: file JSON con gli id per URL; i limiti (`--max-errors`…) contano solo i problemi fuori dalla baseline; il report dice quali sono stati corretti.
- `docs/guides/ci.md` e il workflow di `examples/vite-vanilla`.

**Criteri di accettazione**
- [ ] Test: baseline uguale → esce con 0; un problema nuovo → esce con 1 e lo indica; `--update-baseline` riscrive il file.

#### F20-07 · Documentazione — S
**Dipendenze**: F20-02 … F20-06
- README (sezione «Set up your agent» con `npx sat-check init`), `docs/guides/ai-agents.md`, `ci.md`, `CHANGELOG.md`.

**Criteri di accettazione**
- [ ] `npm run verify`, `npm run verify:e2e` e `npm run smoke` passano.
