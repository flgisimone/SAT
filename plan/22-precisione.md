# F22 — Precisione sulle app reali

**Obiettivo**: SAT non segnala i pattern validi delle librerie di componenti più usate (shadcn/ui, Radix). La prova è un'app React vera, oneoffice, controllata accanto ad axe-core: ogni errore che resta deve essere un problema reale.

> **Stato: completata il 29/10/2026, versione 2.0.1** (la pubblica il maintainer). Fonte: prova su oneoffice del 28/10/2026, nata dall'analisi esterna «Limiti attuali e piano per superarli» (di cui si è tenuto solo il tema dell'affidabilità delle regole). Note di implementazione in fondo.

---

## 1. Decisioni

| Tema | Decisione | Motivo |
|---|---|---|
| Fonte dei falsi positivi | Le 44 pagine che oneoffice controlla già con axe in `e2e/accessibilita.spec.ts`, con login e mock; ogni segnalazione dubbia confrontata con axe sullo stesso elemento e con la specifica | Un'app vera con Radix e shadcn mostra pattern che le fixture non hanno |
| Correzione alla causa | Il nome dai `<label>` si aggiunge al calcolo condiviso (`textAlternative` in `satDom.ts`), non alla singola regola | Ne beneficiano `accessible-name` e `label-in-name` (AGENTS.md, «un bug si corregge alla causa») |
| Casi che SAT non può decidere | Avviso, non errore: contenuto dietro una modale aperta (`aria-hidden-focus`), elementi invisibili nel tab order (`focus-management`, possono essere sentinelle del focus) | Il focus trap e le sentinelle sono script che un controllo statico non vede; axe li lascia «da rivedere» |
| `focus-management` | Default `warning`: non restano casi d'errore | Gli elementi non renderizzati o disabilitati non prendono il focus, quindi non sono un problema |
| Versione | **2.0.1**: solo correzioni, nessuna API nuova | La 2.0.0 è già su npm |
| Fuori da questa fase | Crawler, scenari di interazione, livelli di certezza, dati esterni dell'analisi | Il crawler è uscito in F18; il resto attende i feedback (regola di F16) |

## 2. Task

#### F22-01 · Nome dai `<label>` per i bottoni — S
- `src/sat/satDom.ts`: dopo `aria-label`, il testo dei `labels` dell'elemento (HTML-AAM); un insieme degli elementi in calcolo evita il ciclo quando il label contiene il controllo.

**Criteri di accettazione**
- [x] Test: `<button role="checkbox">` con `<label for>`, `<button role="radio">` dentro un `<label>` non segnalati; un label vuoto sì.

#### F22-02 · Roving tabindex — S
- `tabindex-negative`: niente avviso per gli elementi di `tablist`, `radiogroup`, `menu`, `menubar`, `listbox`, `tree`, `treegrid`, `grid`, `toolbar` quando un altro elemento del widget, o il widget stesso, è nel tab order.

**Criteri di accettazione**
- [x] Test in Chromium: tab e radio con roving tabindex non segnalati; una tablist irraggiungibile e un bottone solo per il mouse sì.

#### F22-03 · Intestazioni di gruppo nelle tabelle — S
- `table-headers`: `scope="rowgroup"` copre le righe successive del suo `<tbody>`; un'intestazione con una disclosure chiusa (`aria-expanded="false"`) non si segnala.

**Criteri di accettazione**
- [x] Test: gruppo con righe e gruppo chiuso non segnalati, gruppo vuoto senza disclosure sì.

#### F22-04 · Focus, modali e media — S
- `focus-management`: salta ciò che non è renderizzato, disabilitato o inerte; avviso per gli elementi invisibili nel tab order; i contenitori scorrevoli con `tabindex="0"` vanno bene.
- `aria-hidden-focus`: avviso dietro una modale aperta (`dialog:modal`, o `role="dialog"` visibile fuori da `aria-hidden`).
- `aria-attributes`: `<audio>` e `<video>` non sono `generic`, `aria-label` è ammesso.

**Criteri di accettazione**
- [x] Test unitari e in Chromium per ogni caso, compreso il test che dava per buono il pulsante con `visibility: hidden`.
- [x] Documentazione delle regole, tabella del README e `CHANGELOG.md`.

#### F22-05 · Prova su oneoffice — S
- Lo script della prova (fuori dal repository) gira sulla build locale prima e dopo.

**Criteri di accettazione**
- [x] Errori da 446 a 188 su 44 pagine; quelli rimasti (`label-in-name`, `target-size`, `color-contrast`) confermati da axe sugli stessi elementi.

---

## Note di implementazione

| Regola | Prima | Dopo | Esito |
|---|---|---|---|
| `accessible-name` | 191 errori | 0 | falsi positivi (checkbox e radio di shadcn) |
| `aria-attributes` | 3 errori | 0 | falsi positivi (`<video aria-label>`) |
| `table-headers` | 9 errori | 0 | falsi positivi (gruppi chiusi con `scope="rowgroup"`) |
| `focus-management` | 8 errori, 1 avviso | 6 avvisi | restano le sentinelle del focus di Radix |
| `aria-hidden-focus` | 47 errori | 47 avvisi | contenuto dietro il Dialog di Radix |
| `tabindex-negative` | 132 avvisi | 20 | resta la barra della sidebar di shadcn (`SidebarRail`), che si usa solo col mouse |
| `label-in-name`, `target-size`, `color-contrast` | 188 errori | 188 | problemi di oneoffice; il contrasto («2 mesi in omaggio», 3,46:1) axe lo lascia «da rivedere» |

- `canonical` e `social-meta` compaiono su tutte le pagine dietro login: per un gestionale si spengono con `rules`, non è un difetto delle regole.
- I problemi di oneoffice (sidebar con `aria-label="Clienti (6)"`, contrasto, h1 mancante nella console del gestore, pallini del carosello da 10 px) restano da correggere in oneoffice.
