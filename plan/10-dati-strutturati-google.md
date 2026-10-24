# F10 — Dati strutturati secondo Google

**Obiettivo**: `structured-data` verifica le proprietà che Google dichiara obbligatorie per i risultati avanzati, oltre alla sintassi JSON-LD. Fonte: [galleria dei dati strutturati di Google Search](https://developers.google.com/search/docs/appearance/structured-data/search-gallery) (25 funzioni, aggiornata al 16/10/2026).

> **Stato: completata (24/10/2026), versione 1.15.0.**
>
> - Tabella in `src/core/rules/seo/google-structured-data.ts`: requisiti dei nodi di primo livello (`GOOGLE_TYPES`) e di quelli annidati nelle proprietà elencate in `nested` (`NESTED_TYPES`), con pagina e data di Google (8/9/2026, Video 24/9/2026). Ogni requisito è una lista di alternative con percorsi a punti (`offers.price`); in un array basta un elemento.
> - Article (NewsArticle, BlogPosting) e Organization non sono in tabella: Google non dichiara proprietà obbligatorie.
> - Product segue la pagina «Product snippet» (non «Merchant listing», che chiede di più e segnalerebbe snippet validi). Gli Offer si controllano solo dentro Product: in Event `price` è consigliato.
> - `reviewRating` non è obbligatorio nelle Review: l'esempio «pro e contro» di Google non ce l'ha e la pagina lo rende facoltativo con autore e data; si controlla `ratingValue` quando il voto c'è.
> - LocalBusiness: solo `Restaurant` e `Store` fra i sottotipi (quelli degli esempi di Google); BroadcastEvent, SeekToAction e HowToStep non si controllano (`ponytail:` nella tabella).
> - I nodi con lo stesso `@id` si uniscono anche fra blocchi diversi; un nodo che prende `@type` da un altro con lo stesso `@id` non è più «senza `@type`».
> - Gli esempi JSON-LD delle pagine di Google sono in `tests/google-structured-data.json` (copiati il 24/10/2026; esclusi i due frammenti parziali della pagina Video e l'esempio di Organization, che non è JSON valido): nessuno è segnalato, e togliendo ogni proprietà obbligatoria si ha un errore che la nomina.

---

## 1. Decisioni

- **Proprietà obbligatorie → errore** (senza, Google non mostra il risultato avanzato); **consigliate → niente**: sono tante e cambiano spesso, il pannello non deve riempirsi di avvisi.
- **Tipi coperti**: i più diffusi nei siti che usano SAT: Article (e NewsArticle, BlogPosting), BreadcrumbList, Organization, Product (con Offer, AggregateRating, Review), Event, LocalBusiness, Recipe, VideoObject, SoftwareApplication. Gli altri tipi passano senza controlli. FAQPage non è nella galleria di Google e non si controlla.
- **Tabella dati** in un file solo (`src/core/rules/seo/google-structured-data.ts`), con la data della documentazione da cui viene: si aggiorna confrontandola con le pagine di Google. `ponytail:` niente scaricamento delle specifiche a runtime.
- I tipi multipli (`"@type": ["Product", "Thing"]`), `@graph` e i nodi annidati con `@id` sono gestiti.

## 2. Task

#### F10-01 · Tabella delle proprietà obbligatorie — M
**Dipendenze**: —
- Per ogni tipo coperto, le proprietà obbligatorie e le alternative ammesse (es. Product: `name` più uno fra `review`, `aggregateRating`, `offers`), lette dalle pagine di Google.

**Criteri di accettazione**
- [ ] Ogni voce cita la pagina di Google e la data; un test verifica che la tabella sia ben formata.

#### F10-02 · Controllo in `structured-data` — M
**Dipendenze**: F10-01
- Errore per ogni proprietà obbligatoria mancante, con il percorso (`Product > offers > price`) e il link alla pagina di Google.

**Criteri di accettazione**
- [ ] Gli esempi validi delle pagine di Google non sono segnalati; togliendo una proprietà obbligatoria si ha un errore che la nomina.

#### F10-03 · Documentazione e rilascio — S
**Dipendenze**: F10-02
- `docs/rules/structured-data.md`, README, `CHANGELOG.md`, versione 1.15.0.

**Criteri di accettazione**
- [ ] `npm run verify` e `npm run verify:e2e` passano.
