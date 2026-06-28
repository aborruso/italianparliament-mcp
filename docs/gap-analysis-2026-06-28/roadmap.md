# Roadmap prossimo sprint — convalida editoriale 2026-06-28

> **Stato aggiornato (28 giu):** fatti — votazioni Senato (`senato-votes`/`senato-vote-detail`, v0.2.0); fix `aic --keyword`; fix `amendments --ddl-uri`; `countOnly` su bills/aic/votes/senato-votes; `group-rank` (ranking gruppi); `committee-sessions` (US-28, sedute commissione↔DDL). Rinviato — assenteismo (`vote-detail` grezzo è fuorviante: governo in testa, nessun tipo "missione"). join persona cross-namespace (US-22/US-31) via `person-career` (hub persona Camera: mandati + governo + Wikidata; Camera↔Senato resta solo via nome+data nascita). Aperti — assenteismo (rinviato), e i gap-di-dato US-19/US-29. **Il "cuore" giornalistico è coperto.**


Giudizio del giornalista parlamentare sui gap ancora aperti, e priorità per il prossimo sprint. Distinzione chiave: **gap di dato** (assente sull'endpoint → non risolvibile lato MCP) vs **gap di tool/UX** (il dato c'è ma manca un tool/filtro → risolvibile).

## In cima: i due bug (un filtro che finge di funzionare è peggio di uno assente)

1. **`aic --keyword` ignorato silenziosamente — il più grave.** Fa pubblicare conteggi sbagliati credendoli mirati. Fix: filtrare davvero su `description`, oppure far **restituire errore** invece di accettare-e-ignorare. Sblocca US-17 (ALTA).
2. **`amendments` senza filtro per DDL.** Blocca US-16 ma non mente. Aggiungere il filtro (dopo aver verificato che la relazione emendamento↔DDL esista sull'endpoint).

## Gap aperti — peso editoriale

| US | Cosa serve | Tipo | Peso |
|----|------------|------|------|
| Votazioni Senato (A5/C1/D3) | Dettaglio voto per senatore, ribelli, compattezza | tool-mancante (dato c'è) | **Massimo** |
| US-17 | Interrogazioni per tema | tool-mancante (bug #1) | Alto |
| US-16 | Emendamenti per DDL (ostruzionismo) | tool-mancante (da verificare relazione) | Alto |
| US-28 | Sedute di commissione legate a un DDL | tool-mancante (da verificare costo) | Alto |
| US-25 | Assenteismo reale | tool-mancante (presenza/assenza in `vote-detail`) | Alto (caveat "missione") |
| US-24 | Ranking per gruppo | tool-mancante (GROUP BY sparql) | Medio-alto |
| US-22 / US-31 | Doppio incarico / carriera multi-leg | tool-mancante strutturale (no ID persona unificato) | Medio |
| US-32 | Confronto fra legislature | tool-mancante (`countOnly`) | Basso, costo quasi nullo |
| US-19 | Esito/risposta interrogazioni | **dato-mancante** | Non risolvibile lato MCP |
| US-29 | Audizioni di commissione | **dato-mancante** | Non risolvibile lato MCP |

## Roadmap prioritizzata (valore × sforzo)

| # | Intervento | US sbloccate | Tipo |
|---|------------|--------------|------|
| 1 | **Fix `aic --keyword`** (filtra su `description`, o errore) | US-17 | bug |
| 2 | **Tool votazioni Senato** (`senato-votes` + `senato-vote-detail`): i tool Camera sono un template che de-rischia il build | A5, C1, D3 + base US-25 Senato | tool-mancante |
| 3 | **Filtro DDL su `amendments`** (verificare relazione) | US-16 | bug |
| 4 | **Assenteismo da `vote-detail`** (aggrega presenza/assenza; Camera subito, Senato dopo #2) | US-25 | tool-mancante |
| 5 | **Ranking per gruppo** (rank-by di gruppo via GROUP BY) | US-24 | tool-mancante |
| 6 | **`countOnly`/`totalCount`** su bills/aic/votes | US-32 | tool-mancante (costo minimo) |
| 7 | **Sedute commissione legate a DDL** (Senato `osr:SedutaCommissione`) — sale in cima se il link è economico | US-28 | tool-mancante (da verificare) |
| 8 | **Join persona cross-namespace** (ID unificato deputato/senatore/governo) | US-22, US-31 | tool-mancante strutturale |
| — | US-19 esito interrogazioni; US-29 audizioni | — | dato-mancante, fuori sprint |

## Verdetto complessivo

- Copertura framework 33 US: **23 OK / 8 PARZIALE / 2 KO** (da 17/10/6 ad aprile).
- **Il gap più grave ora**: le votazioni del Senato esistono sull'endpoint ma non hanno un tool dedicato. Da sole, con i soli tool attuali, lasciano inaccessibile metà del Parlamento sul voto a chi non scrive SPARQL. È il titolo del prossimo sprint, a basso rischio avendo il template Camera.
- I due unici gap non risolvibili lato MCP (US-19, US-29) sono limiti della fonte, non debiti del progetto.
