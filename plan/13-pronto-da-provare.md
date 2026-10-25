# F13 — Pronto da provare

**Obiettivo**: chi non conosce SAT lo installa da npm su un progetto pulito, segue solo il README e lo vede funzionare. Il pacchetto pubblicato è quello documentato: oggi su npm c'è la 1.6.0 (aprile 2025), mentre il README descrive la 1.17.0.

> **Stato: completata (25/10/2026), versione 1.18.0, che non si pubblica: si pubblica la 1.19.0 di F17** con la checklist in fondo, aggiornata. Fonte: roadmap di crescita del 25/10/2026, fase 0 e parte della fase 6.

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
- [x] `npm pack --dry-run` include `LICENSE`, `README.md`, `CHANGELOG.md` e `dist/`, e nient'altro.

#### F13-02 · Installazione pulita in CI — M
**Dipendenze**: F13-01
- Script `scripts/smoke.mjs`: `npm pack`, poi per ogni cartella di `examples/` copia in una directory temporanea, `npm install <tarball>`, build e prova.
- La prova apre la pagina in Chromium e controlla che il pannello compaia e che i problemi attesi ci siano.
- Per la CLI: `npx sat-check` sulla pagina d'esempio, exit code 1 e report JSON con i problemi attesi.
- Job `smoke` nel workflow, dopo `verify:e2e`; comando `npm run smoke` per la postazione.

**Criteri di accettazione**
- [x] Il job fallisce se si rompe un `exports`, se manca un file dal tarball o se una peer dependency diventa obbligatoria (provato a mano rompendone una).

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
- [x] `npm run smoke` passa su tutti gli esempi.

#### F13-04 · Pagina con errori voluti e risultati attesi — S
**Dipendenze**: —
- Un HTML con un problema per ciascuna delle regole più comprensibili: immagine senza `alt`, titoli che saltano un livello, campo senza etichetta, contrasto basso, link «click here», `meta description` e `canonical` mancanti, `lang` assente; più alcuni pattern validi vicini che non devono essere segnalati.
- Accanto, `expected.json` con regola e selettore di ogni problema atteso.
- È la base di esempi (F13-03), demo (F14-02) e video (F16).

**Criteri di accettazione**
- [x] Test in Chromium: `runSAT` sulla pagina dà esattamente i problemi di `expected.json` (stessa regola e selettore, nessuno in più).

#### F13-05 · Limiti dichiarati — S
**Dipendenze**: —
- Sezione «What SAT does not do» nel README:
  - non certifica la conformità WCAG: i controlli automatici ne coprono una parte, il resto va provato a mano e con lettori di schermo;
  - non garantisce il posizionamento su Google;
  - in pagina gira solo in sviluppo; i link rotti completi solo nella CLI;
  - cosa non vede: contenuti dentro iframe di altre origini, canvas, stati che compaiono solo con l'interazione.
- Le funzioni opzionali (axe-core, Fix with AI) segnate come tali, con i requisiti.

**Criteri di accettazione**
- [x] Ogni limite elencato è vero sul codice attuale (verificato, non presunto).

#### F13-06 · Contribuire e segnalare — S
**Dipendenze**: —
- `CONTRIBUTING.md` in inglese: setup, `npm run verify`, come aggiungere una regola (fonte, test sul caso e sui pattern validi), come si propone una modifica. Rimanda a CONVENTIONS e AGENTS per i dettagli.
- `.github/ISSUE_TEMPLATE/`: bug (versione, framework, pagina o HTML minimo, atteso e ottenuto), falso positivo (HTML e fonte che lo dichiara valido), nuova regola (fonte); `config.yml` che manda le domande a Discussions.
- `.github/pull_request_template.md` breve.
- `SECURITY.md`: come segnalare un problema, soprattutto sull'endpoint di Fix with AI.

**Criteri di accettazione**
- [x] I template compaiono su GitHub alla creazione di una issue (provato dopo il push). *Verificato dal maintainer il 25/10/2026.*

#### F13-07 · Rilascio 1.18.0 — S
**Dipendenze**: F13-01 … F13-06
- `CHANGELOG.md`: le voci dalla 1.7.0 alla 1.17.0 restano, ma «unreleased» diventa la data della 1.18.0 con una nota: su npm si passa dalla 1.6.0 alla 1.18.0. In testa alla 1.18.0 un riassunto delle novità rispetto alla 1.6.0 per chi aggiorna.
- Versione 1.18.0 in `package.json` e nella tabella delle decisioni.
- Checklist per il maintainer in fondo a questo file: `npm run verify`, `verify:e2e`, `smoke`, `npm publish --dry-run`, `npm publish`, tag `v1.18.0`, release su GitHub con il riassunto.

