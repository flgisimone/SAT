# F11 — Pannello professionale

**Obiettivo**: un pannello curato e leggibile, nello stile degli strumenti per sviluppatori (DevTools, Linear, Vercel), che rispetti esso stesso WCAG 2.2 AA. Analisi in [00-analisi-linee-guida.md](00-analisi-linee-guida.md) §4.

> **Stato: completata (24/10/2026), versione 1.16.0.**
>
> Note di implementazione:
> - **F11-01**: token sui tre elementi di primo livello (`.layer`, `.dock`, `.panel`) e non su `:host`, così l'autocontrollo che copia il markup in una pagina propria li conserva. Palette calcolata per 4.5:1 su ogni sfondo di ciascun tema; ambra `#9a6700` nel tema chiaro (3:1 anche come grafica). Icone in `src/ui/icons.ts`, costruite con `createElementNS` (niente `innerHTML`, che le pagine con Trusted Types bloccano).
> - **F11-02**: i contatori sono `button[aria-pressed]` in un `role="group"` «Show issues»; premuto = mostrato, come le checkbox di prima. Tempo dell'analisi misurato in `satChecker`.
> - **F11-03**: `title` e `source` nel registro (`source` solo per le regole senza criterio WCAG) e in `Issue`; axe usa `rule.help` come titolo. Gruppi per categoria con `role="group"` invece di titoli `<h2>`, per non aggiungere titoli alla pagina ospite. Al posto dei `<details>`, i primi cinque problemi per regola e «Show N more». Regole con errori prima.
> - **F11-04**: l'etichetta segue `pointermove` e `click` in cattura e passivi, senza intercettare nulla: il clic arriva alla pagina. Si mostra per il riquadro più piccolo sotto il puntatore, con fino a tre titoli.
> - **F11-05**: chiave `sat-side` in `localStorage`. Con `reduced-motion` il riquadro dell'elemento rivelato resta fermo per lo stesso tempo invece di lampeggiare.
> - **F11-06**: `tests/browser/panel.spec.ts` esegue SAT (tutte le regole) e axe-core (`wcag2a`…`wcag22aa`, `best-practice`) sul markup del pannello aperto, con le due viste, in tema chiaro e scuro; un test percorre tutti i controlli con Tab.
> - **F11-07**: screenshot chiaro e scuro in `docs/images/`, nel README con `<picture>`.

---

## 1. Decisioni

- **Stile DevTools sobrio**: neutri, un solo colore d'accento, rosso e ambra solo per le gravità; tipografia di sistema; densità alta.
- **Token CSS** in `src/ui/styles.ts`, tema chiaro e scuro da `prefers-color-scheme`. Tutto resta nel foglio costruito dello shadow root (CSP, F6-04).
- **Icone SVG in linea**, niente emoji e niente dipendenze.
- La pagina ospite non si tocca (CONVENTIONS §6.3).
- **Versione 1.16.0**.

## 2. Task

#### F11-01 · Token, temi e icone — M
**Dipendenze**: —
- Palette con token (`--sat-bg`, `--sat-fg`, `--sat-accent`, `--sat-error`, `--sat-warning`…), tema scuro, icone SVG per esegui, aggiorna, chiudi, gravità e categoria.

**Criteri di accettazione**
- [x] Ogni coppia testo/sfondo del pannello raggiunge 4.5:1 in entrambi i temi (test in Chromium con `color-contrast` di SAT).

#### F11-02 · Intestazione e riepilogo — M
**Dipendenze**: F11-01
- Marchio SAT, contatori per errori, avvisi, accessibilità e SEO come filtri a pulsante (`aria-pressed`) al posto delle checkbox; tempo dell'analisi.

**Criteri di accettazione**
- [x] Un clic su un contatore filtra la lista e i riquadri; lo stato si legge con lo screen reader.

#### F11-03 · Lista dei problemi leggibile — M
**Dipendenze**: F11-01, F8-01
- Problemi raggruppati per categoria, ogni regola con titolo leggibile (nuovo campo `title` nel registro), messaggio visibile senza aprire nulla, etichetta con criterio WCAG o fonte, link «Perché e come correggere» alla pagina della regola.

**Criteri di accettazione**
- [x] Il messaggio di ogni problema è visibile nella lista; il clic porta all'elemento come oggi.

#### F11-04 · Riquadri con etichetta — S
**Dipendenze**: F11-01
- Al passaggio del mouse e al clic sul riquadro, un'etichetta con gravità e titolo della regola, nello strato di SAT.

**Criteri di accettazione**
- [x] L'etichetta non modifica la pagina e non esce dalla viewport.

#### F11-05 · Posizione e movimento — S
**Dipendenze**: F11-01
- Pannello ancorabile a sinistra o a destra (ricordato in `localStorage` con try/catch), transizioni brevi disattivate con `prefers-reduced-motion`.

**Criteri di accettazione**
- [x] Lo spostamento resta dopo il ricaricamento; con `reduced-motion` non ci sono transizioni.

#### F11-06 · Il pannello passa i propri controlli — S
**Dipendenze**: F11-01 … F11-05, F9-03
- Test in Chromium: SAT e axe-core sul pannello aperto non trovano problemi (inclusi `target-size` e contrasto); navigazione completa da tastiera.

**Criteri di accettazione**
- [x] Il test passa in tema chiaro e scuro.

#### F11-07 · Documentazione e rilascio — S
**Dipendenze**: F11-06
- Screenshot nel README, `CHANGELOG.md`, versione 1.16.0.

**Criteri di accettazione**
- [x] `npm run verify` e `npm run verify:e2e` passano.
