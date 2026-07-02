---
type: Entity Map
title: Sedute e attività delle commissioni — Senato (OSR)
description: Schema per interrogare le sedute di commissione Senato per commissione e per data (non solo per DDL).
resource: http://dati.senato.it/osr/SedutaCommissione
tags: [senato, osr, commissione, seduta, attività]
timestamp: 2026-07-01
---

Le sedute di commissione del Senato sono modellate come `osr:SedutaCommissione` e sono interrogabili **per commissione** e **per intervallo di date**, non solo a partire da un DDL (che è l'unico modo offerto dal tool `committee-sessions` con `--ddl-uri`).

# Entità e proprietà

## osr:SedutaCommissione

| Proprietà | Tipo | Note |
|-----------|------|------|
| `osr:dataSeduta` | `xsd:date` | data della seduta; `FILTER` con `"AAAA-MM-GG"^^xsd:date` |
| `osr:tipoSeduta` | stringa | `antimeridiana` / `pomeridiana` |
| `osr:commissione` | URI → `osr:Commissione` | commissione presso cui si tiene la seduta |
| `osr:legislatura` | integer | es. `19` (nudo, non stringa) |

## osr:Commissione

| Proprietà | Tipo | Note |
|-----------|------|------|
| `osr:titolo` | stringa | denominazione estesa |
| `osr:titoloBreve` | stringa | denominazione breve (es. "Giustizia") |
| `osr:sottotitolo` | stringa | es. "(Art. 24 del Regolamento)" |

> ⚠️ **Niente `rdfs:label`**: `Commissione` non ha `rdfs:label`. Usare `osr:titolo`/`osr:titoloBreve`. (Verificato 2026-07-01.)

## osr:Intervento

Collegato alla seduta via `osr:seduta`. Per contare gli interventi di una seduta: `?int a osr:Intervento ; osr:seduta ?seduta`.

# Query Template — sedute di una commissione per data

```sparql
PREFIX osr: <http://dati.senato.it/osr/>
SELECT ?seduta ?date ?tipo (MIN(?tb) AS ?commName)
       (COUNT(DISTINCT ?int) AS ?interventi)
WHERE {
  ?seduta a osr:SedutaCommissione ;
          osr:commissione <COMMISSIONE_URI> ;
          osr:dataSeduta ?date .
  OPTIONAL { ?seduta osr:tipoSeduta ?tipo }
  OPTIONAL { <COMMISSIONE_URI> osr:titoloBreve ?tb }
  OPTIONAL { ?int a osr:Intervento ; osr:seduta ?seduta . }
}
GROUP BY ?seduta ?date ?tipo
ORDER BY DESC(?date)
```

Filtri opzionali (intervallo date):

```sparql
FILTER( ?date >= "2026-05-01"^^xsd:date && ?date <= "2026-05-31"^^xsd:date )
```

# Trappole

| Trappola | Dettaglio |
|----------|-----------|
| **Nome proprietà `dataSeduta`, non `data`** | `osr:data` non esiste; usare `osr:dataSeduta`. |
| **`osr:dataSeduta` è `xsd:date` tipizzato** | `FILTER` con `"AAAA-MM-GG"^^xsd:date`. |
| **Doppia etichetta della commissione** | Una `Commissione` può avere **più `osr:titoloBreve`** (es. `commissione/0-2` → "Giustizia" **e** "Giustizia e autorizzazioni a procedere"). Non mettere `?comm`/`?tb` nel `SELECT` senza aggregazione, altrimenti ogni seduta si duplica. Usare `MIN(?tb)` + `GROUP BY` senza `?comm`. |
| **`SAMPLE` non supportato** | Virtuoso Senato rifiuta `SAMPLE` (400). `MIN`/`MAX`/`COUNT` funzionano. |
| **Niente `BIND`** | Come da [[trappole]] generali del Senato. |

# Ricerca commissione per nome

`osr:Commissione` non ha `rdfs:label`; cercare su `osr:titoloBreve`:

```sparql
SELECT ?committee_uri ?titoloBreve WHERE {
  ?committee_uri a osr:Commissione ; osr:titoloBreve ?titoloBreve .
  FILTER( CONTAINS(LCASE(?titoloBreve), LCASE("giustizia")) )
}
```

# Assenti

* **Commissioni bicamerali con sedute/interventi esposti**: la *Commissione parlamentare di inchiesta sul femminicidio* esiste come entità Senato (`commissione/0-141` storica leg. XVII–XVIII e `commissione/4-223` attuale XIX) con i suoi membri senatori (**24 afferenze** nella XIX), ma **non ha `SedutaCommissione`/`Intervento` collegati** nel LOD Senato (verificato 2026-07-01: 0 righe su entrambi gli URI per leg. 19). Le sedute/interventi sono pubblicati solo dalla Camera (`ocd:organo` `o19_3941`, 181 URI seduta / 157 date distinte fino a giu 2026). Vedi [[../camera/sedute-commissione]]. La composizione Senatori si ottiene con `committee-members list --committee-uri <commissione/4-223> --chamber senato`.

# Citations

[1] Enumerazione proprietà `SedutaCommissione` (2026-07-01): `SELECT DISTINCT ?p WHERE { ?s a osr:SedutaCommissione . ?s ?p ?o }` → `osr:dataSeduta`, `osr:tipoSeduta`, `osr:commissione`, `osr:legislatura`.
[2] Verifica raddoppio etichetta `commissione/0-2` (2026-07-01): due `osr:titoloBreve` → soluzione `GROUP BY ?seduta ?date ?tipo` + `MIN(?tb)`.
[3] Verifica assenza attività femminicidio Senato (2026-07-01): `committee-sessions`/SPARQL su `commissione/0-141` e `4-223` → 0 sedute, 0 interventi.