**Criteri di accettazione**
- [x] `npm run verify`, `npm run verify:e2e` e `npm run smoke` passano; la pubblicazione resta al maintainer.

## 3. Note

- **Pagina con errori voluti** in `examples/page/index.html`: 5 errori (`image-alt`, `form-label`, `color-contrast`, `html-lang`, `seo-meta`) e 3 avvisi (`heading-levels`, `link-text`, `canonical`), ognuno accanto al pattern valido simile (`alt=""` decorativo, `<h3>` dopo un `<h4>`, campo con `<label>`, testo `#595959`, link con testo descrittivo). `link-text` è spenta di default: gli esempi la accendono come avviso (`options` in `expected.json`), e così mostrano anche la configurazione. I meta Open Graph e `twitter:card` ci sono apposta, per non avere avvisi `social-meta` fuori dal piano.
- **Una copia della pagina per esempio**: Vite vuole `index.html` nella root del progetto e un esempio deve funzionare da solo, copiato altrove. React e Vue aggiungono soltanto il punto di montaggio e lo script. Lo smoke test controlla su ogni copia i problemi di `expected.json`, quindi una copia che si allontana fa fallire la CI.
- **Lo smoke test** (`scripts/smoke.mjs`) controlla il pannello dai contatori (`5 errors · 3 warnings`) in `vite dev`, perché il pannello non espone gli id delle regole; regole e selettori esatti li controllano il test in Chromium sulla pagina e il report JSON della CLI. Una peer dependency diventata obbligatoria si vede perché npm la installa in un esempio che non la chiede. Prova a mano: `exports['./vue']` su un file inesistente, `files` senza le dichiarazioni, `vue` senza `optional`: in tutti e tre i casi il comando esce con 1 e dice cosa manca.
- **`engines.node >=22`**: Node 20 è fuori supporto dal 30/04/2026 (scelta del 25/10/2026, dopo la prima chiusura della fase con `>=20`, il minimo di Playwright 1.64); il plugin Vite segue la versione di Vite del progetto. Sviluppo e CI usano Node 26 (`.nvmrc`), LTS dal 28/10/2026. Il job `smoke` gira su Node 22 per provare il minimo, con npm 11: npm 10, quello di Node 22, fallisce già su `npm install vite@8` in una cartella vuota (`Cannot read properties of null (reading 'edgesOut')`, nelle peer dependency opzionali di Vite 8), un bug di npm e non di SAT.
- **Limiti verificati sul codice**: le regole non entrano negli `<iframe>` né negli shadow root (nessun accesso a `contentDocument` o `shadowRoot` in `core/` e `sat/`); `color-contrast` salta gli elementi con un'immagine o un gradiente di sfondo (`getEffectiveBackground`); il controller parte solo con `NODE_ENV === "development"` o `enabled: true`; `link-broken` in pagina è spento di default e usa richieste HEAD.
- **Discussions e segnalazioni private** sono spente sul repository (API di GitHub, 25/10/2026): `config.yml` e `SECURITY.md` ci rimandano, quindi il maintainer le attiva in Settings → General → Features → Discussions e Settings → Code security → Private vulnerability reporting (rientra nelle impostazioni del repository di F14).
- **La data della 1.18.0** nel CHANGELOG è quella della fine della fase; se la pubblicazione avviene un altro giorno, si aggiorna insieme alle voci dalla 1.7.0 alla 1.17.0.

## 4. Checklist di rilascio (maintainer)

Aggiornata in F17: la versione da pubblicare è la **1.19.0**, che comprende la 1.18.0.

1. `git checkout develop && git pull`
2. `npm ci`
3. `npm run verify`
4. `npm run verify:e2e`
5. `npm run smoke`
6. `npm publish --dry-run`: controlla versione 1.19.0 e file (`LICENSE`, `README.md`, `CHANGELOG.md`, `package.json`, `dist/`)
7. `npm publish`
8. `git tag v1.19.0 && git push origin v1.19.0`
9. Release su GitHub dal tag `v1.19.0`, con la sezione «Upgrading from 1.6.0» del CHANGELOG come testo
