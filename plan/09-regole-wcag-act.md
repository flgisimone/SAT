# F9 — Nuove regole da WCAG 2.2 e dalle regole ACT

**Obiettivo**: coprire i requisiti WCAG 2.2 AA che si verificano in modo automatico senza falsi positivi, usando le regole ACT del W3C come specifica dei casi. Analisi in [00-analisi-linee-guida.md](00-analisi-linee-guida.md) §3.

> **Stato: da fare.**

---

## 1. Decisioni

- **Una regola ACT è la specifica**: applicabilità, aspettative e casi di test (passed, failed, inapplicable) diventano i test della regola. I casi «inapplicable» e «passed» non devono produrre problemi.
- **Esclusi**: 2.4.11 Focus Not Obscured, 2.5.7 Dragging Movements, 3.2.6 Consistent Help, 3.3.7 Redundant Entry, 3.3.8 Accessible Authentication e le regole ACT che chiedono un giudizio umano.
- **Con axe attivo** le regole che axe copre si spengono, come per le regole esistenti (F4).
- **Versione 1.14.0**: regole nuove accese di default.

## 2. Task

#### F9-01 · `aria-attributes` — M
**Dipendenze**: —
- ACT 5f99a7 (attributo definito), 6a7281 (valore valido), 4e8ab6 (stati e proprietà richiesti), 5c01ea (permesso per il ruolo), kb1m8s (globali vietati). Tabelle da WAI-ARIA 1.2, accanto ai ruoli di `aria-roles`.

**Criteri di accettazione**
- [ ] I casi di test ACT delle cinque regole passano.

#### F9-02 · `aria-hidden-focus` — S
**Dipendenze**: —
- ACT 6cfa84: contenuto focalizzabile dentro `aria-hidden="true"`.

**Criteri di accettazione**
- [ ] I casi di test ACT passano; `tabindex="-1"` e `disabled` dentro `aria-hidden` non sono segnalati.

#### F9-03 · `target-size` — M
**Dipendenze**: —
- WCAG 2.5.8 (AA): bersagli sotto 24×24 px CSS, con l'eccezione della spaziatura (cerchio di 24 px che non tocca altri bersagli) e le eccezioni inline e user agent. Solo nel browser, come `image-lazy-load`.

**Criteri di accettazione**
- [ ] Test in Chromium: bottone 20×20 isolato non segnalato (spaziatura); due bottoni 20×20 adiacenti segnalati; link in una frase non segnalato; checkbox nativa senza stili non segnalata.

#### F9-04 · `meta-viewport` e `meta-refresh` — S
**Dipendenze**: —
- ACT b4f0c3 (WCAG 1.4.4): `user-scalable=no` o `maximum-scale` < 2. ACT bc659a (2.2.1, 3.2.5): refresh con ritardo tra 1 e 72 000 secondi.

**Criteri di accettazione**
- [ ] I casi di test ACT passano.

#### F9-05 · `iframe-name` e `accessible-name` estesa — S
**Dipendenze**: —
- ACT cae760: `<iframe>` senza nome. In `accessible-name`: `summary` (2t702h), `menuitem` (m6b1q3), titoli vuoti (ffd0e9), `<object>` (8fc3b6).

**Criteri di accettazione**
- [ ] I casi di test ACT passano; `<iframe aria-hidden="true">` e `tabindex="-1"` fuori dall'albero non sono segnalati.

#### F9-06 · `autocomplete-valid` — S
**Dipendenze**: —
- ACT 73f2c2 (WCAG 1.3.5): token di `autocomplete` validi secondo HTML («autofill detail tokens»).

**Criteri di accettazione**
- [ ] `autocomplete="shipping email"` valido; `autocomplete="mail"` errore; `off` e `on` non segnalati.

#### F9-07 · `label-in-name` — S
**Dipendenze**: —
- ACT 2ee8b8 (WCAG 2.5.3): per i widget con ruolo che prende il nome dal contenuto, il testo visibile è contenuto nel nome accessibile.

**Criteri di accettazione**
- [ ] `<button aria-label="Invia modulo">Invia</button>` valido; `<button aria-label="Chiudi">Invia</button>` errore.

#### F9-08 · `table-headers` e `media-autoplay` — S
**Dipendenze**: —
- ACT a25f45 e d0f69e (1.3.1): `headers` che puntano fuori dalla tabella, intestazioni senza celle. ACT 80f0bf (1.4.2): `<video>`/`<audio>` `autoplay` senza `muted`, con un avviso perché la durata dell'audio non si conosce.

**Criteri di accettazione**
- [ ] I casi di test ACT passano.

#### F9-09 · Documentazione e rilascio — S
**Dipendenze**: F9-01 … F9-08
- Pagine in `docs/rules/`, README, `CHANGELOG.md`, versione 1.14.0.

**Criteri di accettazione**
- [ ] `npm run verify` e `npm run verify:e2e` passano.
