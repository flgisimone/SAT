# Post per le community

Una bozza per community, ognuna con un'apertura e una domanda diverse: lo stesso testo su più canali sembra pubblicità e lo è. Le pubblica il maintainer, dal proprio account, e resta a rispondere ai commenti nelle prime ore.

## Prima di pubblicare

- **Le regole delle community si leggono il giorno stesso.** Il 25/10/2026 le pagine delle regole di Reddit non erano leggibili da qui: quello che è scritto sotto viene da fonti secondarie e va verificato sulla pagina linkata e nella sidebar. Se una regola vieta il post, non si pubblica.
- **La 1.19.0 è su npm** e la demo funziona: https://flgisimone.github.io/SAT/.
- **Un post alla volta**, a qualche giorno di distanza: i feedback del primo cambiano il secondo. Ordine proposto: GitHub Discussions (resta come riferimento), r/webdev, r/javascript, r/accessibility; Show HN dopo.
- **GIF**: `docs/images/sat.gif` (sotto i 5 MB), caricata come immagine del post dove la community lo consente; altrimenti il link alla demo.
- **Ogni post ha i limiti** (cosa SAT non fa, F13-05) e **una domanda precisa**. I feedback vanno in [metriche.md](metriche.md), raggruppati per tema.

---

## r/webdev

**Regole**: https://www.reddit.com/r/webdev/about/rules/. Da fonti secondarie: i progetti propri si mostrano solo nel giorno di **Showoff Saturday**, e un post che sembra un annuncio viene rimosso anche se il progetto è gratuito; conta che il post parta dal problema e chieda un parere. Da verificare: giorno, flair e se serve il codice sorgente.

**Titolo**: My coding agent can't see the rendered page, so I built a dev panel that shows it the accessibility issues

**Testo**:

