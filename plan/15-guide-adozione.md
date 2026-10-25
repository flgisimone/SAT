# F15 — Guide all'adozione

**Obiettivo**: chi ha provato SAT lo mette nel proprio lavoro quotidiano: lo configura, capisce i risultati, lo porta in CI e sa cosa fare quando qualcosa non va.

> **Stato: da iniziare.** Fonte: roadmap di crescita del 25/10/2026, fase 6.

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
- [ ] Il workflow d'esempio è quello provato in `examples/cli`.

#### F15-02 · Configurazione e regole — S
**Dipendenze**: —
- `docs/guides/configuration.md`: dove si mettono le opzioni per ogni integrazione, gravità per regola, `wcagLevel`, spegnere una regola, `allowedLinkTexts`, axe-core, una configurazione condivisa fra pannello e CLI.

**Criteri di accettazione**
- [ ] Ogni opzione citata esiste nei tipi pubblici (controllato contro `SATOptions`).

#### F15-03 · App a pagina singola — S
**Dipendenze**: —
- `docs/guides/spa.md`: cambi di route, `observeDom`, contenuti caricati dopo, link rotti con `--not-found`, cosa resta fuori (stati che compaiono solo interagendo).

**Criteri di accettazione**
- [ ] Il comportamento descritto corrisponde ai test SPA esistenti.

#### F15-04 · Troubleshooting — S
**Dipendenze**: F13-02
- `docs/guides/troubleshooting.md`: il pannello non compare (`NODE_ENV`, ordine dei plugin, CSP), la CLI non trova Chromium, axe-core non installato, Fix with AI senza `claude` o senza accesso, un falso positivo (come segnalarlo).
- Ogni voce: sintomo, causa, soluzione.

**Criteri di accettazione**
- [ ] Ogni messaggio d'errore citato è quello che il codice stampa davvero.

#### F15-05 · Template da clonare — S
**Dipendenze**: F13-03
- `examples/vite-vanilla` usabile come punto di partenza: istruzioni con `npx degit flgisimone/SAT/examples/vite-vanilla`, già con plugin, script per `sat-check` e workflow di CI.

**Criteri di accettazione**
- [ ] Il comando `degit` funziona su `develop` dopo il push e l'esempio parte senza modifiche.
