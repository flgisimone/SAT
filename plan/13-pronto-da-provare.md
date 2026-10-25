# F13 — Pronto da provare

**Obiettivo**: chi non conosce SAT lo installa da npm su un progetto pulito, segue solo il README e lo vede funzionare. Il pacchetto pubblicato è quello documentato: oggi su npm c'è la 1.6.0 (aprile 2025), mentre il README descrive la 1.17.0.

> **Stato: da iniziare.** Fonte: roadmap di crescita del 25/10/2026, fase 0 e parte della fase 6.

---

## 1. Decisioni

- **Si pubblica la 1.18.0 dopo questa fase**, non la 1.17.0 così com'è: prima si verifica l'installazione pulita. Pubblica il maintainer (CONVENTIONS §8).
- **La verifica dell'installazione gira sul tarball** (`npm pack`), non su `dist/`: è l'unico modo di vedere `files`, `exports`, `bin` e le peer dependency come le vede un utente.
- **Gli esempi sono anche test**: ogni cartella di `examples/` viene installata dal tarball e provata in CI, così non invecchiano.
- **I limiti si dichiarano**: SAT trova una parte dei problemi, non certifica la conformità WCAG né il posizionamento su Google.
- Nessuna modifica alle regole né al pannello in questa fase.

## 2. Task

#### F13-01 · Licenza e metadati del pacchetto — S
**Dipendenze**: —
- File `LICENSE` (MIT, © 2025–2026 Giulio Simone Floresta): oggi lo cita solo il README.
- `package.json`:
  - `description` che dica cosa fa SAT oggi (debugger visuale di accessibilità e SEO), non «Universal … Checker»;
  - `repository.url` e `homepage` su `flgisimone/SAT` (oggi in minuscolo); `homepage` passa alla demo in F14;
  - `keywords` da rivedere: `wcag`, `seo-audit`, `accessibility-testing` sì, `lighthouse` no (SAT non lo usa);
  - `engines.node` con la versione minima che la CLI regge.

**Criteri di accettazione**
- [ ] `npm pack --dry-run` include `LICENSE`, `README.md`, `CHANGELOG.md` e `dist/`, e nient'altro.

#### F13-02 · Installazione pulita in CI — M
**Dipendenze**: F13-01
- Script `scripts/smoke.mjs`: `npm pack`, poi per ogni cartella di `examples/` copia in una directory temporanea, `npm install <tarball>`, build e prova.
- La prova apre la pagina in Chromium e controlla che il pannello compaia e che i problemi attesi ci siano.
- Per la CLI: `npx sat-check` sulla pagina d'esempio, exit code 1 e report JSON con i problemi attesi.
- Job `smoke` nel workflow, dopo `verify:e2e`; comando `npm run smoke` per la postazione.

**Criteri di accettazione**
- [ ] Il job fallisce se si rompe un `exports`, se manca un file dal tarball o se una peer dependency diventa obbligatoria (provato a mano rompendone una).

#### F13-03 · Esempi minimi — M
**Dipendenze**: F13-02
- `examples/` con un progetto per caso d'uso, il più piccolo possibile:
  - `vite-vanilla`: plugin Vite;
  - `react`: `useSATChecker` con Vite;
  - `vue`: `useSatChecker` con Vite;
  - `cli`: pagina statica e `sat-check` con `--json` e `--html`.
- Ogni esempio usa la stessa pagina con errori voluti (F13-04) e ha un README di cinque righe: installa, avvia, cosa vedi.
- Esclusi dal pacchetto npm, da `tsc` e da ESLint del progetto.

**Criteri di accettazione**
- [ ] `npm run smoke` passa su tutti gli esempi.

#### F13-04 · Pagina con errori voluti e risultati attesi — S
**Dipendenze**: —
- Un HTML con un problema per ciascuna delle regole più comprensibili: immagine senza `alt`, titoli che saltano un livello, campo senza etichetta, contrasto basso, link «click here», `meta description` e `canonical` mancanti, `lang` assente; più alcuni pattern validi vicini che non devono essere segnalati.
- Accanto, `expected.json` con regola e selettore di ogni problema atteso.
- È la base di esempi (F13-03), demo (F14-02) e video (F16).

**Criteri di accettazione**
- [ ] Test in Chromium: `runSAT` sulla pagina dà esattamente i problemi di `expected.json` (stessa regola e selettore, nessuno in più).

#### F13-05 · Limiti dichiarati — S
**Dipendenze**: —
- Sezione «What SAT does not do» nel README:
  - non certifica la conformità WCAG: i controlli automatici ne coprono una parte, il resto va provato a mano e con lettori di schermo;
  - non garantisce il posizionamento su Google;
  - in pagina gira solo in sviluppo; i link rotti completi solo nella CLI;
  - cosa non vede: contenuti dentro iframe di altre origini, canvas, stati che compaiono solo con l'interazione.
- Le funzioni opzionali (axe-core, Fix with AI) segnate come tali, con i requisiti.

**Criteri di accettazione**
- [ ] Ogni limite elencato è vero sul codice attuale (verificato, non presunto).

#### F13-06 · Contribuire e segnalare — S
**Dipendenze**: —
- `CONTRIBUTING.md` in inglese: setup, `npm run verify`, come aggiungere una regola (fonte, test sul caso e sui pattern validi), come si propone una modifica. Rimanda a CONVENTIONS e AGENTS per i dettagli.
- `.github/ISSUE_TEMPLATE/`: bug (versione, framework, pagina o HTML minimo, atteso e ottenuto), falso positivo (HTML e fonte che lo dichiara valido), nuova regola (fonte); `config.yml` che manda le domande a Discussions.
- `.github/pull_request_template.md` breve.
- `SECURITY.md`: come segnalare un problema, soprattutto sull'endpoint di Fix with AI.

**Criteri di accettazione**
- [ ] I template compaiono su GitHub alla creazione di una issue (provato dopo il push).

#### F13-07 · Rilascio 1.18.0 — S
**Dipendenze**: F13-01 … F13-06
- `CHANGELOG.md`: le voci dalla 1.7.0 alla 1.17.0 restano, ma «unreleased» diventa la data della 1.18.0 con una nota: su npm si passa dalla 1.6.0 alla 1.18.0. In testa alla 1.18.0 un riassunto delle novità rispetto alla 1.6.0 per chi aggiorna.
- Versione 1.18.0 in `package.json` e nella tabella delle decisioni.
- Checklist per il maintainer in fondo a questo file: `npm run verify`, `verify:e2e`, `smoke`, `npm publish --dry-run`, `npm publish`, tag `v1.18.0`, release su GitHub con il riassunto.

**Criteri di accettazione**
- [ ] `npm run verify`, `npm run verify:e2e` e `npm run smoke` passano; la pubblicazione resta al maintainer.
