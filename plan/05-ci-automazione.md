# F5 — CI e automazione

**Obiettivo**: usare SAT anche fuori dal browser dello sviluppatore: nei test end-to-end, in uno script e nella pipeline, con report e soglie.

> **Stato: da iniziare.** Meglio dopo F4, perché il report deve contenere l'insieme di regole definitivo.

---

## 1. Decisioni

| Tema | Decisione | Motivo |
|---|---|---|
| Esecuzione | I controlli girano sempre in un browser vero (Playwright), mai in jsdom | Contrasto e visibilità hanno bisogno del layout |
| CLI | Pacchetto separato o entry `bin` con Playwright come peer dependency opzionale | Chi usa solo il pannello non deve scaricare un browser |
| Link rotti | Nella CLI, non nel browser: crawler con routing SPA reale | Dal browser non si trovano i 404 delle SPA (F1, `brokenInternalLinksChecker`) |

---

## 2. Task

#### F5-01 · API senza interfaccia — S
**Dipendenze**: F2-04
- `runSAT(document, options)` → `{ issues, summary }` serializzabile in JSON (senza `Element`).

**Criteri di accettazione**
- [ ] Il risultato passa da `JSON.stringify` e mantiene selettori e messaggi.

#### F5-02 · Helper per Playwright — M
**Dipendenze**: F5-01
- `seo-accessibility-tool/playwright`: `await checkPage(page, options)` e `expect(page).toHaveNoSATErrors()`.

**Criteri di accettazione**
- [ ] Il test fallisce con l'elenco leggibile dei problemi; passa su una pagina pulita.

#### F5-03 · CLI — L
**Dipendenze**: F5-02
- `npx sat-check <url…>`: report in console, JSON e HTML; `--max-errors`, `--max-warnings`; exit code per la pipeline.

**Criteri di accettazione**
- [ ] Usata in un workflow di GitHub Actions di esempio nel README.

#### F5-04 · Link rotti nella CLI — M
**Dipendenze**: F5-03
- Visita dei link interni con Playwright (stesso dominio, profondità configurabile), esclusione degli URL tipo logout.

**Criteri di accettazione**
- [ ] In un'app SPA di prova una route inesistente è segnalata.