> Most accessibility and SEO problems I've shipped weren't decisions. A placeholder used as a label, a heading level skipped in a component, a contrast that looked fine on my screen. Now an agent writes a lot of that markup, and it has the same blind spot: it works from the source and never sees the rendered page.
>
> So I built SAT: a panel for `vite dev` that runs WCAG, ARIA and SEO checks on the page and draws boxes on the elements with issues (red errors, amber warnings). Click an issue and it scrolls to the element. With `sat({ mcp: true })` the dev server is also an MCP server: Claude Code, Cursor, Copilot, Codex or Gemini CLI read the issues of the open page (rule, selector, the element's HTML), fix the source and ask SAT to check again. One plugin in `vite.config`, nothing in the build; axe-core's rules run too when it's installed.
>
> [GIF]
>
> What it isn't: it doesn't certify WCAG conformance, and it doesn't fix anything itself (your agent does, and you review the diff). Automated checks find part of the issues; keyboard use, screen readers and whether an alt text makes sense still need a person. It also doesn't look inside iframes, shadow roots or canvas, and it checks the page as it is when it runs (open menus and dialogs need a new run).
>
> Demo with a broken page, nothing to install: https://flgisimone.github.io/SAT/
> Code (MIT): https://github.com/flgisimone/SAT
>
> A question for you: **if your agent writes your components, where do accessibility issues get caught today: in code review, in CI, in QA, or by users?** I'm trying to understand where a tool like this actually helps.

## r/javascript

**Regole**: https://www.reddit.com/r/javascript/about/rules/. Da fonti secondarie (copia della wiki): c'è un thread settimanale **Showoff Saturday** dove si può condividere quasi ogni progetto; un post a sé per un progetto proprio deve avere un contenuto tecnico (codice sorgente o un write-up) e l'autopromozione va tenuta al minimo. Se le regole lo chiedono, si usa il thread del sabato con una versione breve.

**Titolo**: Drawing accessibility issues over a page without touching its DOM: overlay layer, Shadow DOM and a rule engine in TypeScript

**Testo**:

> I've been building SAT, an accessibility and SEO checker that runs inside the page in development. The constraint that shaped the code: **it must never change the page it checks**. No classes, inline styles or `title` attributes on your elements, because a checker that mutates the DOM can hide or cause the issues it's looking for, and it breaks frameworks that own their DOM.
>
> How it works:
>
> - Rules are small functions over the document (selectors, computed styles, accessible names), each tied to a source: a WCAG 2.2 criterion or W3C ACT rule, WAI-ARIA, the HTML standard or Google Search Central. A requirement is an error, a recommendation a warning, and what the source calls valid isn't reported.
> - Highlights live on SAT's own fixed layer, positioned from `getBoundingClientRect()`; the panel is in a Shadow DOM, so neither side's CSS leaks.
> - In single-page apps it reruns on `pushState`, `replaceState` and back/forward; `observeDom` reruns on any DOM change.
> - With the Vite plugin, the dev server is a minimal MCP server (`/__sat/mcp`, about 300 lines, no SDK): the pages post their results after each run, `sat_issues` returns them to the agent and `sat_recheck` asks the open pages to run again over Vite's HMR socket. It speaks both the stateless 2026-07-28 spec and the older `initialize` handshake most clients still use, answers loopback connections with a `localhost` Host only (DNS rebinding) and never touches files.
> - The same rules run in Playwright (`expect(page).toHaveNoSATErrors()`) and in a CLI for CI.
>
> [GIF]
>
> Limits: automated checks find part of the WCAG failures, not all. SAT doesn't see inside iframes, shadow roots of web components or canvas, and it can't judge contrast over images or gradients, so it doesn't report it.
>
> Code (MIT, TypeScript): https://github.com/flgisimone/SAT · demo: https://flgisimone.github.io/SAT/
>
> **Has anyone found a good way to check web components' shadow roots for accessibility without flagging framework internals?** That's the biggest blind spot right now, and I'd rather leave it out than report noise.

## r/accessibility

**Regole**: https://www.reddit.com/r/accessibility/about/rules/. Da fonti secondarie non si trovano le regole; post con strumenti propri compaiono nella community. Da verificare con attenzione: è una community di professionisti e di persone con disabilità, non di sviluppatori. Il post chiede un parere esperto, non promuove; se le regole vietano l'autopromozione, si scrive ai moderatori prima.

**Titolo**: Developer tool question: which automated checks give you the most false positives?

**Testo**:

> I maintain SAT, an open source checker that shows accessibility issues on the page while developers build it. I'm not here to claim it makes anything accessible: automated checks catch part of the WCAG failures, and the rest (keyboard, screen readers, zoom and reflow, whether alt texts and labels make sense) needs people, ideally disabled people.
>
> My worry is the other direction. A developer who sees a flagged valid pattern stops trusting the tool, and then ignores the real issues too. So SAT follows the sources strictly: every rule cites its WCAG 2.2 criterion or W3C ACT rule, WAI-ARIA or the HTML standard; requirements are errors, recommendations warnings, and what the source calls valid isn't reported. For example, `alt=""` on a decorative image is fine, and a heading level that goes back up isn't a skip.
>
> Demo (a page with known issues): https://flgisimone.github.io/SAT/ · rules and their sources: https://github.com/flgisimone/SAT#rules
>
> **From your audits: which automated findings are most often wrong, or right but misleading to developers?** I'd like to check SAT against them, and fix or drop rules that get it wrong.

## GitHub Discussions

**Regole**: discussione nel repository, categoria *Announcements* (solo il maintainer può aprirle) e una seconda in *Ideas* per le richieste; le categorie si configurano dalle impostazioni ([documentazione di GitHub](https://docs.github.com/en/discussions/managing-discussions-for-your-community/managing-categories-for-discussions)). Da fissare in alto (*Pin discussion*). Qui si può essere più diretti: chi la legge è già arrivato al repository.

**Titolo**: SAT 1.19.0: your AI agent sees the page. What's new since 1.6.0, and what should come next?

**Testo**:

> 1.19.0 is the first release on npm since 1.6.0, and it collects everything from 1.7 to 1.18 ([changelog](https://github.com/flgisimone/SAT/blob/develop/CHANGELOG.md)):
>
> - an MCP server in the Vite plugin (`sat({ mcp: true })`): Claude Code, Cursor, Copilot, Codex, Gemini CLI, Windsurf and Zed read the issues of the open page and check again after the fix ([AI agents guide](https://github.com/flgisimone/SAT/blob/develop/docs/guides/ai-agents.md));
> - axe-core runs by itself in the Vite plugin when it's installed;
> - every rule now follows an official source, and valid patterns aren't reported;
> - a new panel, light and dark, with the issues by rule, their WCAG criterion or source, and the heading map;
> - the Vite plugin, the Playwright helper and `sat-check` for CI, with JSON and HTML reports;
> - Copy fix prompt for coding agents, and opt-in Fix with AI with Claude Code from the Vite plugin;
> - guides for [AI agents](https://github.com/flgisimone/SAT/blob/develop/docs/guides/ai-agents.md), [CI](https://github.com/flgisimone/SAT/blob/develop/docs/guides/ci.md), [configuration](https://github.com/flgisimone/SAT/blob/develop/docs/guides/configuration.md), [single-page apps](https://github.com/flgisimone/SAT/blob/develop/docs/guides/spa.md) and [troubleshooting](https://github.com/flgisimone/SAT/blob/develop/docs/guides/troubleshooting.md), and a template: `npx degit flgisimone/SAT/examples/vite-vanilla my-site`.
>
> Upgrading from 1.6.0 changes what SAT reports: see [Upgrading from 1.6.0](https://github.com/flgisimone/SAT/blob/develop/CHANGELOG.md#upgrading-from-160).
>
> What SAT doesn't do is in the [README](https://github.com/flgisimone/SAT#what-sat-does-not-do): it doesn't certify conformance, and it doesn't see iframes, shadow roots or canvas.
>
> **What should come next is up to the people using it.** Reply with the framework you'd use SAT with and the one check you'd want first. A rule asked for by more than one person goes up the list ([how issues are prioritised](https://github.com/flgisimone/SAT/blob/develop/CONTRIBUTING.md#triage)).

## Show HN — dopo

**Quando**: dopo i primi feedback esterni (almeno qualche issue o discussione di persone che l'hanno provato) e con la 1.19.0, o una sua correzione, stabile da qualche settimana (F16 §1).

**Regole**: https://news.ycombinator.com/showhn.html e https://news.ycombinator.com/newsguidelines.html, lette il 25/10/2026. Show HN è per qualcosa che si può provare senza registrarsi: la demo lo è. Il titolo comincia con «Show HN:»; niente richieste di voti o commenti ad amici; l'autore resta a rispondere. Una versione minore di solito non basta: si presenta il progetto, non la release.

**Titolo**: Show HN: SAT – accessibility and SEO issues in vite dev, readable by your AI agent over MCP

**URL**: https://flgisimone.github.io/SAT/ (la demo, che si prova subito)

**Primo commento**:

> I built SAT because the accessibility issues I shipped were never decisions: a placeholder instead of a label, a skipped heading, low contrast. Reports after the fact made them slow to fix, so SAT shows them on the page while you develop: boxes on the elements, a panel with each issue's WCAG criterion or source, a click to jump to the element. With the Vite plugin the dev server is also an MCP server, so a coding agent (Claude Code, Cursor, Copilot, Codex…) reads the issues of the page you have open, fixes the source and asks SAT to check again. The same rules run in Playwright tests and in a CLI for CI.
>
> Two design rules: it never changes the page it checks (highlights are on its own layer, the panel in a Shadow DOM), and it would rather miss an issue than flag a valid pattern, so every rule follows WCAG 2.2/ACT, WAI-ARIA, the HTML standard or Google's documentation.
>
> <Cosa è cambiato con i primi feedback, in una frase: è la prova che il progetto ascolta.>
>
> Limits: automated checks find part of the issues; it doesn't see iframes, shadow roots or canvas, or states that need interaction.
>
> I'd like to hear where it gets things wrong. **If you've built or used an in-page checker before, what made you stop using it?**
