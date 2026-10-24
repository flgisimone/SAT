# F6 — Ecosistema (facoltativa)

**Obiettivo**: rendere SAT più facile da adottare: installazione senza toccare il codice dell'app, altre integrazioni, documentazione pubblica.

> **Stato: facoltativa, da valutare dopo F3 e F5.**

---

## 1. Task

#### F6-01 · Plugin Vite — M
**Dipendenze**: F3
- `seo-accessibility-tool/vite`: inietta SAT solo in `vite dev`, opzioni dal config.

**Criteri di accettazione**
- [ ] In un progetto Vite basta aggiungere il plugin; la build di produzione non contiene SAT.

#### F6-02 · Integrazioni Svelte e Angular — M
**Dipendenze**: F2-06
- Wrapper sottili come React e Vue (CONVENTIONS §5.1).

**Criteri di accettazione**
- [ ] Un'app di esempio per ciascuna avvia SAT con una riga.

#### F6-03 · Sito di documentazione — M
**Dipendenze**: F4-06
- Pagine delle regole, guida di avvio, migrazione 1.x → 2.0 se serve.

**Criteri di accettazione**
- [ ] Il link `help` di ogni problema apre la pagina della regola.

#### F6-04 · Estensione per il browser — L
**Dipendenze**: F3
- SAT su qualsiasi pagina, senza installarlo nel progetto.

**Criteri di accettazione**
- [ ] Funziona su un sito pubblico senza modificarlo.
