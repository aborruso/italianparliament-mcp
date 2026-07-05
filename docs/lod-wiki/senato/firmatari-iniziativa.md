---
type: Gotcha
title: Firmatari di un DDL al Senato — osr:iniziativa e primoFirmatario non esclusivo
description: Il flag osr:primoFirmatario NON è mutuamente esclusivo; per gli atti di governo vale su più presentatori. Non trattarlo come booleano da primo firmatario unico.
resource: https://dati.senato.it/sparql
tags: [senato, osr, firmatari, iniziativa, trappole]
timestamp: 2026-07-05
---

I firmatari di un DDL al Senato si leggono da `osr:iniziativa`: ogni `?ddl osr:iniziativa ?init` è un nodo con `osr:presentatore` (etichetta testuale), `osr:senatore` (URI del senatore, per le iniziative parlamentari) e il flag `osr:primoFirmatario`.

# La trappola: `osr:primoFirmatario` NON è mutuamente esclusivo

`osr:primoFirmatario` è un flag per-iniziativa con valore `1`, ma **più iniziative dello stesso DDL possono averlo a `1` contemporaneamente**. Non è un booleano che identifica un singolo primo firmatario. Verificato il 2026-07-05:

- **Iniziativa parlamentare ordinaria** — un solo `primoFirmatario=1`. Es. S.104 fine vita (`ddl/55281`): flag su Bazoli, tutti i cofirmatari senza flag. È il caso "pulito".
- **Decreto-legge / atto di governo** — flag su **più presentatori**. Es. Piano Casa (`ddl/60233`): flag su Meloni (Presidente del Consiglio) **e** Salvini (MIT, ministero competente per la casa); Giorgetti, Piantedosi, Foti sono "di concerto" **senza** flag. È la formula standard del decreto-legge (proposto dal Presidente del Consiglio insieme al ministro competente per materia).
- **Decreto collegiale** — flag su **tutti i ministri**. Es. `ddl/56683`: `primoFirmatario=1` su tutti e 17 i presentatori.

Query di controllo (DDL leg.19 con più di un `primoFirmatario=1`, in ordine decrescente):

```sparql
PREFIX osr: <http://dati.senato.it/osr/>
SELECT ?ddl (COUNT(DISTINCT ?init) AS ?nPrimo) WHERE {
  ?ddl osr:iniziativa ?init .
  ?init osr:primoFirmatario ?pf .
  FILTER(STR(?pf) = '1') .
  ?ddl osr:legislatura 19
} GROUP BY ?ddl ORDER BY DESC(?nPrimo)
```

# Conseguenza per il tooling

Mappare `osr:primoFirmatario=1` su un campo booleano `is_primary` / ruolo `"primo firmatario"` **suggerisce un'unicità che il dato non garantisce**: per un atto di governo si ottengono legittimamente due o più righe `is_primary=true`. Il dato è corretto e fedele alla sorgente; è l'etichetta a essere ambigua. Per i DL, i presentatori con flag sono i **proponenti** (Presidente del Consiglio + ministro competente), quelli senza flag sono **di concerto**.

# Citations

[1] Verifica 2026-07-05 su `ddl/60233` (Piano Casa, DL): `primoFirmatario=1` su Meloni e Salvini; su `ddl/56683`: flag su 17 ministri; su `ddl/55281` (S.104 Bazoli): un solo flag. Endpoint `dati.senato.it/sparql`.
