---
type: Schema Absence
title: Assenti verificati — Camera (OCD)
description: Dati che NON esistono nel LOD OCD della Camera, verificati sull'endpoint.
tags: [camera, ocd, assenti]
timestamp: 2026-07-01
---

Questa pagina elenca ciò che **non esiste** nel LOD OCD della Camera, verificato sull'endpoint. Serve a impedire relazioni plausibili ma inesistenti: se un dato è qui, non va cercato via SPARQL.

# Emendamenti

Gli **emendamenti della Camera non sono modellati nel LOD OCD**. Verificato il 2026-07-01 su `https://dati.camera.it/sparql` (**37.317** `ocd:votazione` in leg. 19).

- Nessuna classe emendamento **riscontrata tra i tipi OCD istanziati** (`SELECT DISTINCT ?class` sui tipi `http://dati.camera.it/ocd/*`); classi atto-correlate presenti: `ocd:atto`, `ocd:versioneTestoAtto`, `ocd:statoIter`, `ocd:votazione`, `ocd:discussione` — nessuna per l'emendamento. Il precedente numero "47 tipi RDF instanziati" è stato rimosso perché non più verificato con affidabilità sul dataset corrente.
- `ocd:natura` degli atti ha **solo 3 valori**: *Disegno di legge ordinario*, *Proposta di legge costituzionale*, *Proposta di legge ordinaria*. L'emendamento non è una natura di atto.
- Gli emendamenti compaiono **solo come testo libero** nel `dc:description` delle `ocd:votazione`, e **solo quando votati** (recuperabili con `votes list --bill-code`). Non esiste l'entità "emendamento depositato".

**Conseguenza operativa**: il tool `amendments` (oggi `osr:Emendamento`, solo Senato) non è estendibile alla Camera via SPARQL — non c'è dato da interrogare. Vedi issue #19. Per gli emendamenti *votati* si può risalire dal testo delle votazioni collegate all'atto.

Nota Senato: l'emendamento esiste come `osr:Emendamento`, ma il dataset appare non popolato per i DDL 2026 (solo inizio legislatura). Da tracciare a parte.

# Citations

[1] Enumerazione dei tipi OCD (2026-07-01), usata come controprova dell'assenza di `ocd:emendamento`:
```sparql
SELECT DISTINCT ?class WHERE {
  ?s a ?class .
  FILTER(STRSTARTS(STR(?class), "http://dati.camera.it/ocd/"))
}
```
Verifica diretta minima:
```sparql
PREFIX ocd: <http://dati.camera.it/ocd/>
SELECT ?s WHERE { ?s a ocd:emendamento . } LIMIT 1
```
[2] Valori di `ocd:natura` degli atti (2026-07-01):
```sparql
SELECT DISTINCT ?l WHERE {
  ?n a <http://dati.camera.it/ocd/natura> .
  ?n <http://www.w3.org/2000/01/rdf-schema#label> ?l
}
```
[3] Esempio di emendamento presente solo come testo libero in votazione (2026-07-01):
```sparql
PREFIX ocd: <http://dati.camera.it/ocd/>
PREFIX dc: <http://purl.org/dc/elements/1.1/>
SELECT ?v ?d WHERE {
  ?v a ocd:votazione ; dc:description ?d .
  FILTER(CONTAINS(LCASE(?d), "emendamento"))
}
LIMIT 3
```
[4] Issue: https://github.com/aborruso/italianparliament-mcp/issues/19
