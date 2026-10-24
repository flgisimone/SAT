# F2 — Modello dei risultati e registro delle regole

**Obiettivo**: i controlli producono dati strutturati (`Issue`) invece di stringhe, sono registrati in un unico elenco e si configurano per regola. È la base per il pannello (F3), le nuove regole (F4) e la CI (F5).

> **Stato: completata (24/10/2026), versione 1.8.0.** F2-07 annullato: SAT resta solo in inglese.
>
> Note di implementazione:
> - `Issue` e `cssSelector` in `src/sat/issue.ts`; il selettore parte dall'antenato con id univoco e scende con `:nth-of-type`. Il campo `help` non è stato aggiunto: arriverà con la documentazione per regola (F4).
> - 18 regole in `src/core/rules/{a11y,seo}/<id>.ts`, registro in `src/core/rules/index.ts`. Le regole con gravità miste (es. `color-contrast`, `image-alt`) passano `severity` nel singolo `report`; la gravità impostata in `rules` vale per tutti i problemi della regola.
> - Precedenza: `rules` → opzione `enableCheck*` → default della regola (`defaultOff` per `link-text` e `link-broken`). Mappa 1.x → regola in `LEGACY_OPTIONS` (`src/sat/satOptions.ts`).
> - `satLogger` eliminato: ogni esecuzione ha il suo contesto; `seoAccessibilityTool(options, document)` accetta un documento; `satReset` esportato dall'entry principale.
> - Build in un solo passaggio con chunk condiviso senza hash e commenti tolti dal JS: 63 KB di JS in `dist` (prima ~200 KB).
> - Test in Chromium: `dist/` servito da un'origine finta (`tests/browser/serve.ts`); `bundles.spec.ts` verifica `enabled` senza bundler e lo stato unico fra `index` e `react`.

---

## 1. Decisioni

| Tema | Decisione | Motivo |
|---|---|---|
| Versione | **(a) 1.8.0**: `enableCheck*` e `errorMessages`/`warningMessages` restano, deprecati, accanto ai nuovi campi | Nessuna rottura; si tolgono in una 2.0 |
| Forma di un problema | `Issue { ruleId, severity: 'error' \| 'warning', category: 'a11y' \| 'seo', message, help?, wcag?: string[], element?: Element, selector?: string }` | Contiene tutto ciò che servono a pannello, report e CI |
| Regole | Un modulo per regola: `{ id, category, defaultSeverity, run(ctx) }`; l'elenco è un array esportato da `src/core/rules/index.ts` | Aggiungere una regola tocca un solo file più il registro |
| Contesto | `ctx = { document, report(issue), highlight }` creato a ogni esecuzione | Niente stato globale; le esecuzioni non si mescolano |
| Configurazione | `rules: { [ruleId]: 'error' \| 'warning' \| 'off' }` | Gravità per regola, come ESLint |
| Lingua | Solo inglese | Decisione del 24/10/2026: niente localizzazione, F2-07 annullato |

---

## 2. Task

#### F2-01 · Modello `Issue` — M
**Dipendenze**: —
- `src/sat/issue.ts` con il tipo e `describeElement`/selettore CSS univoco per l'elemento.
- `seoAccessibilityTool` restituisce `{ issues, errors, warnings }` (più i campi 1.x se §1 sceglie (a)).

**Criteri di accettazione**
- [x] Ogni problema ha `ruleId`, gravità, categoria, messaggio e, quando c'è, l'elemento.
- [x] Il selettore di un problema seleziona proprio quell'elemento (test).

#### F2-02 · Registro delle regole — M
**Dipendenze**: F2-01
- `src/core/rules/<categoria>/<id>.ts` per ognuna delle 18 regole attuali; `src/core/rules/index.ts` con l'elenco.
- `seoAccessibilityTool` scorre il registro con la stessa protezione per regola di oggi.

**Criteri di accettazione**
- [x] Gli unit test di F1 passano senza cambiare le aspettative (stessi problemi segnalati).
- [x] CONVENTIONS §6.5 descrive il nuovo modo di aggiungere una regola.

#### F2-03 · Configurazione per regola — S
**Dipendenze**: F2-02
- Opzione `rules`; se §1 sceglie (a), le opzioni `enableCheck*` vengono tradotte in `rules` con un test per ognuna.

**Criteri di accettazione**
- [x] `rules: { 'image-alt': 'warning' }` declassa i problemi di quella regola.
- [x] Con (a), le configurazioni 1.x danno gli stessi risultati di 1.7.0.

#### F2-04 · Contesto per esecuzione — S
**Dipendenze**: F2-02
- `satLogger` sostituito dal contesto; nessuno stato a livello di modulo nei controlli.

**Criteri di accettazione**
- [x] Due esecuzioni in parallelo su documenti diversi restituiscono risultati separati (test).

#### F2-05 · Core condiviso fra i bundle — S
**Dipendenze**: —
- Rollup con più input e `output.dir` (code splitting): un chunk condiviso; `exports` invariati.

**Criteri di accettazione**
- [x] La somma dei file in `dist` scende da circa 200 KB a meno di 70 KB.
- [x] Importando `index` e `react` nella stessa app lo stato è uno solo.

#### F2-06 · Opzione `enabled` — S
**Dipendenze**: —
- `satChecker({ enabled: true })` forza l'avvio anche senza `NODE_ENV`; `false` lo impedisce.

**Criteri di accettazione**
- [x] Senza bundler, con `enabled: true`, il bottone compare (test in Chromium).

#### ~~F2-07 · Lingua dei messaggi — M~~ (annullato: solo inglese)
**Dipendenze**: F2-02
- Opzione `locale: 'en' | 'it'` (default `en`); testi della UI e messaggi delle regole in `src/i18n/`.

**Criteri di accettazione**
- Annullato il 24/10/2026: messaggi e UI restano in inglese; i testi italiani rimasti nel pannello sono stati tradotti.
