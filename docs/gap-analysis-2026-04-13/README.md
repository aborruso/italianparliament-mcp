# Gap Analysis: giornalista parlamentare vs MCP

> **Archiviata.** Analisi storica; la roadmap proposta qui è stata implementata. Ripartenza aggiornata: [gap-analysis-2026-06-28](../gap-analysis-2026-06-28/README.md).

**Data:** 2026-04-13

## Cosa contiene questa cartella

Un'analisi strutturata per capire se l'MCP italianparliament-mcp risponde alle esigenze reali di un giornalista parlamentare.

Il metodo: due agenti — un **giornalista parlamentare** esperto e un **developer** — dialogano. Il giornalista definisce le sue esigenze concrete (user stories). Il developer le testa una per una con chiamate reali ai tool MCP. Alla fine, un'analisi gap, una proposta di miglioramenti prioritizzati, e un re-test dopo l'implementazione.

## I documenti

### Fase 1 — Analisi (pre-sprint)

| File | Contenuto |
|---|---|
| [giornalista-user-stories.md](giornalista-user-stories.md) | 33 user stories raggruppate in 9 aree tematiche, con priorita e domande concrete |
| [developer-test-report.md](developer-test-report.md) | Test reale di ogni user story (pre-sprint): tool usato, risultato ottenuto, valutazione |
| [analisi-gap.md](analisi-gap.md) | Matrice user stories vs capacita MCP, 7 gap strutturali identificati |
| [proposta-miglioramenti.md](proposta-miglioramenti.md) | 14 miglioramenti prioritizzati per impatto, organizzati in 3 sprint |

### Fase 2 — Verifica (post-sprint)

| File | Contenuto |
|---|---|
| [test-post-sprint.md](test-post-sprint.md) | Re-test completo delle 33 user stories dopo l'implementazione dei 3 sprint |

## Risultato

### Prima degli sprint (24 tool)

- **13 OK** (39%) — **14 PARZIALI** (42%) — **6 KO** (18%)

### Dopo gli sprint (25 tool, 11 miglioramenti)

- **17 OK** (52%) — **10 PARZIALI** (30%) — **6 KO** (18%)

4 user stories passate da PARZIALE a OK. I 6 KO sono tutti limiti alla fonte (endpoint SPARQL Camera/Senato).

## I 6 KO: cosa non si puo fare

1. **Sedute di oggi** — i dati Camera arrivano con ~12 giorni di ritardo
2. **Cercare votazioni per argomento** — la Camera non scrive il titolo/oggetto nelle votazioni
3. **Confrontare votazioni tra legislature per tema** — stessa causa del punto 2
4. **Sapere se il governo ha risposto a un'interrogazione** — il campo esito esiste ma e sempre vuoto
5. **Seguire l'iter di un DDL in commissione** — lavori delle commissioni non esposti via SPARQL
6. **Sapere chi e stato audito in commissione** — audizioni non nei dati aperti

I primi 4 si risolverebbero se Camera e Senato aggiornassero i loro endpoint. Gli ultimi 2 richiederebbero che pubblicassero dati oggi non pubblicati.

## Sprint implementati

### Sprint 1 — quick wins (commit 316e3f1)
- Ricerca per parola chiave (keyword) su DDL Camera, DDL Senato, votazioni
- Filtro voti di fiducia (confidenceVote)
- Filtro data su sedute
- Storia cambi gruppo per singolo deputato
- Classifica inversa (i meno attivi)
- Filtro per iniziativa (Popolare, Governo, Parlamentare, Regioni)

### Sprint 2 — massimo impatto (commit 6623dbd, f30dca8)
- Fix presentatore atti sindacato ispettivo Senato
- Composizione commissioni Camera + Senato con ruoli

### Sprint 3 — completezza (commit c9b0de4, 3061243, 273e9b6)
- Classifica Senato (sindacato ispettivo + DDL)
- Testo completo interrogazioni Camera (campo description)
- Filtro regione/circoscrizione su deputati

### Bug fix (commit 0f0ab28)
- Date inizio/fine nei cambi gruppo ora separate correttamente
