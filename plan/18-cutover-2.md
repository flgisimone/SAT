# F18 — Cutover 2.0: meno superficie

**Obiettivo**: SAT diventa una cosa sola, il pannello in `vite dev` collegato all'agente dell'utente. Si tolgono le API deprecate dalla 1.8.0 e le parti che non servono a quel messaggio: estensione per il browser, crawler della CLI con `link-broken`, wrapper React e Vue. Restano regole, axe-core, pannello, plugin Vite con MCP e «Fix with AI», helper per Playwright e CLI per il controllo di singole pagine. La versione 2.0.0 si pubblica alla fine di F21.

> **Stato: da fare.** Fonte: analisi del cutover del 28/10/2026 (1.19.0 pubblicata il 28/10/2026, prima c'era la 1.6.0 con 2 download a settimana: rompere ora costa meno).

---

## 1. Decisioni

| Tema | Decisione | Motivo |
|---|---|---|
| Versione | **2.0.0**, con le rimozioni di questa fase; si pubblica una volta sola, alla fine di F21 | Un solo salto di versione maggiore per chi arriva dalla 1.x |
| API legacy | Via `enableCheck*` (18 opzioni), `errorMessages`/`warningMessages`, `satReset` | Deprecate dalla 1.8.0 e dalla 1.9.0, destinate alla 2.0 (F2 §1) |
| Estensione | Rimossa | Senza un processo Node non ha né MCP né «Fix with AI»; non è sul Web Store e nessuno la usa |
| Crawler e `link-broken` | Rimossi tutti e due: `--depth`, `--max-pages` e `--not-found` dalla CLI, la regola dal registro | pa11y-ci e unlighthouse fanno meglio il crawling; nel browser la regola ha effetti collaterali (F1-01) |
| Wrapper React e Vue | Rimossi gli entry point `/react` e `/vue`, `react` e `vue` escono dalle peer dependency; il README mostra la riga `satChecker()` | Due entry point per 38 righe; per i progetti senza Vite la strada sarà un server MCP indipendente (dopo i feedback) |
| CLI | Resta, per controllare singole pagine; in F20 riceve `init` e la baseline | Serve agli agenti e alla CI |

## 2. Task

#### F18-01 · Via le API legacy — S
**Dipendenze**: —
- `src/sat/satOptions.ts`: via `LegacyOptions` e `LEGACY_OPTIONS`; `SATOptions` non le estende più.
- `src/core/seoAccessibilityTool.ts`: `settingFor` senza il ramo legacy; `SATResult` senza `errorMessages`/`warningMessages`; via l'export di `satReset` e il file `src/sat/satReset.ts`.
- Controller e pannello (`satChecker.ts`, `satUI.ts`): niente letture delle opzioni o dei campi tolti.
- Test (`tests/model.test.ts`, `tests/checks.test.ts`): via i casi legacy, nessuna copertura persa sulle regole.

**Criteri di accettazione**
- [ ] Nessun riferimento a `enableCheck`, `errorMessages`, `warningMessages`, `satReset` in `src/`, `tests/` e `docs/`.
- [ ] Un test di tipo: un'opzione `enableCheckH1` è un errore di TypeScript.

#### F18-02 · Via l'estensione — S
**Dipendenze**: —
- Via `src/extension/`, le voci di `rollup.config.js` (bundle e `extensionManifest`), `tests/browser/extension.spec.ts`.
- README, `SECURITY.md`, `.github/ISSUE_TEMPLATE/bug.yml` (la voce «extension» fra gli ambienti), `plan/README.md` (tabella degli entry point).

**Criteri di accettazione**
- [ ] `dist/extension` non c'è più dopo il build; `npm run verify:e2e` passa.

#### F18-03 · Via il crawler e `link-broken` — S
**Dipendenze**: —
- `src/headless/cli.ts`: via `--depth`, `--max-pages`, `--not-found` e il codice che segue i link; l'help resta allineato.
- Via `src/core/rules/seo/link-broken.ts`, la sua voce in `src/core/rules/index.ts` e `docs/rules/link-broken.md`; via i riferimenti nella regola `rule.ts` e negli altri file che la citano.
- `tests/browser/cli.spec.ts` e `docs/guides/ci.md`: via i casi e le sezioni del crawler.
- Un `rules: { 'link-broken': … }` rimasto in una configurazione: avviso una volta in console («rule removed in 2.0»), non un errore.

**Criteri di accettazione**
- [ ] Test: `sat-check --depth 1` esce con 2 e dice che l'opzione non c'è più; una configurazione con `link-broken` avvisa e non si rompe.

#### F18-04 · Via i wrapper React e Vue — S
**Dipendenze**: —
- Via `src/integrations/react.ts`, `src/integrations/vue.ts`, gli export `./react` e `./vue`, `react` e `vue` da `peerDependencies` e `peerDependenciesMeta`, gli input in `rollup.config.js`.
- `examples/react` e `examples/vue` passano al plugin Vite (`sat()` in `vite.config.js`, nessun import nell'app); `examples/README.md` e i loro README aggiornati.
- README: «React» e «Vue» diventano una riga sotto «Other frameworks» (plugin Vite o `satChecker()` nell'entry point in dev).

**Criteri di accettazione**
- [ ] `npm run smoke` passa con gli esempi React e Vue sul plugin Vite.
- [ ] `tests/browser/bundles.spec.ts` non prova più i due bundle.

#### F18-05 · Guida di migrazione e documenti — S
**Dipendenze**: F18-01 … F18-04
- `CHANGELOG.md`: sezione «2.0.0 (unreleased)» con «Removed» e «Upgrading from 1.x» (tabella opzione vecchia → nuova, `useSATChecker` → plugin Vite, estensione → plugin o CLI, crawler → pa11y-ci o unlighthouse).
- README, `docs/guides/` (`configuration.md`, `spa.md`, `troubleshooting.md`, `ci.md`) senza le parti tolte.
- `plan/README.md`: tabella degli entry point e decisioni.

**Criteri di accettazione**
- [ ] `tests/guides.test.ts` passa; ogni voce della migrazione ha l'esempio prima e dopo.
- [ ] `npm run verify`, `npm run verify:e2e` e `npm run smoke` passano.
