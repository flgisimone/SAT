# F3 — Pannello e evidenziazioni

**Obiettivo**: rendere SAT comodo da usare ogni giorno: un pannello isolato dalla pagina, evidenziazioni che non toccano l'app, dalla lista all'elemento con un clic, filtri e mappa dei titoli, funzionamento nelle SPA.

> **Stato: da iniziare.** Dipende da F2 (i problemi devono avere l'elemento).

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
- [ ] Con `button { background: red !important }` nella pagina il pannello non cambia (test in Chromium).

#### F3-02 · Evidenziazioni sovrapposte — L
**Dipendenze**: F2-01, F3-01
- Strato di riquadri per i problemi, colore per gravità; aggiornamento su scroll, resize e `ResizeObserver`.

**Criteri di accettazione**
- [ ] Dopo un re-render di React dell'elemento segnalato il riquadro resta.
- [ ] Spegnendo SAT nessun attributo o stile della pagina è cambiato rispetto a prima dell'avvio (test).

#### F3-03 · Dalla lista all'elemento — S
**Dipendenze**: F3-02
- Clic su un problema: scroll fino all'elemento, riquadro che lampeggia, focus se è focalizzabile.

**Criteri di accettazione**
- [ ] Il clic porta l'elemento nella vista (test in Chromium).

#### F3-04 · Filtri e raggruppamenti — M
**Dipendenze**: F3-01
- Filtri per categoria e gravità, raggruppamento per regola con il conteggio.

**Criteri di accettazione**
- [ ] Una pagina con 200 problemi mostra i gruppi chiusi e i conteggi corretti.

#### F3-05 · Mappa dei titoli — M
**Dipendenze**: F3-01
- Scheda «Struttura» con l'albero H1–H6 e i salti evidenziati; clic → elemento.

**Criteri di accettazione**
- [ ] L'albero corrisponde all'ordine e ai livelli della pagina (test).

#### F3-06 · SPA — M
**Dipendenze**: F2-04
- Nuova esecuzione al cambio di route (`popstate`, `pushState`/`replaceState`); osservazione del DOM opzionale con ritardo.

**Criteri di accettazione**
- [ ] In un'app con router, cambiando pagina i risultati si aggiornano senza ricaricare.

#### F3-07 · Prestazioni — S
**Dipendenze**: F2-02
- Misura su una pagina di 5.000 elementi; cache per esecuzione degli stili calcolati e degli sfondi.

**Criteri di accettazione**
- [ ] Il tempo di un'esecuzione è misurato e riportato qui; obiettivo sotto 200 ms sulla pagina di prova.

#### F3-08 · Pannello accessibile — S
**Dipendenze**: F3-01
- Tastiera (Tab, Esc), focus restituito al bottone, etichette.

**Criteri di accettazione**
- [ ] SAT che analizza una pagina non segnala problemi sul proprio pannello.
