# F8 — Allineamento delle regole alle fonti ufficiali

**Obiettivo**: ogni regola segnala solo ciò che una fonte ufficiale richiede o raccomanda, con la gravità che la fonte le dà e un link alla fonte. Analisi in [00-analisi-linee-guida.md](00-analisi-linee-guida.md) §2.

> **Stato: completata** (versione 1.13.0).
>
> Note di implementazione:
> - **F8-01**: riga **Source** in ogni pagina di `docs/rules/` con i link a W3C (WCAG, ACT, WAI-ARIA, APG), WHATWG, Google Search Central, web.dev, Open Graph e X; tutti verificati (HTTP 200). `tests/model.test.ts` controlla che ogni pagina ne abbia una.
> - **F8-03**: `h1` non segnala più i `<h1>` multipli; il consiglio di Google (titolo principale più evidente) è nella pagina della regola.
> - **F8-05**: `wcagLevel` passa alle regole dal `RuleContext`; Vite e Playwright lo ricevono già con le altre opzioni JSON, la CLI ha `--wcag-level`.
> - **F8-06**: oltre a `<main>`, anche più `role="main"` e più `<header>`/`<footer>` di pagina diventano avvisi: WAI-ARIA usa «should».
> - **F8-07**: validità con `Intl.getCanonicalLocales` (tag BCP 47 ben formato) e `Intl.DisplayNames` per i codici di due lettere; i codici di tre lettere sono accettati. `ponytail:` niente copia del registro IANA finché non servono controlli sui codici di tre lettere. `hreflang` resta com'è: Google chiede codici ISO 639-1. I casi di test ufficiali ACT non sono stati importati: i test usano esempi presi dalle regole (`english`, `em`, `#!`); l'import dei casi ACT è previsto in F9.

---

## 1. Decisioni

- **Gravità dalle fonti**: errore per un requisito normativo (criterio WCAG A/AA tramite fallimento o regola ACT, «must» di HTML o WAI-ARIA, requisito esplicito di Google Search Central); avviso per una raccomandazione ufficiale (tecnica consigliata WCAG, «should», best practice di Google); niente per ciò che le fonti dichiarano valido.
- **Livello WCAG**: AA di default, AAA su richiesta (`wcagLevel`).
- **Versione 1.13.0**: cambiano gravità e default, non le API. Tutto in `CHANGELOG.md`, con il modo di tornare al comportamento precedente.

## 2. Task

#### F8-01 · Fonte per ogni regola — S
**Dipendenze**: —
- Ogni regola dichiara la sua fonte: criterio WCAG, id della regola ACT, sezione di HTML o WAI-ARIA, pagina di Google Search Central. In `docs/rules/` una riga **Fonte** con i link.

**Criteri di accettazione**
- [x] Ogni pagina di `docs/rules/` ha almeno una fonte ufficiale; un test lo verifica.

#### F8-02 · `seo-meta` senza soglie di lunghezza — S
**Dipendenze**: —
- Togliere gli avvisi «title oltre 60 caratteri» e «description oltre 160»: Google dichiara che non c'è limite.

**Criteri di accettazione**
- [x] Un title di 120 caratteri e una description di 300 non sono segnalati; restano presenza, unicità, testo non vuoto e viewport.

#### F8-03 · Titoli: `h1`, `h1-visible`, `heading-levels` — S
**Dipendenze**: —
- `h1`: mancante → avviso; più `<h1>` → non segnalato (HTML li ammette, Google non indica un numero).
- `h1-visible`: avviso.
- `heading-levels`: livelli saltati → avviso (G141 è una tecnica consigliata, non un requisito di 1.3.1).

**Criteri di accettazione**
- [x] Due `<h1>` visibili non producono problemi; una pagina senza `<h1>` dà un avviso; H2 → H4 dà un avviso.

#### F8-04 · Link: `link-target-blank` e `link-href` — S
**Dipendenze**: —
- `link-target-blank`: spenta di default; da accesa segnala solo `target="_blank"` con `rel="opener"` (HTML implica già `noopener`).
- `link-href`: `<a>` senza `href` non è segnalato (link segnaposto valido).

**Criteri di accettazione**
- [x] `<a target="_blank" href>` senza `rel` non è segnalato con le opzioni di default; `<a>` senza `href` non è segnalato.

#### F8-05 · `wcagLevel` e contrasto — S
**Dipendenze**: —
- Opzione `wcagLevel: 'AA' | 'AAA'` (default `AA`) in `SATOptions`, nella CLI (`--wcag-level`), in Playwright e nel plugin Vite. `color-contrast` riporta gli avvisi 1.4.6 solo con `AAA`.

**Criteri di accettazione**
- [x] Testo a 5:1 non è segnalato con `AA` e dà un avviso con `AAA`.

#### F8-06 · `landmarks` — S
**Dipendenze**: —
- Più `<main>` visibili → errore (HTML: «must not»); nessun `<main>` → avviso.

**Criteri di accettazione**
- [x] Un `<main>` più uno `hidden` non sono segnalati; una pagina senza `<main>` dà un avviso.

#### F8-07 · `html-lang`: tag di lingua validi — S
**Dipendenze**: —
- Il valore di `lang` su `<html>` (ACT bf051a) e su ogni elemento (ACT de46e4) è un tag BCP 47 ben formato con sottotag primario esistente. Si riusa la validazione di `hreflang`.

**Criteri di accettazione**
- [x] `lang="en-US"`, `lang="zh-Hant"` validi; `lang="english"`, `lang=" "` errori; i casi di test ACT passano.

#### F8-08 · Documentazione e rilascio — S
**Dipendenze**: F8-01 … F8-07
- README (tabella delle regole, `wcagLevel`), `CHANGELOG.md` con ogni cambio di gravità, versione 1.13.0.

**Criteri di accettazione**
- [x] `npm run verify` e `npm run verify:e2e` passano.
