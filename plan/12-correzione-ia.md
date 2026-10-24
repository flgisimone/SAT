# F12 — Correzione con l'IA

**Obiettivo**: dal pannello si passa un problema a un agente IA che lo corregge nel sorgente. Ovunque si copia un prompt pronto o lo si apre nell'editor; con il plugin Vite, «Fix with AI» lancia Claude Code nel progetto, la pagina si ricarica e SAT conferma che il problema è sparito.

> **Stato: da iniziare.**

---

## 1. Decisioni

- **Tre livelli**, dal più semplice al più potente:
  1. «Copy fix prompt»: ovunque (Vite, React, Vue, vanilla, estensione).
  2. Link che apre il prompt in Claude Code per VS Code o in Cursor, che l'utente rivede e invia: ovunque, solo se lo spike F12-03 regge.
  3. «Fix with AI»: solo con il plugin Vite, perché serve un processo Node nel progetto. Nei progetti senza Vite restano i livelli 1 e 2.
- **Agente: solo Claude Code** (`claude -p`), con strumenti limitati e avanzamento in streaming (`--output-format stream-json`). `ponytail:` niente comando configurabile per altri agenti finché qualcuno non lo chiede; allora si aggiunge `ai: { command }`.
- **Opt-in**: `sat({ ai: true })`. Spento di default, il pulsante «Fix with AI» non compare.
- **Dati della pagina**: SAT non invia nulla. Con la correzione attivata esplicitamente, l'agente dell'utente manda al modello il prompt, che contiene un estratto della pagina. Decisione del 24/10/2026 nel [README](README.md).
- **SAT non gestisce chiavi né costi**: usa l'installazione e l'account Claude Code dell'utente.
- **L'annullamento passa da git**: SAT avvisa se ci sono modifiche non salvate e mostra i file toccati, non tiene copie proprie.
- La pagina ospite non si tocca (CONVENTIONS §6.3).
- **Versione 1.17.0**.

## 2. Task

#### F12-01 · Prompt di correzione — S
**Dipendenze**: —
- `fixPrompt(issue | issues, context)` in `src/core/fixPrompt.ts`, puro ed esportato dall'API.
- Contenuto:
  - la regola (id e titolo), la gravità, il criterio WCAG o la fonte, il messaggio;
  - l'URL della pagina e il selettore;
  - l'`outerHTML` dell'elemento, tagliato a circa 2 KB;
  - il link alla documentazione della regola;
  - il componente sorgente quando c'è (F12-04).
- Istruzioni:
  - correggere nel sorgente e non nel DOM, con la modifica minima;
  - non toccare altro;
  - se il contenuto viene da dati o da un CMS, dirlo invece di modificare.
- L'estratto della pagina sta in un blocco delimitato, dichiarato come dato e non come istruzione.
- Più problemi della stessa regola vanno in un prompt unico.

**Criteri di accettazione**
- [ ] Test unitari: un problema, più problemi, elemento assente, HTML lungo tagliato, testo della pagina che contiene finte istruzioni (resta dentro il blocco dati).

#### F12-02 · «Copy fix prompt» nel pannello — S
**Dipendenze**: F12-01
- Pulsante con icona su ogni problema e «Copy prompt for all» su ogni regola, con `navigator.clipboard.writeText`.
- Conferma «Copied» annunciata con `aria-live`. Se gli appunti non sono disponibili (pagina non sicura, permesso negato), il prompt compare in una textarea selezionata.

**Criteri di accettazione**
- [ ] Test in Chromium: il testo copiato è uguale a `fixPrompt`; il pannello passa ancora SAT e axe-core (F11-06) in entrambi i temi.

#### F12-03 · Spike: link a Claude Code e Cursor — S
**Dipendenze**: F12-01
- Verificare `vscode://anthropic.claude-code/open?prompt=…` (dalla v2.1.72, non nella documentazione ufficiale) e il link di Cursor per il prompt, a mano su macOS e Windows:
  - la codifica, soprattutto `&`, a capo e caratteri non ASCII;
  - la lunghezza massima: Cursor arriva a 8.000 caratteri;
  - il comportamento se l'editor non è installato.
- Se reggono: un menu «Open in…» accanto a «Copy», con il prompt accorciato quando supera il limite. Se no, il task si chiude con le note e si scarta.

**Criteri di accettazione**
- [ ] Esito documentato nelle note della fase; se il link si tiene, c'è un test unitario sulla costruzione dell'URL.

#### F12-04 · Componente sorgente dove è gratis — S
**Dipendenze**: F12-01
- In dev:
  - Vue: file del componente da `__vueParentComponent.type.__file`;
  - Svelte: file e riga da `__svelte_meta.loc`;
  - React 19 non li espone, quindi l'agente cerca partendo dall'HTML.
- Solo lettura, niente trasformazioni del codice dell'app.

**Criteri di accettazione**
- [ ] Test con app Vue e Svelte di esempio in dev: il prompt contiene il file giusto; senza i metadati il campo manca.

#### F12-05 · Endpoint «Fix with AI» nel plugin Vite — M
**Dipendenze**: F12-01
- Opzione `ai: true` in `sat()` ([src/integrations/vite.ts](../src/integrations/vite.ts)).
- `configureServer` registra `POST /__sat/fix`, protetto così:
  - solo connessioni da loopback;
  - `Origin` uguale a quello del dev server;
  - un token casuale per ogni avvio, inserito nel modulo virtuale.
- L'endpoint lancia `claude -p` nella root del progetto:
  - con `--allowedTools "Read,Edit,Grep,Glob"`, senza Bash;
  - con `--output-format stream-json`;
  - il prompt passa da stdin.
- Una correzione alla volta; le richieste in coda vengono rifiutate con un messaggio.
- L'avanzamento torna al pannello in streaming. Errori chiari se `claude` non è installato o l'accesso non è fatto.
- Avviso se il repository ha modifiche non salvate.

**Criteri di accettazione**
- [ ] Test con un `claude` finto nel `PATH`:
  - senza token, con un `Origin` diverso o con `ai` spento la richiesta viene rifiutata;
  - gli argomenti passati al processo sono quelli previsti;
  - lo streaming arriva al client.
- [ ] `vite build` non contiene né l'endpoint né il token.

#### F12-06 · «Fix with AI» nel pannello — M
**Dipendenze**: F12-02, F12-05
- Pulsante su ogni problema e su ogni regola, solo con `ai: true`.
- Durante la correzione: stato «Fixing…» annunciato con `aria-live`, ultimi messaggi dell'agente, pulsante per annullare (termina il processo).
- Alla fine:
  - l'elenco dei file modificati;
  - una nuova analisi dopo l'HMR;
  - «Fixed» se il problema (stessa regola e stesso selettore) non c'è più, altrimenti «Still present» con il riepilogo dell'agente.

**Criteri di accettazione**
- [ ] Test e2e con il `claude` finto che modifica un file della fixture: la pagina si ricarica, il problema sparisce e il pannello mostra «Fixed».
- [ ] Il pannello passa ancora SAT e axe-core in entrambi i temi.

#### F12-07 · Documentazione e rilascio — S
**Dipendenze**: F12-01 … F12-06
- Sezione del README sulla correzione con l'IA:
  - i tre livelli;
  - i requisiti: Claude Code installato e accesso fatto;
  - cosa viene mandato al modello, la sicurezza dell'endpoint e il consiglio di usare git.
- Decisione sui dati aggiornata, `CHANGELOG.md`, versione 1.17.0.

**Criteri di accettazione**
- [ ] `npm run verify` e `npm run verify:e2e` passano.
