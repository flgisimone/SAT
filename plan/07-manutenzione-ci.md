# F7 — Manutenzione della CI

**Obiettivo**: far tornare verde la CI su GitHub Actions e togliere gli avvisi di deprecazione dei runner.

> **Stato: completata** (nessuna nuova versione: cambiano solo dev dependency e CI).
>
> Note di implementazione:
> - **F7-01**: `rollup-plugin-dts` `^6.5.1`; `npm ci` da zero, `npm run verify` e `npm run verify:e2e` passano. `npm pkg set` ha anche riordinato alfabeticamente le `peerDependencies`, senza cambiarle.
> - **F7-02**: `actions/checkout`, `actions/setup-node` e `actions/upload-artifact` a v7 (Node 24) in `ci.yml` e nel README. Il runner Ubuntu 26 si verifica al primo giro della CI.

---

## 1. Task

#### F7-01 · `npm ci` fallisce con TypeScript 6 — S
**Dipendenze**: —
- In CI `npm ci` si ferma con `ERESOLVE`: `rollup-plugin-dts@6.1.1` dichiara come peer `typescript@"^4.5 || ^5.0"`, mentre il progetto usa `typescript@~6.0.3` (F1-06).
- Alzare la dev dependency a `rollup-plugin-dts@^6.5.1`, che accetta `typescript` `^4.5 || ^5 || ^6 || ^7`, e aggiornare `package-lock.json`. Niente `--legacy-peer-deps`.
- Già provato in locale: con 6.5.1 `npm ci` da zero e `npm run verify` passano.

**Criteri di accettazione**
- [x] `rm -rf node_modules && npm ci` passa senza flag.
- [x] `npm run verify` passa e `rollup -c rollup.dts.config.cjs` genera le dichiarazioni come prima.
- [ ] Il job `verify` di `.github/workflows/ci.yml` è verde.

#### F7-02 · Azioni GitHub su Node 24 — S
**Dipendenze**: —
- Le azioni `actions/checkout@v4` e `actions/setup-node@v4` girano su Node 20, deprecato: GitHub le forza su Node 24 e stampa un avviso.
- Passare a `actions/checkout@v7`, `actions/setup-node@v7` e `actions/upload-artifact@v7` (tutte `using: node24`) in `.github/workflows/ci.yml` e nel workflow di esempio del README.
- `ubuntu-latest` passa a Ubuntu 26 dal 19/10/2026: controllare che `npx playwright install --with-deps chromium` funzioni ancora sul runner nuovo.

**Criteri di accettazione**
- [ ] La CI non stampa più l'avviso su Node 20.
- [x] Il workflow di esempio del README usa le stesse versioni.
