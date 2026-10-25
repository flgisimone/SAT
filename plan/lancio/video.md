# Script dei video

Sette video brevi, uno per idea; il messaggio è il pannello in `vite dev` che passa i problemi all'agente IA (F17), CI e report vengono dopo. Li registra e li pubblica il maintainer; il testo a schermo, i sottotitoli e le didascalie sono in inglese, come il README.

## Regole comuni

- **Solo la 1.19.0**: ogni scena usa funzioni del pacchetto pubblicato. Prima di registrare, `npm view seo-accessibility-tool version` deve dare 1.19.0 o successiva.
- **Formato**: registrazione 16:9 a 1200×720 o più (X, LinkedIn). Per YouTube Shorts, che vuole il verticale, la stessa clip al centro di un fotogramma 1080×1920 con il testo sopra e sotto:
  `ffmpeg -i clip.webm -vf "scale=1080:-2,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:white" -c:v libx264 -pix_fmt yuv420p short.mp4` (da provare: `ffmpeg` non era installato quando è stato scritto).
- **Sottotitoli sempre accesi**: chi scorre i social guarda senza audio. Il testo a schermo coincide con i sottotitoli; frasi brevi, almeno due secondi l'una. Niente musica che copra una voce.
- **Scene riproducibili**: le scene sulla pagina con errori voluti vengono da `npm run media -- --video <file.webm>`, che salva la registrazione intera (circa 15 s: play, pannello, clic sull'immagine senza `alt`, clic sul campo senza etichetta, Struttura). Le altre (editor, terminale, GitHub) sono registrazioni dello schermo fatte a mano, con i passi scritti sotto.
- **Niente promesse assolute** (F14 §1): né «WCAG compliant» né «rank higher». Dove si mostra un conteggio a zero, si dice «zero errors SAT can detect».
- **Invito finale**: un'azione sola per video, il link nella didascalia, non a schermo.

---

## 1. Il problema — 20 s

**Idea**: gli errori di accessibilità e SEO ci sono già nella pagina di partenza, e nessuno li vede.

| Tempo | Inquadratura | Testo a schermo / sottotitoli |
|---|---|---|
| 0–4 s | La pagina iniziale del template vanilla di `npm create vite@latest`, nel browser | This page looks fine. |
| 4–8 s | Clic su play nel dock di SAT: compaiono i riquadri | It's Vite's starter page. Before writing a line of code: |
| 8–16 s | Pannello aperto; zoom su tre problemi, uno alla volta | An image with no alt text. / A button at 3.83:1 contrast. AA needs 4.5:1. / No meta description. |
| 16–20 s | Il pannello intero | You don't see these while coding. Unless something shows you. |

**Come si registra**: `npm create vite@latest my-site -- --template vanilla`, `npm install -D seo-accessibility-tool`, `sat()` in `vite.config.js`, `npm run dev`. Il 25/10/2026 (Vite 8.3) SAT dava «3 errors · 6 warnings»: se il template è cambiato, il testo segue quello che SAT trova allora.

**Invito**: provare la demo.

- **X**: Vite's starter page already has 3 accessibility and SEO errors: an image with no alt, a button at 3.83:1 contrast, no meta description. Here's a panel that shows them in vite dev. Demo, nothing to install: https://flgisimone.github.io/SAT/
- **LinkedIn**: Accessibility and SEO issues rarely get written on purpose. They come with the starter, the copied component, the quick fix, and nobody sees them until an audit.<br><br>I built SAT, an open source panel for the dev server that shows WCAG, ARIA and SEO issues on the page, next to the elements. On Vite's own starter page it finds three errors before you write a line.<br><br>Automated checks find part of the issues, not all: keyboard and screen reader testing still need a person. Live demo: https://flgisimone.github.io/SAT/ #accessibility #webdev
- **YouTube Shorts**: titolo «Vite's starter page has 3 accessibility errors»; descrizione: «SAT, an open source accessibility and SEO panel for vite dev. Demo: https://flgisimone.github.io/SAT/ · Code: https://github.com/flgisimone/SAT»

## 2. Il tuo agente corregge — 40 s

**Idea**: l'agente non vede la pagina; SAT gliela fa vedere via MCP, e lui corregge il sorgente e ricontrolla.

| Tempo | Inquadratura | Testo a schermo / sottotitoli |
|---|---|---|
| 0–5 s | Browser su `vite dev`, pannello aperto: «4 errors · 3 warnings» | Your AI agent writes the code. It doesn't see the page. |
| 5–11 s | Terminale: `claude mcp add --transport http sat http://localhost:5173/__sat/mcp` | SAT shows it the issues, through MCP. One line. |
| 11–19 s | Claude Code: «Fix the SAT issues on this page.»; la chiamata a `sat_issues` | It gets each issue: rule, WCAG criterion, selector, the element's HTML. |
| 19–29 s | Le modifiche in `index.html` (alt, label, lang, meta description) | It fixes the source, not the page. |
| 29–35 s | La chiamata a `sat_recheck`; nel browser il conteggio scende | Then it checks the page again. |
| 35–40 s | La tabella degli agenti nel README | Cursor, Copilot, Codex, Gemini CLI, Windsurf, Zed: same server. |

**Come si registra**: `npx degit flgisimone/SAT/examples/vite-vanilla my-site` (ha già `mcp: true` e axe-core), `npm install`, `npm run dev`, pagina aperta e SAT acceso; Claude Code nella cartella del progetto, terminale e browser affiancati. Claude Code chiede di approvare il server e le modifiche: si approvano fuori inquadratura o si tagliano. Il risultato dell'agente cambia da una prova all'altra: a schermo il conteggio che resta, mai «0 errors» come promessa; se arriva a zero, «zero errors SAT can detect».

**Invito**: la guida agli agenti.

- **X**: Your coding agent can't see the rendered page: the 1.98:1 contrast, the field with only a placeholder, the missing lang. SAT shows it the issues from vite dev through MCP; it fixes the source and checks again. Claude Code, Cursor, Copilot, Codex, Gemini CLI… https://github.com/flgisimone/SAT/blob/develop/docs/guides/ai-agents.md
- **LinkedIn**: Coding agents write most of my markup now. They work from the source, so they miss what only shows up on the rendered page: contrast, labels, headings, meta tags.<br><br>SAT, an open source panel for vite dev, now has an MCP server: `sat({ mcp: true })`, one line in your agent's config, and it gets the issues of the page you have open, with the element's HTML and the WCAG criterion. It fixes the code and asks SAT to check again. Your agent, your model, your permissions; SAT sends nothing anywhere.<br><br>Automated checks find part of the issues: review the diff, and test with a keyboard and a screen reader. https://github.com/flgisimone/SAT #accessibility #ai
- **YouTube Shorts**: titolo «Let your AI agent see accessibility issues»; descrizione: «SAT's MCP server for vite dev. Guide: https://github.com/flgisimone/SAT/blob/develop/docs/guides/ai-agents.md»

## 3. La scoperta — 15 s

**Idea**: un clic, e gli errori sono sulla pagina, non in un report.

| Tempo | Inquadratura | Testo a schermo / sottotitoli |
|---|---|---|
| 0–3 s | La pagina con errori voluti, dock di SAT nell'angolo | One click. |
| 3–8 s | Clic su play: riquadri rossi e ambra sugli elementi | Errors in red. Warnings in amber. On the elements, not in a report. |
| 8–12 s | Clic sul conteggio: si apre il pannello, regole con il criterio WCAG | Each with its WCAG criterion or its source. |
| 12–15 s | Il pannello aperto | Your page isn't changed: SAT draws on its own layer. |

**Come si registra**: `npm run media -- --video sat.webm`, primi 8 secondi circa (fino all'apertura del pannello).

**Invito**: aggiungere il plugin a un progetto Vite.

- **X**: Accessibility and SEO issues, drawn on the page while you develop: red for errors, amber for warnings, each with its WCAG criterion. One line in vite.config. https://github.com/flgisimone/SAT
- **LinkedIn**: Most accessibility tools give you a report. I wanted the issues where I work: on the page, next to the element, while the dev server is running.<br><br>SAT draws boxes over the elements with issues and lists them by rule with their WCAG criterion or source. It never changes the page's DOM or styles. Open source, MIT: https://github.com/flgisimone/SAT #a11y #frontend
- **YouTube Shorts**: titolo «Accessibility issues on the page, not in a report»; descrizione: «SAT, the open source accessibility and SEO panel for development. https://github.com/flgisimone/SAT»

## 4. Dal problema all'elemento — 25 s

**Idea**: dal messaggio all'elemento in un clic, anche nelle pagine lunghe.

| Tempo | Inquadratura | Testo a schermo / sottotitoli |
|---|---|---|
| 0–5 s | Pannello aperto, cursore su «Images have alternative text» | "Image has no alt." Which image? |
| 5–11 s | Clic sul problema: la pagina scorre, l'immagine lampeggia | Click the issue: SAT scrolls to it, focuses it and flashes it. |
| 11–17 s | Clic su «Form fields have a label»: il campo email lampeggia | A field with only a placeholder. Found. |
| 17–25 s | Clic su «Structure»: l'albero dei titoli con il livello saltato | And the heading tree, with the skipped level marked. |

**Come si registra**: `npm run media -- --video sat.webm`, la registrazione intera; i sottotitoli seguono i clic.

**Invito**: aprire la demo e cliccare un problema.

- **X**: "Image has no alt text." Which image, on a long page? Click the issue in SAT's panel: it scrolls to the element, focuses it and flashes it. Try it on the demo: https://flgisimone.github.io/SAT/
- **LinkedIn**: The slow part of fixing an accessibility issue is often finding the element. A selector in a report doesn't tell you which component rendered it.<br><br>In SAT's panel every issue is a link to its element: one click scrolls to it, focuses it and flashes its box. The Structure tab shows the heading tree with skipped levels marked. Demo: https://flgisimone.github.io/SAT/ #accessibility #webdevelopment
- **YouTube Shorts**: titolo «From an accessibility issue to its element, in one click»; descrizione: «Demo: https://flgisimone.github.io/SAT/»

## 5. Il workflow con il plugin Vite — 35 s

**Idea**: una riga nel config, poi si corregge e si vede il conteggio scendere, senza cambiare finestra.

| Tempo | Inquadratura | Testo a schermo / sottotitoli |
|---|---|---|
| 0–6 s | Editor: `npm install -D seo-accessibility-tool axe-core` nel terminale integrato, poi `sat()` in `plugins` di `vite.config.js` | One plugin. Your app's code doesn't import it. |
| 6–12 s | Browser affiancato su `vite dev`: play, «4 errors · 3 warnings» | Press play in vite dev. |
| 12–18 s | Clic sul problema dell'immagine; nell'editor, `alt="Blue mug"` sull'`<img id="photo">` | Fix it in the source. |
| 18–26 s | Salvataggio: Vite ricarica, il conteggio passa a «3 errors · 3 warnings» | Save. SAT runs again by itself. |
| 26–35 s | Terminale: `vite build`, poi l'output della build | And it's not in your build: SAT is in vite dev only. |

**Come si registra**: `npx degit flgisimone/SAT/examples/vite-vanilla my-site`, `npm install`, `npm run dev`; editor e browser affiancati. Con axe-core nel template (F17) il conteggio passa da 4 a 3 errori, provato il 25/10/2026 con il plugin di `dist/`; senza axe era da 5 a 4 (F16-02).

**Invito**: il tutorial su Dev.to (F16-02), quando è pubblicato; prima, il README.

- **X**: Add one plugin to vite.config, press play in vite dev, fix the issue in your editor, save: SAT runs again and the count drops. Nothing ends up in your build. Tutorial: <link Dev.to>
- **LinkedIn**: The accessibility check I'll actually run is the one already open while I code.<br><br>SAT's Vite plugin adds a panel to vite dev only: no import in the app, nothing in the build. Fix an issue in the editor, save, and the panel checks the page again on reload. Step-by-step tutorial, from a starter to CI: <link Dev.to> #vite #accessibility
- **YouTube Shorts**: titolo «Accessibility checks in vite dev, with one plugin»; descrizione: «Tutorial: <link Dev.to> · https://github.com/flgisimone/SAT»

## 6. CI e report — 30 s

**Idea**: gli stessi controlli del pannello fanno fallire la pull request, e il report dice dove.

| Tempo | Inquadratura | Testo a schermo / sottotitoli |
|---|---|---|
| 0–8 s | Terminale: `npm run check` sul template, l'output con regola, messaggio e selettore | The same checks, on your build. |
| 8–13 s | `echo $?` → `1` | Above the limit, exit code 1. |
| 13–20 s | GitHub: la pull request con il job SAT rosso, poi l'artifact `sat-report` | In GitHub Actions, the pull request fails. |
| 20–27 s | Il report HTML nel browser | And the report says where. |
| 27–30 s | `--max-errors 4` nel comando | Lots of issues already? Start the limit at today's count. |

**Come si registra**: il template con `npm run build`, `npm run preview` e `npm run check` (output provato in F16-02); su GitHub, un repository di prova creato dal template con il workflow `.github/workflows/sat.yml` e una pull request. Il report è anche su https://flgisimone.github.io/SAT/report.html.

**Invito**: la guida alla CI.

- **X**: The checks from the dev panel, in CI: sat-check opens your pages in Chromium, prints rule, message and selector, writes an HTML report and fails the PR above the limit. Already have many issues? Start the limit at today's count. https://github.com/flgisimone/SAT/blob/develop/docs/guides/ci.md
- **LinkedIn**: A panel in the dev server helps the person who opens it. CI helps the whole team.<br><br>sat-check runs SAT's checks on your build in Chromium, writes JSON and HTML reports and exits with 1 above the limits you set. On a project with many issues you can start the limit at today's count and lower it over time, so the build fails only on new ones. Guide for GitHub Actions and GitLab CI: https://github.com/flgisimone/SAT/blob/develop/docs/guides/ci.md #ci #accessibility
- **YouTube Shorts**: titolo «Fail the pull request on accessibility errors»; descrizione: «sat-check, SAT's CLI for CI. Guide: https://github.com/flgisimone/SAT/blob/develop/docs/guides/ci.md»

## 7. Una modifica nata da un feedback — 30 s

**Da non registrare finché non c'è**: serve una modifica rilasciata su npm che nasce da una issue o una discussione di qualcuno esterno. Prima non esiste, e un video su una modifica inventata non si fa.

| Tempo | Inquadratura | Testo a schermo / sottotitoli |
|---|---|---|
| 0–6 s | La issue su GitHub (nome dell'autore solo con il suo permesso) | Someone reported this. |
| 6–14 s | Prima: la versione precedente con il problema (falso positivo, messaggio poco chiaro…) | Before: <cosa succedeva>. |
| 14–24 s | Dopo: la versione nuova sulla stessa pagina | After, in <versione>: <cosa succede ora>. |
| 24–30 s | Il CHANGELOG con la riga della modifica | Found something wrong? Open an issue. |

**Come si registra**: la pagina minima della issue (dal template `false-positive.yml`), con le due versioni installate in due cartelle.

**Invito**: aprire una issue con il template giusto.

- **X**: <autore o "Someone"> reported <problema> in SAT. Fixed in <versione>: <cosa cambia>. Found something SAT gets wrong? https://github.com/flgisimone/SAT/issues/new/choose
- **LinkedIn**: <Il problema in una frase, come l'ha descritto chi l'ha segnalato.><br><br><Cosa è cambiato e perché, con la fonte (WCAG, ARIA, HTML, Google) se è un falso positivo.> Reports like this are the most useful contribution to SAT: https://github.com/flgisimone/SAT/issues/new/choose #opensource #accessibility
- **YouTube Shorts**: titolo «Fixed from a user report: <problema>»; descrizione: «https://github.com/flgisimone/SAT»
