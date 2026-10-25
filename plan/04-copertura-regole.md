# F4 — Copertura delle regole

**Obiettivo**: decidere come coprire l'accessibilità (axe-core o regole proprie) e completare i controlli SEO, con documentazione per regola.

> **Stato: completata.** F4-01 deciso: adattatore axe-core opzionale (`seo-accessibility-tool/axe`). F4-02, F4-03, F4-05, F4-06 fatti; F4-04 annullato (coperto da axe). Versione 1.10.0.
>
> Note di implementazione:
> - 8 regole nuove, tutte `seo`, accese di default: `canonical`, `robots-meta`, `social-meta`, `hreflang`, `structured-data`, `mixed-content`, `image-size`, `image-lazy-load`. `seo-meta` segnala anche `<title>` e meta description duplicati. Le prestazioni di caricamento stanno in `seo` (Core Web Vitals) per non aggiungere una categoria al pannello.
> - Per non segnalare pattern validi in sviluppo: il canonical su un altro host e gli URL di produzione negli hreflang non sono segnalati (la pagina gira su localhost); i link di ritorno degli hreflang richiedono richieste e non si controllano.
> - `structured-data` riporta il messaggio del parser: Chromium e Firefox includono la posizione, Safari no.
> - `image-size` non vede le dimensioni date da una classe CSS (gli stili calcolati non le distinguono): per questo è un warning e salta `aspect-ratio`, dimensioni inline e posizionamento assoluto o fisso. `image-lazy-load` usa la posizione nella pagina, quindi non dipende dallo scroll; entrambe testate in Chromium (`tests/browser/images.spec.ts`).
> - `Issue.help` è l'URL di `docs/rules/<id>.md` su GitHub (branch `develop`); il pannello lo mostra in ogni gruppo («How to fix …»). Un test confronta registro e pagine.
> - Adattatore axe: `axe(options)` restituisce un `Engine` (`name`, `replaces`, `run(doc)`), passato con l'opzione `engines`; `core/` conosce solo l'interfaccia. Le violazioni diventano `Issue` `axe/<id>` (impatto critical/serious → error), con `help` = pagina di Deque; gli «incomplete» non si riportano. Le regole sostituite (`accessible-name`, `aria-roles`, `landmarks`, `color-contrast`, `form-label`, `focus-management`, `image-alt`, `html-lang`, `heading-levels`) si spengono, salvo impostazione esplicita in `rules`, che accetta anche gli id `axe/…`. Le esecuzioni di axe vanno in coda (axe lancia un errore se due si sovrappongono); axe gira solo sul documento della pagina.
> - `axe-core` è peer dependency opzionale e devDependency (4.10.3, installata con `--force` per il conflitto di peer preesistente fra `rollup-plugin-dts` e TypeScript 6, che `--legacy-peer-deps` avrebbe risolto riscrivendo il lock). Rollup tiene `core/` e `sat/` in un solo chunk con `manualChunks`, altrimenti l'entry `axe` ne avrebbe staccato `satDom`.
> - Dal confronto: `link-href`, `accessible-name` e `form-label` saltano gli elementi esclusi dall'albero di accessibilità (`isHiddenFromAssistiveTech` in `satDom.ts`); su Wikipedia i problemi trovati solo da SAT passano da 16 a 3. I warning AAA del contrasto restano come sono (scelta del maintainer).

---

## 1. Decisioni

| Tema | Decisione | Motivo |
|---|---|---|
| Motore per l'accessibilità | **Adattatore opzionale** (deciso in F4-01 dal maintainer, 24/10/2026): adattatore opzionale `seo-accessibility-tool/axe` con `axe-core` come peer dependency opzionale; i risultati di axe diventano `Issue` e appaiono nel pannello | circa 90 regole mantenute da altri; SAT si concentra su interfaccia e SEO (00-analisi §4). axe pesa circa 500 KB, accettabile per uno strumento di sviluppo |
| Regole proprie | Le regole di SAT restano; con l'adattatore attivo, quelle duplicate da axe si spengono per non segnalare due volte | Un problema, un messaggio (CONVENTIONS §6.4) |

---

## 2. Task

#### F4-01 · Prova di integrazione di axe-core e decisione — M
**Dipendenze**: F2-01
- Prototipo dell'adattatore; confronto su 3 pagine reali (problemi trovati, falsi positivi, tempo, peso).
- Decisione e motivo in §1 e in `plan/README.md`.

**Criteri di accettazione**
- [x] Tabella del confronto in questa sezione
- [x] Decisione presa dal maintainer: adattatore axe-core opzionale; correzione dei falsi positivi sugli elementi nascosti.

**Confronto (24/10/2026)**: SAT 1.10.0 (`dist/`) e axe-core 4.10.3 con le regole di default (WCAG A/AA e best practice), Chromium 1280×800, stessa pagina caricata. Il prototipo dell'adattatore converte ogni nodo di una violazione di axe in un `Issue` (`ruleId` `axe/<id>`, impatto critical/serious → error, moderate/minor → warning, criteri WCAG dai tag, `help` = `helpUrl`). «Solo SAT» sono i problemi di accessibilità di SAT su elementi che axe non segnala, esclusi i warning AAA del contrasto, che axe non controlla di default.

