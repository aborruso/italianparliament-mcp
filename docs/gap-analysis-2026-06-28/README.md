# Gap analysis (ripartenza) — 2026-06-28

Ripartenza dalla [gap analysis del 2026-04-13](../gap-analysis-2026-04-13/README.md). Stesso metodo a due agenti — un **giornalista parlamentare** definisce le esigenze, un **developer** le testa con chiamate reali ai tool — ma in forma **mirata**: si ri-testano solo i 16 gap residui (i 6 KO + 10 PARZIALE di aprile) più le user story di [openparlamento](https://parlamento19.openpolis.it/) ancora scoperte, contro i 31 tool attuali.

## Documenti

| File | Contenuto |
|---|---|
| [retest-report.md](retest-report.md) | Re-test dei 16 residui + openparlamento, con tool/comando, verdetto ed evidenza reale |
| [roadmap.md](roadmap.md) | Convalida editoriale dei gap aperti e roadmap prioritizzata del prossimo sprint |

## Risultato in una riga

Copertura sulle 33 user story del framework: da **17 OK / 10 PARZIALE / 6 KO** (apr) a **23 OK / 8 PARZIALE / 2 KO** (giu).

I tool aggiunti dopo aprile (`bill-text`, cofirmatari in `bill`, filtri `vote-detail` per gruppo, `votes --bill-code/--confidence-vote`, `bills --keyword`, `rank --order asc`, `committee-members`) chiudono il cuore del lavoro parlamentare quotidiano.

## Il gap n.1 ora

**Le votazioni del Senato esistono sull'endpoint** (classe `osr:Votazione`, ~63.911 votazioni, dati correnti leg19, con dettaglio per singolo senatore) **ma nessun tool dedicato le espone**: oggi sono raggiungibili solo via il tool generico `sparql`. Per un giornalista che non scrive SPARQL metà del Parlamento resta inaccessibile sul voto — il cuore del giornalismo di accountability. È il titolo del prossimo sprint, a basso rischio perché i tool Camera `votes`/`vote-detail` sono un template funzionante.

I soli due gap **non risolvibili lato MCP** (dato assente sull'endpoint) sono US-19 (esito/risposta interrogazioni) e US-29 (audizioni di commissione): vanno comunicati come limiti della fonte.
