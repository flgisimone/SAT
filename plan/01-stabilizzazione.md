# F1 — Stabilizzazione e regole del progetto

**Obiettivo**: correggere i bug e i falsi positivi trovati nella revisione, mettere una rete di sicurezza (CI, test in browser) e organizzare il progetto come oneoffice (piano a fasi, CONVENTIONS, AGENTS, tokensave, `verify`). Esito: la versione 1.7.0, pronta da pubblicare.

> **Stato: completata** (24/10/2026, branch `fase/f1-stabilizzazione`, unito in `develop`). F1-07 superato dalla 1.18.0 (F13); F1-08 chiuso il 25/10/2026 cancellando il branch.
>
> Note di implementazione:
> - Il lavoro è partito sul branch `fix/review-fixes` ed è proseguito su `fase/f1-stabilizzazione`, che lo contiene.
> - `highlight` salva `outline`, `background-color` e `title` al primo tocco di un elemento; `satReset` li ripristina e svuota la mappa. Il pannello dei risultati ha `data-sat-ignore` come il bottone.
> - `parseColor` legge `rgb()`/`rgba()` (con virgole o spazi) ed esadecimali da sé, il resto (`oklch`, `hsl`, nomi) con un canvas di 1 pixel; se non riesce restituisce `null` e l'elemento si salta. I test in Chromium verificano `oklch`.
> - Con le peer dependency opzionali npm non installa più `react` e `vue` nemmeno nel progetto stesso: sono diventate devDependencies per build e test.
> - Strumenti allineati a oneoffice: happy-dom sostituito da jsdom (`tests/setup.ts` fa restituire `null` a `getContext`, come un browser senza canvas), Vitest 5 con reporter `agent`, Playwright 1.64, TypeScript 6 (`moduleResolution: "bundler"`, `types: ["node"]`), ESLint 10. Le 5 segnalazioni di ESLint erano ternari usati come istruzioni, un `catch` con variabile inutilizzata e un `any` nei test: corrette, nessuna regola disattivata.

---

## 1. Decisioni

| Tema | Decisione | Motivo |
|---|---|---|
| Versione | 1.7.0 (minor): i cambi di comportamento sono elencati in `CHANGELOG.md`, l'API pubblica non cambia | CONVENTIONS §8.1 |
| Link rotti | Spenti di default | Effetti collaterali delle richieste, nessun risultato utile nelle SPA |
| Ruoli ARIA | Si segnalano solo ruoli inesistenti e ridondanti | Il ruolo esplicito sugli elementi nativi va contro la prima regola di ARIA |
| `tabindex="-1"` | Si segnala solo sui controlli nativi visibili | È il pattern corretto per il focus da codice |
| Strumenti | Gli stessi di oneoffice | Un solo modo di lavorare (richiesta del 24/10/2026) |

---

## 2. Task

#### F1-01 · Correzioni della revisione — L
**Dipendenze**: —
- `src/sat/satDom.ts`: `queryTargets`, `highlight`/`clearHighlights`, `isElementVisible`, `getAccessibleName`, `describeElement`.
- Contrasto senza ricorsione, con trasparenze e testo grande; Vue in `setup()`; `checkH1Visible` che segnala; correzioni di link vuoti, testi consentiti, etichette.
- Falsi positivi: ruoli ARIA, landmark, titoli, etichette, `tabindex="-1"`, focus.
- Nuovi controlli: `alt` delle immagini, `lang`, meta SEO. Risultati salvati per percorso.

**Criteri di accettazione**
- [x] Spegnendo SAT gli stili e i `title` originali della pagina tornano com'erano.
- [x] Una pagina con colori `oklch` non manda in errore il controllo del contrasto.
- [x] `<h2>` dopo `<h3>` e `<header>` dentro `<article>` non sono segnalati.
- [x] Unit test per ogni controllo cambiato.

#### F1-02 · Peer dependency opzionali — S
**Dipendenze**: —
- `peerDependenciesMeta` con `react` e `vue` opzionali; le due librerie come devDependencies.

**Criteri di accettazione**
- [x] Installando in un progetto React non arriva Vue (verificato: senza devDependencies npm non le installa).

#### F1-03 · CI — S
**Dipendenze**: F1-06
- `.github/workflows/ci.yml`: `npm run verify` e `npm run verify:e2e` su ogni PR e su `develop`.

**Criteri di accettazione**
- [x] Il workflow esegue gli stessi comandi della verifica locale.

#### F1-04 · Test in browser — M
**Dipendenze**: F1-01
- `tests/browser/contrast-visibility.spec.ts`: il bundle `dist/index.js` caricato in Chromium; contrasto (nero su bianco, `oklch`, sfondo e testo semitrasparenti, testo grande, nascosti e con immagine di sfondo), H1 nascosto, elementi `position: fixed`.

**Criteri di accettazione**
- [x] 8 test passano in Chromium.

#### F1-05 · Changelog, versione e pulizia — S
**Dipendenze**: F1-01
- `CHANGELOG.md` con la sezione 1.7.0 (cambi di comportamento, aggiunte, correzioni); versione 1.7.0; `.tgz` rimosso e ignorato.

**Criteri di accettazione**
- [x] Il changelog elenca tutti i cambi che modificano il numero di problemi segnalati.

#### F1-06 · Regole del progetto come oneoffice — M
**Dipendenze**: —
- `CONVENTIONS.md` (sezioni generali di oneoffice, sezioni specifiche per una libreria di controlli), `AGENTS.md`, `CLAUDE.md`, `plan/`.
- Indice tokensave (`.tokensave/`, ignorato); script `verify`, `verify:e2e`, `usage` (`scripts/token-usage.mjs`); ESLint; versioni degli strumenti allineate.

**Criteri di accettazione**
- [x] `npm run verify` e `npm run verify:e2e` passano e stampano solo riepiloghi.
- [x] `npm run usage` legge i consumi delle sessioni del progetto.

#### ~~F1-07 · Pubblicazione 1.7.0 — S~~ (superato: la prima versione pubblicata dopo la 1.6.0 è la 1.18.0, F13-07)
**Dipendenze**: F1-01 … F1-06
- Dal maintainer, dopo il merge: `npm run build && npm publish`; tag `v1.7.0`.

**Criteri di accettazione**
- Superato il 25/10/2026: la 1.7.0 non è mai stata pubblicata, si passa dalla 1.6.0 alla 1.18.0.

#### F1-08 · Branch `feature/SAT-45` — S
**Dipendenze**: —
- Il branch (23/03/2025, «Remove Color Overlay and add console.log for all resolved») non è mai stato unito: decidere se recuperarlo o cancellarlo.

**Criteri di accettazione**
- [x] Il branch è unito o cancellato, con il motivo in questa sezione. *Cancellato il 25/10/2026 (ultimo commit `915102a`): toccava file della vecchia struttura, sostituiti dalle regole di `src/core/rules/` (F2); il problema che risolveva, gli stili scritti sulla pagina, è già risolto dallo strato del pannello (F3); i log in console sono sostituiti dai risultati strutturati e le gravità dalle fonti ufficiali (F8).*
