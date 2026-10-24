# Analisi di SAT (24/10/2026)

Inventario della libreria dopo la revisione e le correzioni di F1. Serve da base per le fasi F2–F6.

---

## 1. Numeri

| Voce | Valore |
|---|---|
| Versione | 1.6.0 su npm (15/04/2025); 1.7.0 pronta in `develop` (F1) |
| Sorgenti | 26 file TypeScript, circa 1.650 righe |
| Controlli | 19 opzioni, 17 controlli sincroni più i link rotti (asincrono) |
| Bundle | `index.js` 40 KB, `react.js` / `vue.js` / `sat-controller.js` circa 53 KB ciascuno: **200 KB in totale, il core è copiato 4 volte** |
| Dipendenze a runtime | `tslib`; `react` e `vue` peer opzionali |
| Test | 25 unit test (jsdom), 8 test in Chromium |
| CI | GitHub Actions: `verify` e `verify:e2e` |

## 2. Architettura

```
seoAccessibilityTool(options)
  ├─ resetSatLogStats()                 logger globale (modulo)
  ├─ check…(enabled)  × 17              ognuno: queryTargets → logError/logWarning(stringa) → highlight
  └─ checkBrokenInternalLinks()         HEAD verso gli URL interni (spento di default)
  → { errors, warnings, errorMessages[], warningMessages[] }

satChecker(options)                     solo con NODE_ENV=development
  ├─ createSATUI()                      bottoni e pannello con stili inline nel DOM della pagina
  ├─ run → seoAccessibilityTool → render delle stringhe → localStorage per percorso
  └─ stop → satReset() → ripristino degli stili salvati da highlight
```

### Punti di forza
- Nessuna dipendenza a runtime, si integra con una riga in React, Vue o vanilla.
- Le evidenziazioni in pagina e la mappa colorata dei titoli sono immediate da leggere.
- Dopo F1: controlli allineati alle specifiche, reset non distruttivo, test e CI.

### Limiti
| # | Limite | Effetto | Task |
|---|---|---|---|
| A1 | I risultati sono stringhe, senza elemento, id della regola, criterio WCAG | Dalla lista non si arriva all'elemento; niente filtri, raggruppamenti, report JSON | F2-01 |
| A2 | Logger globale a livello di modulo | Due esecuzioni in parallelo si mescolano; ogni bundle ha il suo logger | F2-04 |
| A3 | Elenco dei controlli e 19 flag cablati in tre file | Aggiungere una regola tocca 3 file; nessun livello di gravità per regola | F2-02, F2-03 |
| A4 | Rollup produce 4 bundle indipendenti | Core copiato 4 volte; chi importa `index` e `react` ha due stati | F2-05 |
| A5 | Attivazione solo con `process.env.NODE_ENV === "development"` | Senza bundler SAT non parte; non si può forzare | F2-06 |
| A6 | UI e messaggi mescolano italiano e inglese | Esperienza incoerente | F2-07 |
| A7 | UI con stili inline nel DOM della pagina | Il CSS dell'app (es. `button {…}` globale) altera il pannello | F3-01 |
| A8 | Evidenziazioni scritte sugli elementi dell'app | Spariscono al re-render di React/Vue; invisibili con `outline: none !important` | F3-02 |
| A9 | Il controllo gira solo al clic | Nelle SPA, cambiando route, i risultati sono vecchi | F3-06 |
| A10 | Contrasto: `getComputedStyle` risalendo gli antenati per ogni elemento | Su pagine grandi può bloccare il thread per centinaia di ms (da misurare) | F3-07 |

## 3. Controlli attuali

| Opzione | Cosa segnala | Gravità | Default |
|---|---|---|---|
| `enableCheckH1` | Nessun H1, più H1 | errore | sì |
| `enableCheckH1Visible` | Primo H1 non visibile | errore | sì |
| `enableCheckHeadingOrder` | Mappa colorata dei titoli; primo titolo non H1 | avviso | sì |
| `enableCheckJumpLevels` | Livelli saltati (H2 → H4) | errore | sì |
| `enableCheckAriaLabel` | Bottoni, link, `svg[role=img]` senza nome accessibile | errore | sì |
| `enableCheckAriaRolesWithSuggestions` | Ruoli inesistenti (errore), ruoli ridondanti (avviso) | errore / avviso | sì |
| `enableCheckUniqueLandmarks` | `main` mancante o doppio, header/footer di pagina doppi, `nav` ripetute senza etichetta | errore / avviso | sì |
| `enableCheckTextElementContrast` | Contrasto sotto AA (errore) o AAA (avviso), con soglie per il testo grande | errore / avviso | sì |
| `enableCheckInputLabel` | Campi senza etichetta, `input type=image` senza alt | errore | sì |
| `enableCheckFocusManagement` | Nascosti ma focalizzabili, `tabindex` positivo, elementi non interattivi nel tab order | errore / avviso | sì |
| `enableCheckImageAlt` | `img` senza `alt`, alt che sembra un nome di file | errore / avviso | sì |
| `enableCheckEmptyLinks` | `href` vuoto, `#`, `javascript:` (errore); `<a>` senza href (avviso) | errore / avviso | sì |
| `enableCheckExternalLinksRel` | `target=_blank` senza `noopener noreferrer` | avviso | sì |
| `enableCheckTabindexNegativeOne` | Controlli nativi visibili con `tabindex="-1"` | avviso | sì |
| `enableCheckNonDescriptiveLinks` | Testi generici («click here», «more») | avviso | no |
| `enableCheckBrokenInternalLinks` | Link interni con risposta 4xx/5xx | errore | no |
| `enableCheckHtmlLang` | `<html>` senza `lang` | errore | sì |
| `enableCheckSeoMeta` | `<title>` e meta description mancanti (errore) o lunghi, viewport mancante (avviso) | errore / avviso | sì |

### Copertura mancante
- **Accessibilità**: id duplicati, `aria-labelledby`/`aria-describedby` verso id inesistenti, `aria-hidden` su elementi focalizzabili, titolo degli `iframe`, intestazioni delle tabelle, struttura delle liste, skip link, media in autoplay.
- **SEO**: canonical, `robots noindex`, Open Graph / Twitter card, `hreflang`, JSON-LD valido, title e description duplicati, contenuti misti http/https, `img` senza dimensioni, `loading="lazy"` sull'immagine principale.

## 4. Confronto con axe-core

| | SAT | axe-core |
|---|---|---|
| Regole di accessibilità | 14 controlli | circa 90, mantenute da Deque, mappate su WCAG |
| SEO | Sì (meta, titoli, link) | No |
| Interfaccia in pagina | Sì: bottone, pannello, evidenziazioni | No (serve un'estensione o un'integrazione) |
| Uso in CI | Solo programmatico, senza report | Ampio (Playwright, Cypress, jest-axe) |
| Dimensione | circa 40 KB | circa 500 KB |

Conclusione: inseguire axe-core regola per regola non conviene. Il valore di SAT è **l'esperienza in pagina durante lo sviluppo** e **la parte SEO**. La proposta (da decidere in F4-01) è un adattatore opzionale che trasforma i risultati di axe nel modello `Issue` di F2 e li mostra nell'interfaccia di SAT.
