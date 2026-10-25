# Registro delle metriche

Una riga a settimana, il lunedì. Le metriche servono a scegliere le fasi successive (F16 §3), non a misurare il successo: i download npm contano anche CI, cache e mirror, e da soli non provano che qualcuno usa SAT.

## Come si compila

1. `npm run stats` stampa la riga con periodo, versione su npm, download della settimana, stelle, fork e issue aperte (pull request comprese, come le conta GitHub). Non serve un token; senza rete esce con 1 e lo dice.
2. **Visite**: dal repository, *Insights → Traffic*: visitatori unici dei 14 giorni e i primi tre *referring sites* (es. `reddit.com 40, dev.to 12, google 5`). L'API li dà solo con un token, per questo non sono nello script.
3. **Feedback**: issue, discussioni e commenti della settimana, raggruppati per tema con il numero di persone (es. `falsi positivi heading-levels ×2, chiede Next.js ×1`). Un tema conta le persone, non i messaggi.
4. **Note**: cosa è uscito quella settimana (post, video, versione), per leggere i numeri.

## Settimane

| Periodo npm | Versione | Download | Stelle | Fork | Issue aperte | Visite (Insights) | Feedback per tema | Note |
|---|---|---|---|---|---|---|---|---|
| 2026-10-16 – 2026-10-22 | 1.6.0 | 2 | 0 | 0 | 0 | | | Prima del lancio: 1.19.0 non ancora pubblicata (la 1.18.0 non si pubblica, F17) |

## Revisione settimanale

Dopo la riga, cinque domande; le risposte in due righe sotto la tabella delle priorità.

1. **Chi è arrivato e da dove?** Quale canale ha portato visite e quale niente: si insiste su un canale solo se porta anche feedback.
2. **Qualcuno l'ha installato e usato?** Segnali oltre i download: issue con una versione, domande di configurazione, stelle dopo un post, il template clonato.
3. **Dove si sono fermati?** Installazione, pannello che non compare, CI, risultati non chiari: ogni blocco è la prima priorità (ordine in [CONTRIBUTING.md](../../CONTRIBUTING.md#triage)).
4. **Quali risultati sono sbagliati o poco chiari?** Falsi positivi e messaggi che non si capiscono, con la regola.
5. **Cosa chiedono più persone?** Regole, integrazioni, framework: entra nel piano quando lo chiedono almeno due persone diverse.

### Prossime tre priorità

| Settimana | 1 | 2 | 3 |
|---|---|---|---|
| | | | |
