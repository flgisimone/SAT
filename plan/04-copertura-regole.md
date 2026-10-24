# F4 — Copertura delle regole

**Obiettivo**: decidere come coprire l'accessibilità (axe-core o regole proprie) e completare i controlli SEO, con documentazione per regola.

> **Stato: da iniziare.** F4-01 è un punto di decisione: i task F4-04 dipendono dall'esito.

---

## 1. Decisioni

| Tema | Decisione | Motivo |
|---|---|---|
| Motore per l'accessibilità | **Da decidere in F4-01.** Proposta: adattatore opzionale `seo-accessibility-tool/axe` con `axe-core` come peer dependency opzionale; i risultati di axe diventano `Issue` e appaiono nel pannello | circa 90 regole mantenute da altri; SAT si concentra su interfaccia e SEO (00-analisi §4). axe pesa circa 500 KB, accettabile per uno strumento di sviluppo |
| Regole proprie | Le regole di SAT restano; con l'adattatore attivo, quelle duplicate da axe si spengono per non segnalare due volte | Un problema, un messaggio (CONVENTIONS §6.4) |

---

## 2. Task

#### F4-01 · Prova di integrazione di axe-core e decisione — M
**Dipendenze**: F2-01
- Prototipo dell'adattatore; confronto su 3 pagine reali (problemi trovati, falsi positivi, tempo, peso).
- Decisione e motivo in §1 e in `plan/README.md`.

**Criteri di accettazione**
- [ ] Tabella del confronto in questa sezione; decisione presa dal maintainer.

#### F4-02 · SEO: indicizzazione e condivisione — M
**Dipendenze**: F2-02
- Canonical (presente, assoluto, un solo), `robots noindex`/`nofollow` (avviso), Open Graph e Twitter card essenziali, `hreflang` coerenti.

**Criteri di accettazione**
- [ ] Test con una pagina completa (nessun problema) e una per ogni mancanza.

#### F4-03 · SEO: contenuti — M
**Dipendenze**: F2-02
- JSON-LD valido (parse e `@type`), title o description duplicati nella pagina, risorse `http:` in una pagina `https:`.

**Criteri di accettazione**
- [ ] Un JSON-LD malformato è un errore con la posizione dell'errore di parse.

#### F4-04 · Accessibilità: regole mancanti — L
**Dipendenze**: F4-01 (solo se la decisione è «regole proprie»)
- Id duplicati, riferimenti ARIA verso id inesistenti, `aria-hidden` su focalizzabili, titolo degli `iframe`, intestazioni delle tabelle, struttura delle liste, skip link, media in autoplay.

**Criteri di accettazione**
- [ ] Ogni regola ha test sul caso da segnalare e sui pattern validi.

#### F4-05 · Prestazioni di caricamento — S
**Dipendenze**: F2-02
- `img` senza `width`/`height` (spostamenti di layout), `loading="lazy"` sulla prima immagine visibile.

**Criteri di accettazione**
- [ ] Le immagini sotto la piega con `loading="lazy"` non sono segnalate (test in Chromium).

#### F4-06 · Documentazione per regola — S
**Dipendenze**: F2-02
- `docs/rules/<id>.md` con cosa controlla, perché, come correggere, riferimento WCAG/SEO; `help` di ogni `Issue` punta alla pagina.

**Criteri di accettazione**
- [ ] Ogni regola del registro ha la sua pagina (test che li confronta).
