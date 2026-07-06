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

# Il dato manca dal LOD, ma esiste fuori: le liste JSON dei sommari (`listasommcomm`)

Lo SPARQL espone **solo** data/tipo/commissione/legislatura (nessun titolo, ordine del giorno o link al resoconto) — **confermato dal Webmaster del Senato via email il 2026-07-06** in risposta a una richiesta di arricchimento. Nella stessa risposta il Webmaster ha però indicato una fonte **non documentata** che colma il buco: le liste JSON statiche dei sommari di commissione usate dal sito.

## URL

```
https://www.senato.it/static/bgt/listasommcomm/<TIPO_COD_COMM>/<COD_COMM>/t/<NUM_LEG>/<ANNO>/index.json
```

Esempio (1ª Affari Costituzionali, leg. 19, 2026): `https://www.senato.it/static/bgt/listasommcomm/0/1/t/19/2026/index.json`

| Segmento | Significato | Fonte |
|----------|-------------|-------|
| `<TIPO_COD_COMM>` | tipo codice commissione (es. `0`) | dai record JSON (`tipo_cod_comm`) o dallo SPARQL per commissione |
| `<COD_COMM>` | codice commissione (es. `1`) | idem (`cod_comm`) |
| `<NUM_LEG>` | legislatura (es. `19`) | — |
| `<ANNO>` | anno (es. `2026`) | — |

> ⚠️ **Dietro AWS WAF**: `curl` riceve **HTTP 202 a corpo vuoto** (challenge anti-bot). Recuperabile solo via browser reale (agent-browser) → vedi [[trappole]] / pattern WAF. Il Webmaster raccomanda di **non fare richieste troppo ravvicinate**, pena blocco temporaneo dei sistemi di sicurezza (limite numerico esatto richiesto via email, in attesa di riscontro).

## Schema

```
{ "organo": { numeraz_comm_perm, dizione_breve_comm, diz_combinata_breve_comm, progr, layout },
  "elenco": [ { "mese": "...", "sottoelenco": [ { …seduta… } ] } ] }
```

`elenco` è raggruppato per mese; ogni seduta (`sottoelenco[]`) espone:

| Campo | Note |
|-------|------|
| `id_testo` | **chiave del resoconto/sommario** → costruisce l'URL del testo (sotto) |
| `num_sed_comm` | numero progressivo della seduta di commissione |
| `data_seduta` / `sdata` | `GG-MM-AAAA` / stringa estesa |
| `ora_inizio` / `ora_fine` | orari (assenti dal LOD) |
| `tipo_seduta` | `A` antimeridiana / `P` pomeridiana |
| `descr_tipo_veste` | **veste della seduta**: Commissione Plenaria, Ufficio di Presidenza…, Comitato Ristretto, Sottocommissione per i pareri |
| `diz_raggr` | sedute congiunte (es. "1ª (Aff. costituzionali) e 2ª (Giustizia)") |
| `tipo_cod_comm` / `cod_comm` | codici da riusare nell'URL |

Verificato 2026-07-06: 141 sedute su 7 mesi per la 1ª Commissione, leg. 19, 2026.

## Link al resoconto (sommario dei lavori) da `id_testo`

```
https://www.senato.it/show-doc?leg=<NUM_LEG>&tipodoc=SommComm&id=<id_testo>&idoggetto=0
```

Es. `id_testo=1512635` → `https://www.senato.it/show-doc?leg=19&tipodoc=SommComm&id=1512635&idoggetto=0`. È l'equivalente Senato del bollettino Camera (`ocd:rif_bollettino`), che qui non passa dal LOD.

**Restano assenti ovunque** (né SPARQL né JSON): senatori presenti a ciascuna seduta e persone/enti auditi (richiesti nella stessa email).

# Assenti

* **Commissioni bicamerali con sedute/interventi esposti**: la *Commissione parlamentare di inchiesta sul femminicidio* esiste come entità Senato (`commissione/0-141` storica leg. XVII–XVIII e `commissione/4-223` attuale XIX) con i suoi membri senatori (**24 afferenze** nella XIX), ma **non ha `SedutaCommissione`/`Intervento` collegati** nel LOD Senato (verificato 2026-07-01: 0 righe su entrambi gli URI per leg. 19). Le sedute/interventi sono pubblicati solo dalla Camera (`ocd:organo` `o19_3941`, 181 URI seduta / 157 date distinte fino a giu 2026). Vedi [[../camera/sedute-commissione]]. La composizione Senatori si ottiene con `committee-members list --committee-uri <commissione/4-223> --chamber senato`.

# Citations

[1] Enumerazione proprietà `SedutaCommissione` (2026-07-01): `SELECT DISTINCT ?p WHERE { ?s a osr:SedutaCommissione . ?s ?p ?o }` → `osr:dataSeduta`, `osr:tipoSeduta`, `osr:commissione`, `osr:legislatura`.
[2] Verifica raddoppio etichetta `commissione/0-2` (2026-07-01): due `osr:titoloBreve` → soluzione `GROUP BY ?seduta ?date ?tipo` + `MIN(?tb)`.
[3] Verifica assenza attività femminicidio Senato (2026-07-01): `committee-sessions`/SPARQL su `commissione/0-141` e `4-223` → 0 sedute, 0 interventi.
[4] Risposta Webmaster Senato (email 2026-07-06): conferma che lo SPARQL non espone resoconto/OdG per `SedutaCommissione`; indica le liste JSON `listasommcomm` come fonte con link ai resoconti.
[5] Schema JSON verificato via agent-browser (2026-07-06): `https://www.senato.it/static/bgt/listasommcomm/0/1/t/19/2026/index.json`; `curl` → HTTP 202 vuoto (WAF). Pattern link resoconto ricavato dai `href` della pagina resoconti: `show-doc?leg=19&tipodoc=SommComm&id=<id_testo>&idoggetto=0`.
