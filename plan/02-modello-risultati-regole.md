# F2 — Modello dei risultati e registro delle regole

**Obiettivo**: i controlli producono dati strutturati (`Issue`) invece di stringhe, sono registrati in un unico elenco e si configurano per regola. È la base per il pannello (F3), le nuove regole (F4) e la CI (F5).

> **Stato: da iniziare.** Prima di partire va presa la decisione sulla versione (§1).

---

## 1. Decisioni

| Tema | Decisione | Motivo |
|---|---|---|
| Versione | **Da decidere**: (a) 1.x, con `enableCheck*` e `errorMessages`/`warningMessages` ancora presenti accanto ai nuovi campi; (b) 2.0, con solo il nuovo formato | (a) nessuna rottura ma due modi di configurare; (b) API più pulita, guida di migrazione obbligatoria |
| Forma di un problema | `Issue { ruleId, severity: 'error' \| 'warning', category: 'a11y' \| 'seo', message, help?, wcag?: string[], element?: Element, selector?: string }` | Contiene tutto ciò che servono a pannello, report e CI |
| Regole | Un modulo per regola: `{ id, category, defaultSeverity, run(ctx) }`; l'elenco è un array esportato da `src/core/rules/index.ts` | Aggiungere una regola tocca un solo file più il registro |
| Contesto | `ctx = { document, report(issue), highlight }` creato a ogni esecuzione | Niente stato globale; le esecuzioni non si mescolano |
| Configurazione | `rules: { [ruleId]: 'error' \| 'warning' \| 'off' }` | Gravità per regola, come ESLint |

---

## 2. Task

#### F2-01 · Modello `Issue` — M
**Dipendenze**: —
- `src/sat/issue.ts` con il tipo e `describeElement`/selettore CSS univoco per l'elemento.
- `seoAccessibilityTool` restituisce `{ issues, errors, warnings }` (più i campi 1.x se §1 sceglie (a)).

**Criteri di accettazione**
- [ ] Ogni problema ha `ruleId`, gravità, categoria, messaggio e, quando c'è, l'elemento.
- [ ] Il selettore di un problema seleziona proprio quell'elemento (test).

#### F2-02 · Registro delle regole — M
**Dipendenze**: F2-01
- `src/core/rules/<categoria>/<id>.ts` per ognuna delle 18 regole attuali; `src/core/rules/index.ts` con l'elenco.
- `seoAccessibilityTool` scorre il registro con la stessa protezione per regola di oggi.

**Criteri di accettazione**
- [ ] Gli unit test di F1 passano senza cambiare le aspettative (stessi problemi segnalati).
- [ ] CONVENTIONS §6.5 descrive il nuovo modo di aggiungere una regola.

#### F2-03 · Configurazione per regola — S
**Dipendenze**: F2-02
- Opzione `rules`; se §1 sceglie (a), le opzioni `enableCheck*` vengono tradotte in `rules` con un test per ognuna.

**Criteri di accettazione**
- [ ] `rules: { 'image-alt': 'warning' }` declassa i problemi di quella regola.
- [ ] Con (a), le configurazioni 1.x danno gli stessi risultati di 1.7.0.

#### F2-04 · Contesto per esecuzione — S
**Dipendenze**: F2-02
- `satLogger` sostituito dal contesto; nessuno stato a livello di modulo nei controlli.

**Criteri di accettazione**
- [ ] Due esecuzioni in parallelo su documenti diversi restituiscono risultati separati (test).

#### F2-05 · Core condiviso fra i bundle — S
**Dipendenze**: —
- Rollup con più input e `output.dir` (code splitting): un chunk condiviso; `exports` invariati.

**Criteri di accettazione**
- [ ] La somma dei file in `dist` scende da circa 200 KB a meno di 70 KB.
- [ ] Importando `index` e `react` nella stessa app lo stato è uno solo.

#### F2-06 · Opzione `enabled` — S
**Dipendenze**: —
- `satChecker({ enabled: true })` forza l'avvio anche senza `NODE_ENV`; `false` lo impedisce.

**Criteri di accettazione**
- [ ] Senza bundler, con `enabled: true`, il bottone compare (test in Chromium).

#### F2-07 · Lingua dei messaggi — M
**Dipendenze**: F2-02
- Opzione `locale: 'en' | 'it'` (default `en`); testi della UI e messaggi delle regole in `src/i18n/`.

**Criteri di accettazione**
- [ ] Con `locale: 'it'` UI e messaggi sono tutti in italiano, e viceversa.
