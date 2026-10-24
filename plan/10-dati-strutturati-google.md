# F10 — Dati strutturati secondo Google

**Obiettivo**: `structured-data` verifica le proprietà che Google dichiara obbligatorie per i risultati avanzati, oltre alla sintassi JSON-LD. Fonte: [galleria dei dati strutturati di Google Search](https://developers.google.com/search/docs/appearance/structured-data/search-gallery) (25 funzioni, aggiornata al 16/10/2026).

> **Stato: da fare.**

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
