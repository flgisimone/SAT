# F14 — README e demo pubblica

**Obiettivo**: chi arriva sul repository o su npm capisce in dieci secondi a cosa serve SAT e lo vede funzionare senza installare niente.

> **Stato: da iniziare.** Fonte: roadmap di crescita del 25/10/2026, fasi 1 e 2.

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
- [ ] `npm run media` rigenera screenshot e GIF senza passi manuali (con `ffmpeg` installato).

#### F14-02 · Demo su GitHub Pages — M
**Dipendenze**: F13-04
- `demo/index.html`: la pagina con errori voluti, SAT acceso con il pannello aperto, una barra in alto con «What is this», il comando d'installazione da copiare, il link al repository.
- Una nota visibile su cosa l'analisi automatica non trova (F13-05).
- Workflow `pages.yml`: build e pubblicazione di `demo/` con lo script di SAT, a ogni push su `develop` che tocca `src/` o `demo/`.
- La demo passa a sua volta SAT nella barra che aggiunge (gli errori sono solo quelli voluti).

**Criteri di accettazione**
- [ ] Test in Chromium sulla demo costruita: il pannello si apre, i problemi sono quelli di `expected.json`, la barra non ne aggiunge.
- [ ] La demo è online e il link funziona da mobile (provato dopo il push).

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
- [ ] La parte visibile senza scorrere su GitHub (desktop) contiene messaggio, GIF e link alla demo; controllata anche da mobile.
- [ ] Ogni comando e snippet del README è provato da `npm run smoke` o da un test esistente.

#### F14-04 · Repository su GitHub — S
**Dipendenze**: F14-02
- Checklist per il maintainer (le impostazioni non stanno nel codice): descrizione e sito del repository, topic, immagine social (1280×640, da `npm run media`), Discussions attive con una categoria «Feedback».

**Criteri di accettazione**
- [ ] Checklist completata e segnata nelle note della fase.
