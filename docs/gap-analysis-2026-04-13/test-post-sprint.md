# Test User Stories — Post Sprint 1+2+3

Data: 2026-04-13 | 33 user stories testate con tool MCP reali (server locale aggiornato)

## Risultato complessivo

| Valutazione | Prima (pre-sprint) | Dopo (post-sprint) | Delta |
|---|---|---|---|
| **OK** | 13 (39%) | **17** (52%) | +4 |
| **PARZIALE** | 14 (42%) | **10** (30%) | -4 |
| **KO** | 6 (18%) | **6** (18%) | 0 |

## Miglioramenti confermati dai test

| US | Era | Ora | Cosa ha cambiato |
|---|---|---|---|
| US-01 | PARZIALE (no filtro data) | KO (filtro c'e ma dati laggati ~12gg) | M-04 funziona ma dati upstream in ritardo |
| US-03 | PARZIALE | **OK** | keyword su bill-progress trova DDL Senato |
| US-04 | PARZIALE (presentatore vuoto) | **OK** | M-05 fix presentatore: Sbrollini, Magni visibili |
| US-05 | PARZIALE (no commissioni) | **OK** | M-02 committee-members: Costa in 3 organi con ruoli |
| US-07 | PARZIALE (no filtro deputato) | **OK** | M-08 deputyUri: Costa Azione→FI in 1 chiamata |
| US-08 | PARZIALE (no filtro regione) | **OK** | M-07 region: Provenzano, Gallo, Pisano in Sicilia |
| US-13 | PARZIALE (no keyword) | **OK** | M-01 keyword: "salario minimo" trova 3 DDL con stato iter |
| US-15 | PARZIALE (initiative non filtrabile) | **OK** | M-10 initiative=Popolare: 10 DDL popolari leg19 |
| US-18 | PARZIALE (solo Camera) | **OK** | M-06 rank Senato: Camusso 786, Rojc 753 |
| US-25 | PARZIALE (no rank inverso) | **PARZIALE** | M-09 order=asc funziona, ma dati speeches sospetti |
| US-27 | KO (no composizione) | **OK** | M-02 committee-members Camera: ruoli PRESIDENTE, VICEPRESIDENTE, CAPOGRUPPO |
| US-33 | PARZIALE | **OK** | M-10 initiative=Governo + M-01 keyword=decreto: DL trovati |

## Dettaglio per user story

### OK (17)
| US | Tool | Note |
|---|---|---|
| US-02 | votes dateFrom | Votazioni 9 aprile, lag ~4gg. Titoli spesso vuoti |
| US-03 | bills + bill-progress | Camera dateFrom, Senato keyword. Entrambi funzionano |
| US-04 | sindacato-ispettivo | Presentatore ora popolato. Dati in tempo reale (oggi) |
| US-05 | search+deputy+group-members+committee-members | Profilo completo Costa: gruppo, commissioni, ruoli |
| US-06 | aic + rank | Testo completo in description, rank per conteggio |
| US-07 | group-members deputyUri | Costa: Azione→FI, 1 cambio |
| US-08 | deputies region | Sicilia: Provenzano, Gallo, Pisano |
| US-09 | votes confidenceVote + vote-detail | Fiducia trovata, voto individuale con gruppo |
| US-13 | bill-progress keyword | "salario minimo": 3 DDL con stato iter |
| US-15 | bills initiative=Popolare | 10 DDL popolari leg19 |
| US-18 | rank sindacato-ispettivo | Top senatori: Camusso 786 |
| US-20 | gov-members | Ministri e sottosegretari Meloni |
| US-21 | gov-members name | Fitto: carriera completa con date e motivo uscita |
| US-23 | rank bills-primo | Brambilla 216, Comaroli 176, Pittalis 160 |
| US-26 | vote-detail | Voto individuale per deputato con gruppo |
| US-27 | committee-members camera | Giustizia Camera: presidente, capogruppo, segretari |
| US-33 | bills initiative+keyword | Decreti legge governo Meloni trovati |

### PARZIALE (10)
| US | Tool | Limite |
|---|---|---|
| US-11 | votes confidenceVote + vote-detail | Titolo fiducia vuoto, no filtro per gruppo |
| US-14 | bill-progress + bill-signatories | "fine vita" non trovato; keyword-dipendente |
| US-16 | amendments | No filtro per DDL specifico |
| US-17 | aic | description c'e ma no keyword filter su aic |
| US-22 | deputies + gov-members | URI schema diverso, join manuale |
| US-24 | rank | Rank per senatore, non per gruppo |
| US-25 | rank speeches asc | Funziona ma dati speeches potenzialmente parziali |
| US-30 | bills keyword | "presidenzialismo" 0 risultati; serve keyword alternativo |
| US-31 | search + gov-members | Copertura legislature storiche incompleta |
| US-32 | bills multi-leg | No totalCount, conta manuale |

### KO (6)
| US | Motivo |
|---|---|
| US-01 | sessions filtro data funziona ma dati Camera laggati ~12 giorni |
| US-10 | Titoli votazioni Camera vuoti → keyword inutile |
| US-12 | Come US-10 |
| US-19 | Campo esito sempre vuoto, risposta governo non tracciabile |
| US-28 | Lavori commissione su DDL: tool non esiste |
| US-29 | Audizioni commissione: tool non esiste |

## Gap residui prioritari

1. **Titoli votazioni Camera vuoti** — keyword su votes non funziona (US-10, US-12). Limite dati upstream
2. **No keyword su aic** — il testo c'e in description ma non filtrabile (US-17)
3. **Campo esito vuoto** — sindacato-ispettivo e aic non tracciano risposte governo (US-19)
4. **Lavori/audizioni commissione** — non esposti in SPARQL (US-28, US-29)
5. **No filtro DDL su amendments** — impossibile contare emendamenti a un provvedimento (US-16)
6. **No aggregazione per gruppo** — rank per senatore singolo, non per gruppo parlamentare (US-24)

## Bug trovati durante i test

1. **group-members start_date** contiene inizio+fine concatenati ("20221018-20240916") — campo end_date vuoto. Bug parsing
2. **votes list** errore SPARQL intermittente durante test area3 (timeout?)
3. **US-01 sessions lag** — dati Camera aggiornati solo fino al 1 aprile (12 giorni di ritardo)