| Pagina | SAT a11y (errori) | axe nodi / regole (errori) | Solo SAT, senza AAA | Warning AAA di SAT | Tempo SAT / axe |
|---|---|---|---|---|---|
| W3C BAD, versione inaccessibile | 62 (47) | 67 / 7 (44) | 1 (`<a>` senza href, voce di menu corrente) | 14 | 5 / 121 ms |
| W3C BAD, versione accessibile | 17 (1) | 15 / 2 (0) | 2 (`<a>` senza href) | 13 | 4 / 132 ms |
| Wikipedia, «Web accessibility» | 571 (19) | 27 / 4 (24) | 16, quasi tutti su elementi nascosti (sticky header, link `oo-ui-element-hidden`) | 537 | 42 / 1.371 ms |
| GOV.UK, home | 40 (1) | 2 / 1 (0) | 2 (primo titolo `<h2>` nel banner dei cookie; contrasto 3,91 sul bottone Search, probabile testo nascosto) | 38 | 8 / 180 ms |

| | SAT (regole proprie) | axe-core |
|---|---|---|
| Copertura a11y | 14 regole; trova gli stessi problemi di base (alt, nomi, lang, contrasto AA, main) | circa 90 regole; in più qui: `region`, `aria-allowed-role`, `link-in-text-block`, `select-name` |
| Falsi positivi osservati | sì: controlli su elementi nascosti (`link-href`, `accessible-name`, `form-label`), contrasto su testo visivamente nascosto | nessuno sulle 4 pagine |
| Rumore | i warning AAA del contrasto sono il 94% dei risultati su Wikipedia | nessun AAA di default |
| Peso | 62 KB tutto SAT (16 KB gzip) | 553 KB `axe.min.js` (149 KB gzip), in più |
| Tempo per esecuzione | 4–42 ms | 120–1.400 ms |
| SEO | 26 regole, interfaccia in pagina | nessuna |

Osservazioni per la decisione:
- axe non ha prodotto falsi positivi e copre di più; SAT è 20–30 volte più veloce e molto più leggero. Con l'adattatore il peso si paga solo se lo si importa (peer dependency opzionale).
- A prescindere dalla decisione, il confronto ha trovato due difetti di SAT: le regole `link-href`, `accessible-name` e `form-label` controllano elementi nascosti, e i warning AAA del contrasto sommergono il resto. Il primo è un falso positivo (CONVENTIONS §6.1) e andrebbe corretto; per il secondo una proposta è separare l'AAA in una regola spenta di default (cambio di comportamento).

#### F4-02 · SEO: indicizzazione e condivisione — M
**Dipendenze**: F2-02
- Canonical (presente, assoluto, un solo), `robots noindex`/`nofollow` (avviso), Open Graph e Twitter card essenziali, `hreflang` coerenti.

**Criteri di accettazione**
- [x] Test con una pagina completa (nessun problema) e una per ogni mancanza.

#### F4-03 · SEO: contenuti — M
**Dipendenze**: F2-02
- JSON-LD valido (parse e `@type`), title o description duplicati nella pagina, risorse `http:` in una pagina `https:`.

**Criteri di accettazione**
- [x] Un JSON-LD malformato è un errore con la posizione dell'errore di parse.

#### ~~F4-04 · Accessibilità: regole mancanti — L~~ (annullato: la decisione di F4-01 è l'adattatore, e axe copre queste regole: `duplicate-id-aria`, `aria-valid-attr-value`, `aria-hidden-focus`, `frame-title`, `td-headers-attr`/`th-has-data-cells`, `list`/`listitem`, `bypass`, `no-autoplay-audio`)
**Dipendenze**: F4-01 (solo se la decisione è «regole proprie»)
- Id duplicati, riferimenti ARIA verso id inesistenti, `aria-hidden` su focalizzabili, titolo degli `iframe`, intestazioni delle tabelle, struttura delle liste, skip link, media in autoplay.

**Criteri di accettazione**
- Annullato: le regole le copre axe-core con l'adattatore di F4-01 (`engines: [axe()]`).

#### F4-05 · Prestazioni di caricamento — S
**Dipendenze**: F2-02
- `img` senza `width`/`height` (spostamenti di layout), `loading="lazy"` sulla prima immagine visibile.

**Criteri di accettazione**
- [x] Le immagini sotto la piega con `loading="lazy"` non sono segnalate (test in Chromium).

#### F4-06 · Documentazione per regola — S
**Dipendenze**: F2-02
- `docs/rules/<id>.md` con cosa controlla, perché, come correggere, riferimento WCAG/SEO; `help` di ogni `Issue` punta alla pagina.

**Criteri di accettazione**
- [x] Ogni regola del registro ha la sua pagina (test che li confronta).
