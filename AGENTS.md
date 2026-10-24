# Regole per gli agenti

Prima di implementare leggi le sezioni pertinenti di [CONVENTIONS.md](CONVENTIONS.md): queste regole lo completano, non lo sostituiscono (CONVENTIONS §13). Il backlog e lo stato delle fasi sono in [plan/README.md](plan/README.md).

## Esplorare il codice: tokensave

Il progetto è indicizzato con tokensave (cartella `.tokensave/`, ignorata da git). Per esplorare il codice usa i tool `tokensave_*` prima di Grep e Read:

- `tokensave_context` per un concetto o un compito, in linguaggio naturale;
- `tokensave_search` per un simbolo per nome, con `literal: true` per il testo esatto;
- `tokensave_callers`, `tokensave_callees` e `tokensave_impact` per chi usa cosa.

Se il server MCP non serve questo progetto, passa come `graph_root` il percorso del repository sulla tua postazione o usa la CLI dalla root (`tokensave tool search <query>`). In un worktree nuovo lancia dalla sua root `tokensave init` e `tokensave branch add <branch>`.

Se tokensave non è installato sulla postazione, esplora il codice con la ricerca e la lettura dei file.

## Scrivere codice: Ponytail

Prima di scrivere codice, fermati al primo gradino che regge:

1. Serve davvero? Se il bisogno è ipotetico, non si fa.
2. C'è già nel progetto? Riusa helper, tipi e pattern esistenti (`src/sat/satDom.ts` per i controlli).
3. Lo fa la libreria standard?
4. Lo fa la piattaforma (HTML, CSS, il browser)?
5. Lo fa una dipendenza già installata? Niente dipendenze nuove per poche righe.
6. Basta una riga?
7. Solo allora: il codice minimo che funziona.

Un bug si corregge alla causa, nel punto per cui passano tutti i chiamanti. Niente astrazioni non richieste, niente codice «per dopo». Le semplificazioni volute si segnano con un commento `ponytail:` che dice il limite e quando superarlo.

## Controlli: meglio un problema mancato che un falso positivo

Un controllo segue la specifica (WCAG, WAI-ARIA, HTML) e non segnala i pattern validi. La pagina ospite non si tocca: le regole riportano soltanto, i riquadri li disegna il pannello sul proprio strato (CONVENTIONS §6.3).

## Efficienza

Il costo di una sessione cresce con le chiamate e con la dimensione del contesto: ogni chiamata lo rilegge tutto.

- Una sessione per fase: dopo merge e push se ne apre una nuova (`/clear`). Lo stato è nel piano, in git e nella memoria.
- Dentro la fase, `/compact` quando `/context` supera circa 200.000 token.
- Durante lo sviluppo test mirati (`npx vitest run <file>`, `npx playwright test <spec>`); la verifica completa con `npm run verify`, in un comando solo.
- Letture indipendenti nella stessa chiamata; righe mirate invece di file interi; non rileggere un file già nel contesto.
- `CONVENTIONS.md` per le sezioni pertinenti al compito, non intero.
- `npm run usage` misura i consumi delle sessioni del progetto dai log locali.

## Verifica, fasi e rilascio

- `npm run verify` (typecheck, lint, test unitari, build) deve passare prima di ogni commit; `npm run verify:e2e` (build e test in Chromium) prima del merge di una fase. Stampano solo errori e riepiloghi.
- Ogni fase si lavora sul branch `fase/f<n>-<slug>`; a fine fase merge `--no-ff` su `develop` («Merge fase/… in develop») e push di `develop` e del branch di fase. Lo stato della fase si aggiorna nel suo file di `plan/`.
- La pubblicazione su npm la fa il maintainer, non un agente.
