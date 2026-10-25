# F14 — README e demo pubblica

**Obiettivo**: chi arriva sul repository o su npm capisce in dieci secondi a cosa serve SAT e lo vede funzionare senza installare niente.

> **Stato: completata il 25/10/2026: demo online, impostazioni del repository fatte dal maintainer e verificate dall'API pubblica (§4).** Fonte: roadmap di crescita del 25/10/2026, fasi 1 e 2.

---

## 1. Decisioni

- **Messaggio**: «Catch accessibility and SEO issues before your users do.» SAT è un debugger visuale di accessibilità e SEO per lo sviluppo, non l'ennesimo SEO checker.
- **Niente promesse assolute**: nessun «WCAG compliant», nessun «rank higher». I limiti di F13-05 restano visibili.
- **Demo su GitHub Pages**, pubblicata da un workflow del repository: pagina statica con errori voluti e SAT già attivo, con lo script in pagina dell'estensione (`dist/extension/sat.js`), che parte anche fuori dallo sviluppo.
- **Le immagini si rigenerano**: GIF e screenshot li produce uno script Playwright sulla pagina di F13-04, così si aggiornano quando cambia il pannello.
- **Badge solo verificabili**: versione npm, licenza, stato della CI.

## 2. Task

#### F14-01 · Immagini riproducibili — M
**Dipendenze**: F13-04
- `scripts/media.mjs` (`npm run media`): con Playwright apre la pagina con errori voluti, accende SAT, apre il pannello, clicca un problema e arriva all'elemento.
- Registra il video (`recordVideo`) e salva gli screenshot nei due temi in `docs/images/`.
- GIF di 10–20 secondi, sotto i 5 MB, dal video con `ffmpeg` se è installato; altrimenti lo script dice come farla. `ponytail:` niente dipendenza npm per la conversione.

**Criteri di accettazione**
- [x] `npm run media` rigenera screenshot e GIF senza passi manuali (con `ffmpeg` installato).

#### F14-02 · Demo su GitHub Pages — M
**Dipendenze**: F13-04
- `demo/index.html`: la pagina con errori voluti, SAT acceso con il pannello aperto, una barra in alto con «What is this», il comando d'installazione da copiare, il link al repository.
- Una nota visibile su cosa l'analisi automatica non trova (F13-05).
- Workflow `pages.yml`: build e pubblicazione di `demo/` con lo script di SAT, a ogni push su `develop` che tocca `src/` o `demo/`.
- La demo passa a sua volta SAT nella barra che aggiunge (gli errori sono solo quelli voluti).

**Criteri di accettazione**
- [x] Test in Chromium sulla demo costruita: il pannello si apre, i problemi sono quelli di `expected.json`, la barra non ne aggiunge.
- [x] La demo è online e il link funziona da mobile (provato dopo il push). *Online il 25/10/2026: in Chromium da desktop (pannello aperto) e in viewport iPhone 13 (pannello chiuso), «5 errors · 3 warnings», nessun errore JavaScript; resta la prova su un telefono vero.*

#### F14-03 · README riscritto — M
**Dipendenze**: F14-01, F14-02
- Ordine:
  1. nome, messaggio, una frase su cosa fa; badge;
  2. GIF;
  3. link alla demo e installazione;
  4. avvio rapido in tre passi con il caso più semplice (plugin Vite) e cosa si vede;
  5. tabella «Use it with»: Vite, React, Vue, Svelte, Angular, vanilla, estensione, Playwright, CLI, con link alla sezione;
  6. sezioni esistenti (configurazione, regole, axe-core, Fix with AI, CI), accorciate dove ripetono;
  7. limiti (F13-05), contribuire, licenza.
- Emoji nei titoli via, tono uniforme.
- `homepage` in `package.json` passa alla demo.

**Criteri di accettazione**
- [x] La parte visibile senza scorrere su GitHub (desktop) contiene messaggio, GIF e link alla demo; controllata anche da mobile.
- [x] Ogni comando e snippet del README è provato da `npm run smoke` o da un test esistente (eccezioni dichiarate nelle note).

#### F14-04 · Repository su GitHub — S
**Dipendenze**: F14-02
- Checklist per il maintainer (le impostazioni non stanno nel codice): descrizione e sito del repository, topic, immagine social (1280×640, da `npm run media`), Discussions attive con una categoria «Feedback».

**Criteri di accettazione**
- [x] Checklist completata e segnata nelle note della fase.

## 3. Note

