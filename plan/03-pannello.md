# F3 — Pannello e evidenziazioni

**Obiettivo**: rendere SAT comodo da usare ogni giorno: un pannello isolato dalla pagina, evidenziazioni che non toccano l'app, dalla lista all'elemento con un clic, filtri e mappa dei titoli, funzionamento nelle SPA.

> **Stato: completata (24/10/2026), versione 1.9.0.**
>
> Note di implementazione:
> - Pannello in `src/ui/satUI.ts`: host `<sat-panel data-sat-ignore>` con Shadow DOM aperto, stili in `src/ui/styles.ts` con `:host { all: initial }`. Dock in basso a sinistra (avvio/stop, nuova esecuzione, conteggi che aprono il pannello); schede «Issues» e «Structure» come bottoni `aria-pressed`.
> - Evidenziazioni in `src/ui/overlay.ts`: riquadri `position: fixed` ricalcolati in `requestAnimationFrame` su scroll (in cattura), resize e `ResizeObserver` (elementi e `documentElement`). Se l'app sostituisce il nodo, il riquadro segue quello che ora corrisponde al `selector`. **Le regole non toccano più la pagina**: `highlight`, `clearHighlights` e `Report.highlight` eliminati, `satReset` deprecato e vuoto, anche per `seoAccessibilityTool()` senza pannello. `heading-order` non colora più i titoli (lo fa la scheda «Structure»); con più `<h1>` il problema punta al secondo.
> - Clic su un problema o un titolo: `scrollIntoView({ block: 'center' })`, `focus({ preventScroll: true })` (non fa nulla sugli elementi non focalizzabili) e un riquadro blu che lampeggia (Web Animations).
> - Mappa dei titoli: `headingOutline(document)` in `src/core/rules/headings.ts`, usata anche da `heading-levels`.
> - SPA: `popstate` più `history.pushState`/`replaceState` avvolti una volta; si riesegue dopo 300 ms solo se cambia percorso o query (non l'hash). Opzione `observeDom` (ms) con `MutationObserver` sul `body`. Al posto dei messaggi per percorso, in `localStorage` resta solo il flag «SAT acceso»: al ricaricamento i controlli ripartono.
> - F3-07: pagina di prova con 5.117 elementi, 10 livelli di annidamento e 850 problemi di contrasto (`tests/browser/performance.spec.ts`, Chromium, mediana di 5): **142 ms prima, 54 ms dopo**. Il tempo andava in `cssSelector` (copia di `parent.children` per ogni passo, quadratica su liste lunghe) e nelle scritture di stile delle evidenziazioni fra una lettura e l'altra. La cache degli stili calcolati non è servita: la risalita degli sfondi costa circa 8 ms.
> - F3-08: il test copia il markup del pannello in una pagina e ci lancia tutte le regole: zero problemi.

---

## 1. Decisioni

| Tema | Decisione | Motivo |
|---|---|---|
| Isolamento | Pannello in uno Shadow DOM aperto con stili propri | Il CSS dell'app non lo altera e il suo non esce |
| Evidenziazioni | Strato di riquadri `position: fixed` sopra la pagina, ricalcolati su scroll e resize; `highlight` sugli elementi resta solo per il `title` se serve | Non si toccano gli elementi dell'app: niente perdita al re-render, niente `outline: none !important` |
| Interfaccia | DOM costruito a mano, senza framework | Nessuna dipendenza a runtime (CONVENTIONS §8.3) |

---

## 2. Task

#### F3-01 · Pannello in Shadow DOM — M
**Dipendenze**: F2-01
- `src/ui/`: un host con `data-sat-ignore` e Shadow DOM; stili in un foglio interno.

**Criteri di accettazione**
- [x] Con `button { background: red !important }` nella pagina il pannello non cambia (test in Chromium).

#### F3-02 · Evidenziazioni sovrapposte — L
**Dipendenze**: F2-01, F3-01
- Strato di riquadri per i problemi, colore per gravità; aggiornamento su scroll, resize e `ResizeObserver`.

**Criteri di accettazione**
- [x] Dopo un re-render di React dell'elemento segnalato il riquadro resta (simulato in Chromium: attributo `style` riscritto e nodo sostituito, come fa React; non c'è un build UMD di `react-dom` per un test con React vero).
- [x] Spegnendo SAT nessun attributo o stile della pagina è cambiato rispetto a prima dell'avvio (test).

#### F3-03 · Dalla lista all'elemento — S
**Dipendenze**: F3-02
- Clic su un problema: scroll fino all'elemento, riquadro che lampeggia, focus se è focalizzabile.

**Criteri di accettazione**
- [x] Il clic porta l'elemento nella vista (test in Chromium).

#### F3-04 · Filtri e raggruppamenti — M
**Dipendenze**: F3-01
- Filtri per categoria e gravità, raggruppamento per regola con il conteggio.

**Criteri di accettazione**
- [x] Una pagina con 200 problemi mostra i gruppi chiusi e i conteggi corretti.

#### F3-05 · Mappa dei titoli — M
**Dipendenze**: F3-01
- Scheda «Struttura» con l'albero H1–H6 e i salti evidenziati; clic → elemento.

**Criteri di accettazione**
- [x] L'albero corrisponde all'ordine e ai livelli della pagina (test).

#### F3-06 · SPA — M
**Dipendenze**: F2-04
- Nuova esecuzione al cambio di route (`popstate`, `pushState`/`replaceState`); osservazione del DOM opzionale con ritardo.

**Criteri di accettazione**
- [x] In un'app con router, cambiando pagina i risultati si aggiornano senza ricaricare (router minimo con `pushState` nel test).

#### F3-07 · Prestazioni — S
**Dipendenze**: F2-02
- Misura su una pagina di 5.000 elementi; cache per esecuzione degli stili calcolati e degli sfondi.

**Criteri di accettazione**
- [x] Il tempo di un'esecuzione è misurato e riportato qui; obiettivo sotto 200 ms sulla pagina di prova.

#### F3-08 · Pannello accessibile — S
**Dipendenze**: F3-01
- Tastiera (Tab, Esc), focus restituito al bottone, etichette.

**Criteri di accettazione**
- [x] SAT che analizza una pagina non segnala problemi sul proprio pannello.
