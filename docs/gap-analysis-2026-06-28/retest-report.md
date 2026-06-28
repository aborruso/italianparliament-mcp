# Re-test gap residui — 2026-06-28

Verdetti da chiamate reali `node dist/cli.js` contro gli endpoint SPARQL live (31 tool).

## 16 gap residui di aprile (erano 6 KO + 10 PARZIALE)

| US | Tool / comando | Verdetto | Evidenza | Gap residuo |
|----|----------------|----------|----------|-------------|
| US-01 sedute recenti | `sessions list --date-from/--date-to` | OK | 25 sedute, ultima 17 giu 2026 (lag ~11gg fisiologico) | — |
| US-10 votazioni su DDL | `votes list --bill-code 2807` | OK | 46 votazioni; `description`="Votazione Fiducia A.C. 2807-A" | `title` vuoto, usare `description` |
| US-11 fiducia per gruppo | `votes --confidence-vote true` + `vote-detail --group-acronym FDI` | OK | 70 voti fiducia; 117 righe FDI su un voto | — |
| US-12 confronto votazioni per testo | `votes --bill-code` + `description` | OK | filtro per atto + descrizione reale | `title` vuoto |
| US-14 cofirmatari Camera | `bill show` campo `cosignatories` | OK | ac19_2985 → "STEFANAZZI \| FOSSI"; Senato `is_primary` | vuoto sui decreti governo (corretto) |
| US-30 precedenti per tema | `bills list --keyword` | OK | "autonomia" → 18/18 risultati pertinenti | — |
| US-16 emendamenti a un DDL | `amendments list` | PARZIALE | solo `--legislature`, nessun filtro per atto | serve filtro DDL / sparql |
| US-17 interrogazioni per tema | `aic list --keyword` | PARZIALE | **`--keyword` accettato ma IGNORATO**; testo in `description` | filtro keyword non funzionante (bug) |
| US-22 doppio incarico | `deputies` + `gov-members` | PARZIALE | entrambi accessibili | join persona manuale, nessun ID condiviso |
| US-24 ranking per gruppo | `rank list` | PARZIALE | enum `--rank-by` solo individuale | serve GROUP BY sparql |
| US-25 assenteismo | `rank --order asc` | PARZIALE | funziona ma è proxy di attività | non sono presenze/assenze reali |
| US-28 lavori commissione su DDL | `bill-progress`, `committee-members` | PARZIALE | fase "esame in comm." + membri | no sedute/lavori legati al singolo DDL |
| US-31 carriera multi-legislatura | `search find --name` | PARZIALE | ID persona stabile per camera (d302103_15/_16/_17) | nessun ID unificato cross-camera |
| US-32 confronto fra legislature | `bills list` multi-leg | PARZIALE | leg18/leg19 accessibili | nessun `totalCount`, conteggio manuale |
| US-19 esito interrogazioni | `sindacato-ispettivo`, `aic` | KO | campo `esito` sempre vuoto | dato assente nell'endpoint |
| US-29 audizioni commissione | sparql Camera | KO | nessuna classe audizioni | dato assente |

**Conteggio 16 residui: OK 6 · PARZIALE 8 · KO 2.**

## Scoperta chiave: votazioni Senato

Esiste la classe **`osr:Votazione`** sull'endpoint Senato: **~63.911 votazioni**, dati correnti leg19 (ultima `dataSeduta` 24 giu 2026). Dettaglio per singolo senatore via `osr:favorevole` / `osr:contrario` / `osr:astenuto` (→ URI `senatore/N`), più aggregati `favorevoli`/`contrari`/`presenti`/`votanti`/`maggioranza`.

Nessun tool dedicato lo espone: oggi solo via `sparql query` sull'endpoint Senato. Questo sblocca — ma solo via SPARQL — A5 (voti ribelli Senato), C1 (dettaglio votazione Senato), D3 (compattezza gruppo Senato).

## User story openparlamento non-✅

- **A5** voti ribelli Senato: sbloccabile via sparql (era ❌)
- **C1** dettaglio votazione Senato: sbloccabile via sparql (era ❌); `vote-detail` resta solo Camera
- **C3** filtri votanti per genere/regione/maggioranza: PARZIALE — `gender` presente su deputies e senators, join manuale
- **D2** % donne / forza gruppo: derivabile (gender + group-members)
- **D3** compattezza gruppo: Camera OK; Senato ora derivabile via sparql
- **B2** relatori/cofirmatari Senato: cofirmatari OK (`bill-signatories`); relatori Senato non coperti (`bill-rapporteurs` solo Camera) → PARZIALE
- **B3** sede commissione (referente/consultiva/redigente/deliberante): KO via tool
- **F3** eventi prioritari/atti chiave: KO/fuori-scope (editoriale)
- **G1** più assenti: PARZIALE (`rank --order asc` come proxy)

## Bug / falsi positivi

1. **`aic --keyword` accettato ma silenziosamente ignorato**: il giornalista crede di filtrare per tema e riceve l'elenco intero. Falso positivo pericoloso (numeri sbagliati pubblicabili). Il testo è in `description`: il filtro è implementabile.
2. **`amendments` senza alcun filtro per DDL**: impossibile contare gli emendamenti a un provvedimento.