- **La demo usa `sat-controller.js`, non lo script dell'estensione**: `dist/extension/sat.js` chiama `satChecker({ enabled: true })` senza opzioni, e la pagina di F13-04 vuole `link-text` acceso (`options` di `expected.json`). Il workflow pubblica `demo/index.html` con `dist/sat-controller.js` e `dist/chunks/`; la pagina importa `./sat-controller.js` con `enabled: true`, quindi parte fuori dallo sviluppo come l'estensione. Il test (`tests/browser/demo.spec.ts`) la serve con lo stesso layout tramite `openPage`.
- **`demo/index.html` è una copia della pagina di F13-04** con la barra (`<aside aria-label="About this demo">`) e lo script, come gli esempi: se si allontana da `expected.json` il test fallisce. Accende SAT cliccando il bottone del dock (solo se non è già acceso da una visita precedente, flag in `localStorage`) e apre il pannello dai contatori. Sotto i 48rem il pannello resta chiuso (coprirebbe la pagina) e la barra dice che i contatori lo aprono; sopra i 75rem la pagina si sposta a destra del pannello.
- **Workflow `pages.yml`** su push in `develop` che tocca `src/`, `demo/` o il workflow stesso, più `workflow_dispatch`. Fallisce finché Pages non è attivo con sorgente «GitHub Actions» (§4): il `GITHUB_TOKEN` non può attivarlo da sé.
- **`npm run media`** (`scripts/media.mjs`): la pagina di F13-04 con SAT importato e non ancora acceso, il contenuto spostato a destra perché il pannello non lo copra. Screenshot 1200×760 a 2× in `panel-light.png` e `panel-dark.png`, `social.png` 1280×640, `sat.gif` da un video 1200×720 (10 fps, 800 px, circa 14 s, 1,7 MB). Il video non mostra il puntatore: lo script aggiunge un pallino che segue il mouse, solo nella registrazione. Senza `ffmpeg` salva gli screenshot e dice come fare la GIF.
- **ffmpeg su questa postazione**: `brew install ffmpeg` fallisce (python@3.15 non compila su macOS 14, configurazione Tier 3 di Homebrew); la GIF è stata fatta con il binario del pacchetto `ffmpeg-static` installato fuori dal progetto e messo nel `PATH`. L'ffmpeg di Playwright non ha l'encoder GIF.
- **Snippet del README e prove**: Vite (`examples/vite-vanilla`, smoke), React ed esempi Vue (smoke), `satChecker` ed `enabled` (`panel.spec.ts`, `bundles.spec.ts`), axe (`axe.spec.ts`), `runSAT`/`fixPrompt` (`example-page.spec.ts`, `fixPrompt.test.ts`), Playwright (`playwright-helper.spec.ts`), CLI e opzioni (`cli.spec.ts`, `examples/cli`), estensione (`npm run build`, `extension.spec.ts`). Non provati alla lettera: lo snippet Angular (Angular non è fra le dipendenze di sviluppo; usa solo `satChecker` ed `enabled`) e il workflow GitHub Actions d'esempio (i suoi comandi `sat-check` sono in `cli.spec.ts`).
- **README**: emoji tolte, colonna «1.x option» della tabella regole tolta (le opzioni 1.x sono nel CHANGELOG, «Upgrading from 1.6.0»); le ancore `README.md#-…` di `docs/rules/` aggiornate. Comando d'installazione `npm install -D`, come negli esempi.
- **CHANGELOG**: voce nella 1.18.0, non ancora pubblicata (su npm c'è la 1.6.0).

## 4. Checklist del maintainer (F14-04)

Impostazioni del repository su GitHub, lette dall'API pubblica il 25/10/2026: descrizione «Universal Accessibility & SEO Checker», sito su npm, Pages e Discussions spente.

- [x] Settings → Pages → Build and deployment → Source: **GitHub Actions**; poi Actions → Demo → Run workflow (o un push su `develop`) e prova di https://flgisimone.github.io/SAT/ da desktop e da telefono.
- [x] Descrizione: «Catch accessibility and SEO issues before your users do. A visual a11y and SEO debugger for your dev server, Playwright and CI.»
- [x] Sito: https://flgisimone.github.io/SAT/
- [x] Topic: `accessibility`, `a11y`, `wcag`, `aria`, `seo`, `devtools`, `vite-plugin`, `playwright`, `react`, `vue`, `svelte`, `ci`.
- [x] Settings → General → Social preview: `docs/images/social.png` (1280×640, da `npm run media`).
- [x] Settings → General → Features → Discussions attive, con una categoria «Feedback»; Settings → Code security → Private vulnerability reporting (da F13).
