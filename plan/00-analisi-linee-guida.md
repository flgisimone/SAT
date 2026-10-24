# Analisi: regole di SAT contro le fonti ufficiali, e interfaccia del pannello

Revisione del 24/10/2026. Confronta le 26 regole di SAT 1.12.0 con le fonti normative e ufficiali, e valuta il pannello. Da qui nascono le fasi F8–F10.

## 1. Fonti di riferimento

| Fonte | Versione in vigore | Cosa decide per SAT |
|---|---|---|
| [WCAG 2.2](https://www.w3.org/TR/WCAG22/) (W3C) | Recommendation, aggiornata il 12/12/2024 | Cosa è un errore di accessibilità. Livello di riferimento: **AA**. Il 4.1.1 Parsing è stato tolto |
| [Understanding WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/) | idem | Distingue le tecniche *sufficienti*, i *fallimenti* e le tecniche *consigliate* (non richieste per la conformità) |
| [Regole ACT](https://www.w3.org/WAI/standards-guidelines/act/rules/) (W3C) | 90 regole, nessuna «approved» oggi | Come si verifica in modo automatico un criterio WCAG, con casi di test ufficiali |
| [WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/) | Recommendation, 06/06/2023 | Ruoli, stati e proprietà validi; attributi richiesti e vietati |
| [HTML Living Standard](https://html.spec.whatwg.org/) (WHATWG) | living | Cosa è HTML valido (più `<h1>`, `<a>` senza `href`, `target="_blank"`) |
| [Google Search Central](https://developers.google.com/search/docs) | pagine aggiornate al 2025–2026 | Cosa conta per la ricerca Google: title, description, canonical, hreflang, robots, dati strutturati |
| [Open Graph](https://ogp.me/) | — | Anteprime social |

**Criterio di gravità proposto**, coerente con la decisione «Precisione» del backlog:

- **errore**: violazione di un requisito normativo (criterio WCAG A/AA tramite un fallimento o una regola ACT, «must» di HTML o ARIA, requisito esplicito di Google);
- **avviso**: raccomandazione ufficiale (tecnica consigliata WCAG, «should» di ARIA, best practice di Google);
- **niente**: ciò che le fonti dichiarano valido o irrilevante.

Ogni regola dichiara la propria fonte con un link (`Issue.help` e pagina in `docs/rules/`).

## 2. Regole esistenti che vanno oltre le fonti

| Regola | Oggi | Cosa dicono le fonti | Proposta |
|---|---|---|---|
| `seo-meta` | Avviso se il title supera 60 caratteri e la description 160 | Google: «there's no limit on how long a `<title>` element can be» e lo stesso per la meta description; chiede solo di evitare testi inutilmente lunghi ([title link](https://developers.google.com/search/docs/appearance/title-link), [snippet](https://developers.google.com/search/docs/appearance/snippet)) | Togliere le soglie di lunghezza. Restano presenza, unicità e testo non vuoto |
| `h1` | Errore se manca o se ce n'è più di uno | HTML ammette più `<h1>`. Google: nessun numero ideale di titoli; il rischio è solo che, con più titoli dello stesso peso visivo, scelga il primo come title link | `<h1>` mancante → avviso; più `<h1>` → non segnalato |
| `h1-visible` | Errore | Nessun requisito normativo; Google sconsiglia il testo nascosto | Avviso |
| `heading-levels` | Errore sui livelli saltati (H2 → H4) | WCAG 1.3.1: saltare livelli non è un fallimento; G141 è una tecnica *consigliata*, «not required for conformance» | Avviso |
| `link-target-blank` | Avviso senza `rel="noopener noreferrer"` | HTML: `target="_blank"` implica già `noopener` (algoritmo «get an element's noopener»); `noreferrer` è una scelta di privacy, non un requisito | Spenta di default; se accesa segnala solo `rel="opener"` |
| `link-href` | Avviso su `<a>` senza `href` | HTML: `<a>` senza `href` è un link segnaposto valido | Non segnalato. Restano `href=""`, `#` e `javascript:` |
| `color-contrast` | Errore sotto AA, avviso sotto AAA | Il livello di riferimento comune è AA; l'AAA (1.4.6) è facoltativo | Nuova opzione `wcagLevel: 'AA' \| 'AAA'`, default `AA`: niente avvisi AAA se non richiesti |
| `landmarks` | Errore se non c'è esattamente un `<main>` | HTML: è un errore più di un `<main>` visibile («must not»). La mancanza di `<main>` è una delle tecniche per il 2.4.1 (ACT b40fd1), non un requisito | Più `<main>` visibili → errore; nessun `<main>` → avviso |
| `html-lang` | Solo presenza | ACT bf051a: il valore deve essere un tag di lingua valido | Aggiungere la validità (BCP 47), e per ogni `lang` sugli elementi (ACT de46e4) |

## 3. Requisiti ufficiali che SAT non controlla

Verificabili in modo automatico e senza falsi positivi, con la regola ACT come specifica dei casi da segnalare e di quelli validi.

**Accessibilità (WCAG 2.2 AA tramite ACT)**

| Regola proposta | Criterio | Regola ACT | Note |
|---|---|---|---|
| `target-size` | 2.5.8 Target Size (Minimum), **nuovo in 2.2** | — | Bersagli sotto 24×24 px CSS, con l'eccezione della spaziatura (cerchio di 24 px) e le eccezioni inline e user agent. Solo nel browser |
| `aria-attributes` | 4.1.2 | 5f99a7, 6a7281, 4e8ab6, 5c01ea, kb1m8s | Attributi `aria-*` inesistenti, valori non validi, proprietà richieste mancanti, attributi non permessi o vietati per il ruolo |
| `aria-hidden-focus` | 4.1.2 | 6cfa84 | Elementi focalizzabili dentro `aria-hidden="true"` |
| `meta-viewport` | 1.4.4 Resize Text | b4f0c3 | `user-scalable=no` o `maximum-scale` < 2 |
| `meta-refresh` | 2.2.1, 3.2.5 | bc659a | `<meta http-equiv="refresh">` con ritardo |
| `iframe-name` | 4.1.2 | cae760 | `<iframe>` senza nome accessibile |
| `autocomplete-valid` | 1.3.5 Identify Input Purpose | 73f2c2 | Token di `autocomplete` non validi |
| `label-in-name` | 2.5.3 Label in Name | 2ee8b8 | Il testo visibile non è contenuto nel nome accessibile (`aria-label` diverso dall'etichetta) |
| `table-headers` | 1.3.1 | a25f45, d0f69e | `headers` che puntano fuori dalla tabella; intestazioni senza celle |
| `media-autoplay` | 1.4.2 Audio Control | 80f0bf | `<video>`/`<audio>` `autoplay` senza `muted` e senza controlli |
| `accessible-name` (estesa) | 4.1.2, 1.1.1 | 2t702h, m6b1q3, ffd0e9, 8fc3b6 | `summary`, `menuitem`, titoli vuoti, `<object>` |

**Esclusi** perché non verificabili senza falsi positivi: 2.4.11 Focus Not Obscured (dipende dallo stato della pagina durante la navigazione), 2.5.7 Dragging Movements, 3.2.6 Consistent Help, 3.3.7 Redundant Entry, 3.3.8 Accessible Authentication, e le regole ACT che chiedono un giudizio umano («descriptive», trascrizioni, sottotitoli).

**SEO (Google Search Central)**: i requisiti tecnici principali sono già coperti (title, description, canonical, hreflang, robots, JSON-LD, link scansionabili, viewport). Mancano:

- `structured-data`: le proprietà *obbligatorie* di Google per i tipi di risultato più comuni (Article, Product, BreadcrumbList, Organization…). Grande e da tenere aggiornato con la documentazione di Google: proposta separata, da valutare.
- `hreflang`: il valore `x-default` e la presenza della pagina stessa fra le alternative (link di ritorno alla pagina corrente). Il resto richiede richieste di rete.

## 4. Il pannello

Stato attuale (screenshot sulla pagina di prova):

- Bottoni a emoji (🛑 🔃): resa diversa per sistema operativo, aspetto poco professionale.
- Bordo turchese `#43d8d5` scollegato dal resto della palette; nessun tema scuro.
- La lista mostra solo gli id delle regole (`heading-levels (1)`): bisogna aprire ogni gruppo per leggere il problema; nessun titolo leggibile, nessun criterio WCAG o fonte visibile.
- Filtri come checkbox nude; nessun riepilogo d'insieme (punteggio, conteggi per categoria).
- I riquadri sulla pagina non dicono quale problema segnalano finché non si usa la lista.
- Nessuna verifica che il pannello stesso rispetti WCAG 2.2 AA (contrasti, bersagli 24 px, focus).

Direzione proposta, «accattivante ma professionale», sul modello degli strumenti per sviluppatori (DevTools, Linear, Vercel):

- palette con token CSS e tema chiaro/scuro da `prefers-color-scheme`; un colore d'accento solo, rosso e ambra solo per le gravità;
- icone SVG in linea al posto delle emoji;
- intestazione con marchio SAT, riepilogo (errori, avvisi, accessibilità, SEO) come contatori cliccabili che fanno da filtro;
- problemi raggruppati per categoria con titolo leggibile, messaggio visibile, criterio WCAG o fonte come etichetta e link «Perché e come correggere»;
- etichetta sul riquadro in pagina al passaggio del mouse e al clic;
- pannello ancorabile a sinistra o a destra, transizioni brevi che rispettano `prefers-reduced-motion`;
- il pannello passa le regole di SAT e di axe-core su se stesso (test in Chromium).

## 5. Impatto sulla versione

Cambiano gravità e default di regole esistenti, non le API: **1.13.0** con le modifiche elencate in `CHANGELOG.md`. Chi vuole il comportamento precedente lo riattiva con `rules` e `wcagLevel: 'AAA'`.
