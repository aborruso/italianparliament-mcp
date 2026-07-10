---
type: Gotcha
title: Freschezza del dato e cosa fa fede sull'approvazione
description: Il LOD non espone un segnale di aggiornamento affidabile; per l'esito (approvato/respinto/promulgato) la fonte di verità è il resoconto/scheda iter/GU, non il grafo.
tags: [camera, senato, freschezza, autorevolezza, approvazione]
timestamp: 2026-07-02
---

Il LOD di Camera e Senato è una rappresentazione **derivata e pubblicata a lotti** dell'attività parlamentare, non la fonte primaria. Per gli usi giornalistici questo ha due conseguenze da tenere sempre presenti: (1) il grafo può essere **indietro** rispetto alla realtà, e (2) non c'è un modo affidabile per sapere *a che data* è aggiornato.

# Perché a lotti: la provenienza del dato (conferma del gestore)

Il gestore del repository LOD della Camera ha confermato (scambio email, luglio 2026) l'architettura che spiega i comportamenti osservati sull'endpoint. Sono note di **provenienza**, non attribuite a persone: descrivono come è fatto il sistema.

- **L'ontologia OCD è datata.** La parte centrale del modello risale al **2009-2011**, con soli sviluppi parziali successivi (principalmente sulle **votazioni**). I dati riflettono quell'organizzazione: è la causa a monte per cui interi ambiti recenti risultano non modellati o modellati in modo grezzo.
- **Pubblicazione a valle di un processo distribuito.** Il repository/portale RDF è **l'ultimo anello** di una catena che parte dai **singoli produttori delle triple** (i gestori dei rispettivi database sorgente). Il sistema pubblica RDF **solo nel momento in cui riceve i dati** dai produttori. Non c'è quindi un ciclo di aggiornamento centralizzato e prevedibile: la freschezza dipende dal flusso a monte (e dalla disponibilità del personale interno).
- **Conseguenza sul segnale di freschezza.** Questo spiega perché `dcterms:modified` è congelato (vedi sotto): non esiste un timestamp di "ultimo caricamento reale" perché il caricamento è per-lotto e per-produttore, non un evento unico datato.

Questa spiegazione **converge** con due assenze verificate in modo indipendente sull'endpoint: gli [emendamenti Camera assenti dal LOD](camera/assenti.md) e le [audizioni non strutturate come entità](camera/audizioni.md). Osservazione empirica ("il dato non c'è / è solo testo libero") e provenienza dichiarata dal gestore ("ontologia ferma, ambiti non modellati") descrivono lo stesso fenomeno da due lati.

# Freschezza: nessun segnale affidabile

Verificato il 2026-07-02 sui due endpoint.

- **Camera**: ogni `void:Dataset` espone `dcterms:modified`, ma il valore è **congelato**. Tutti i dataset — compresi quelli "vivi" della legislatura 19 (`dataset/stato-iter-19`, `dataset/assemblea-19`) — riportano una data uniforme del **6–8 febbraio 2024**, pur contenendo dati fino a giugno/luglio 2026 (votazioni, stati d'iter, audizioni recentissime). Il campo **non riflette l'ultimo caricamento reale** e non è utilizzabile come "as-of".
- **Senato**: **nessun** metadato di freschezza sui dati. Non esistono `void:Dataset` con `dcterms:modified`; le uniche 926 triple `dcterms:modified` presenti sono file interni dell'installazione Virtuoso (`http://localhost:8890/DAV//VAD/…`, datati 2012), non metadati parlamentari.

**Conseguenza operativa.** Quando una votazione o uno stato d'iter molto recente **non compare** nel grafo, l'assenza è **ambigua**: può significare (a) dato non ancora caricato, (b) dato strutturalmente assente (vedi [assenti Camera](camera/assenti.md)), oppure (c) l'evento non è avvenuto. I tre casi sono indistinguibili dal solo LOD. Un "non trovato" **non equivale** a "non è successo".

# Cosa fa fede sull'approvazione

Il LOD non è la fonte di verità sull'**esito** di un provvedimento. Per stabilire se qualcosa è approvato o no, l'ordine di autorevolezza è:

1. **Passaggio d'aula in un ramo** (approvato/respinto da Camera *o* Senato): fa fede il **resoconto stenografico dell'Assemblea** della seduta, e in second'ordine la **scheda dell'iter** sul sito istituzionale (Camera: "Progetti di legge"; Senato: "scheda DDL"). Il LOD rispecchia questi (`ocd:rif_statoIter` / `osr:statoDdl`, `ocd:votazione` voto finale) **con ritardo**.
2. **Legge definitivamente approvata e promulgata**: fa fede la pubblicazione in **Gazzetta Ufficiale** (normattiva.it / gazzettaufficiale.it).

## Distinzione critica: "approvato da un ramo" ≠ "legge"

È l'errore classico. Un DDL **approvato solo alla Camera** (o solo al Senato) **non è ancora legge**: torna all'altro ramo e l'iter prosegue. Solo l'approvazione nel **medesimo testo da entrambi i rami**, seguita da promulgazione e pubblicazione in GU, produce una legge. Nel LOD:

- `osr:statoDdl` / `ocd:rif_statoIter` descrivono lo **stato nel ramo**, non lo stato complessivo del provvedimento tra i due rami.
- "Approvato" in un ramo va sempre qualificato ("approvato dalla Camera", "passato al Senato"), mai reso come "approvata la legge".

# Regola per il tool

Per fatti **time-sensitive sull'esito** (approvato / respinto / promulgato di eventi delle ultime ore o giorni), **non affidarsi al solo LOD**: incrociare con resoconto stenografico, scheda iter istituzionale o GU. Il LOD resta ottimo per **struttura, anagrafica e storico**; non è la fonte di verità istantanea sull'esito.

# Citations

[1] Camera — `dcterms:modified` congelato a feb 2024 su dataset vivi (2026-07-02):
```sparql
SELECT ?ds ?mod WHERE {
  ?ds <http://purl.org/dc/terms/modified> ?mod .
  FILTER(CONTAINS(STR(?ds), "dataset"))
} ORDER BY DESC(?mod)
```
Esito: date uniformi `2024-02-06/07/08` (es. `dataset/stato-iter-19` = `2024-02-07`), mentre i dati arrivano a metà 2026.

[2] Senato — nessun `void:Dataset` con `dcterms:modified`; le triple presenti sono interni Virtuoso (2012):
```sparql
SELECT ?s ?o WHERE { ?s <http://purl.org/dc/terms/modified> ?o } ORDER BY DESC(?o) LIMIT 12
```
Esito: soggetti `http://localhost:8890/DAV//VAD/fct/…`, non dati parlamentari.
