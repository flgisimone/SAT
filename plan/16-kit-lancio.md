# F16 — Kit di lancio

**Obiettivo**: materiali pronti per far conoscere SAT a sviluppatori che possono usarlo, e un modo semplice per capire cosa funziona. Gli agenti preparano i materiali; li pubblica il maintainer.

> **Stato: da iniziare.** Fonte: roadmap di crescita del 25/10/2026, fasi 3, 4 e 7.

---

## 1. Decisioni

- **Il materiale sta in `plan/lancio/`**: non va nel pacchetto né nel README.
- **Un'idea per contenuto**, partendo da un problema tecnico concreto; niente messaggio promozionale identico su tutti i canali.
- **Niente promesse assolute** (vedi F14 §1); in ogni post i limiti e una domanda precisa per chi legge.
- **Hacker News dopo**, quando ci sono i primi feedback esterni e la 1.18.0 è stabile.
- **Le metriche guidano le fasi successive**: i download npm da soli non provano l'adozione (CI, cache, mirror).
- **Estensione sul Chrome Web Store: non ora** (decisione del 25/10/2026). Si riconsidera se i feedback chiedono di provare SAT su siti senza installarlo.

## 2. Task

#### F16-01 · Script dei video — S
**Dipendenze**: F14-01
- `plan/lancio/video.md`: sei video da 15–40 secondi (il problema; la scoperta; dal problema all'elemento; il workflow con il plugin Vite; CI e report; una modifica nata da un feedback). Per ognuno: inquadrature, testo a schermo e sottotitoli, invito finale, didascalie per X, LinkedIn e YouTube Shorts.
- Le scene riproducibili si registrano con `npm run media` (F14-01), con una variante per scena se serve.

**Criteri di accettazione**
- [ ] Ogni video mostra solo funzioni presenti nella 1.18.0.

#### F16-02 · Tutorial per Dev.to — S
**Dipendenze**: F14-03
- `plan/lancio/devto.md`: «Find accessibility and SEO issues while you code, with a Vite plugin» (titolo da rivedere), dal progetto vuoto alla CI, con screenshot, limiti e link a demo e repository.

**Criteri di accettazione**
- [ ] Ogni passo è stato eseguito su `examples/vite-vanilla`.

#### F16-03 · Post per le community — S
**Dipendenze**: F14-02
- `plan/lancio/community.md`: bozze per r/webdev, r/accessibility, r/javascript e GitHub Discussions, ciascuna con le regole della community da verificare prima, il problema da cui parte, GIF, limiti e una domanda precisa («quali controlli vi mancano?»).
- Bozza per Show HN, da usare dopo i primi feedback.

**Criteri di accettazione**
- [ ] Ogni bozza è diversa nell'apertura e nella domanda; le regole delle community sono citate con il link.

#### F16-04 · Registro delle metriche — S
**Dipendenze**: —
- `scripts/stats.mjs` (`npm run stats`): download settimanali da `api.npmjs.org/downloads/point/last-week/seo-accessibility-tool`, stelle, fork e issue aperte dall'API pubblica di GitHub; stampa una riga pronta da incollare. `ponytail:` niente traffico del repository, che richiede un token: si legge a mano da Insights.
- `plan/lancio/metriche.md`: tabella settimanale (numeri, provenienza delle visite da Insights, feedback raggruppati per tema) e le cinque domande della revisione settimanale, con le tre priorità successive.

**Criteri di accettazione**
- [ ] `npm run stats` funziona senza token e fallisce con un messaggio chiaro senza rete.

#### F16-05 · Triage dei feedback — S
**Dipendenze**: F13-06
- Etichette su GitHub (`bug`, `false-positive`, `new-rule`, `docs`, `good first issue`) e ordine di priorità: blocca l'installazione → risultati poco chiari → falsi positivi → documentazione → regole richieste da più persone → prestazioni.
- Scritto in `CONTRIBUTING.md`; le etichette le crea il maintainer.

**Criteri di accettazione**
- [ ] Le etichette esistono sul repository e i template di F13-06 le assegnano.

## 3. Dopo il lancio

Le fasi successive nascono dal registro delle metriche e dai feedback (roadmap, fasi 5 e 8): non si pianificano prima.
