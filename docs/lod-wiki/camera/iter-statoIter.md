---
type: Reference
title: Iter di un atto Camera — timeline degli stati (ocd:rif_statoIter)
description: La cronologia dell'iter di un atto Camera è una timeline di stati collegati con ocd:rif_statoIter (uno per fase, con dc:date e dc:title). Copertura verificata alla pari tra legislature (18 e 19). Il ramo Senato dello stesso tool restituisce per design solo lo stato corrente, non una timeline — asimmetria di ramo, non di legislatura.
resource: https://dati.camera.it/sparql
tags: [camera, ocd, iter, statoIter, fasi, timeline, bill-progress, legislatura]
timestamp: 2026-07-07
---

L'iter legislativo di un atto Camera è modellato come una **timeline di stati**: l'atto è collegato a più risorse-stato via `ocd:rif_statoIter`, ciascuna con la sua data (`dc:date`, stringa `AAAAMMGG`) e la sua etichetta (`dc:title`, es. "Assegnato", "In discussione"). Non è un singolo campo "stato corrente": è la sequenza completa delle fasi attraversate.

# Query canonica

```sparql
PREFIX ocd: <http://dati.camera.it/ocd/>
PREFIX dc: <http://purl.org/dc/elements/1.1/>
SELECT DISTINCT ?date ?stato WHERE {
  <http://dati.camera.it/ocd/attocamera.rdf/ac18_2463> ocd:rif_statoIter ?st .
  ?st dc:date ?date ; dc:title ?stato .
}
ORDER BY ?date
```

Nessun filtro sugli stati: si prendono tutti quelli presenti a monte. Le fasi tipiche: `Da assegnare · Assegnato · In corso di esame in Commissione · Concluso l'esame da parte della Commissione. In stato di relazione · In discussione · Approvato definitivamente. Legge · Approvato definitivamente, non ancora pubblicato`. Gli stati arrivano spesso **in coppia sulla stessa data** (es. "Da assegnare" + "Assegnato"; i due stati di "Approvato definitivamente"), per cui il conteggio grezzo tende a essere pari.

# La copertura è alla pari tra legislature (18 = 19)

Verificato che il dato a monte contiene la timeline multi-fase **anche per la legislatura 18**, senza riduzione di granularità rispetto alla 19. Non è quindi necessario alcun accorgimento nel tool per le legislature storiche: la query recupera tutte le fasi disponibili.

* Cura Italia (`ac18_2463`, leg. 18, DL 18/2020) → **7 stati**, inclusi "Assegnato", "In corso di esame in Commissione", "In discussione", "Approvato definitivamente. Legge".
* Distribuzione su un campione di 300 atti per legislatura: profili quasi sovrapponibili (la maggior parte a 2/4 stati, code lunghe fino a 26 stati per la leg. 18 e 22 per la leg. 19). La leg. 18 non è più povera della 19.

# Asimmetria di ramo (non di legislatura): il Senato via SPARQL dà solo lo stato corrente

Lo stesso tool `bill-progress` ha due rami con granularità diversa **per costruzione**, indipendente dalla legislatura:

* **Camera** (`--uri <atto>`): timeline completa via `ocd:rif_statoIter` (una riga per stato).
* **Senato** (default): l'entità `osr:Ddl` in SPARQL espone solo lo **stato corrente** (`osr:statoDdl` + `osr:dataStatoDdl`, `osr:fase`/`osr:numeroFase`), **una sola riga**, non una cronologia. La timeline dettagliata delle fasi del DDL Senato (con sedute ed esiti) vive nel **feed RSS** del DDL, non nello SPARQL — il tool la espone come `rss_url`. Vedi [Feed RSS dei DDL Senato](../senato/index.md).

Conseguenza pratica: un DDL Senato che "sembra meno dettagliato" di un atto Camera non è un buco della legislatura, ma questa differenza di modellazione tra i due grafi. Confrontare timeline con timeline (RSS lato Senato) o stato-corrente con stato-corrente.

# Citations

[1] Verifica 2026-07-07 su `dati.camera.it/sparql`: `ac18_2463` (Cura Italia) → 7 stati `rif_statoIter`; `ac19_2822` (legge elettorale) → 5 stati (iter ancora in corso). Distribuzione del conteggio stati su `GROUP BY ?a LIMIT 300` per `ocd:atto` con `rif_leg` = repubblica_18 e repubblica_19: profili quasi identici, coda a 26 (leg. 18) vs 22 (leg. 19). Emerso dalla gap analysis news-driven del 2026-07-07 (chiarimento del dubbio "granularità iter ridotta leg. 18").
