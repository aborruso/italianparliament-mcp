---
type: Gotcha
title: Votazioni d'Assemblea assenti tra 10 marzo e 16 aprile 2020 (leg.18)
description: le sedute d'Assemblea del periodo COVID esistono nel LOD (con osr:Intervento) ma non hanno alcuna osr:Votazione collegata, compresa la fiducia sul Cura Italia del 9/4/2020. Gap di dataset, non di query.
resource: https://dati.senato.it/sparql
tags: [senato, osr, votazioni, freschezza, assenti, covid]
timestamp: 2026-07-08
---

`senato-votes` restituisce vuoto per l'intera finestra **10 marzo → 16 aprile 2020** (legislatura 18), inclusa la seduta del 9 aprile in cui fu votata la fiducia sul decreto Cura Italia (S.1766, esito noto da fonti terze: 142 sì, 99 no, 4 astenuti).

# Le sedute esistono, i voti no

```sparql
SELECT ?seduta ?data (COUNT(?v) as ?nvoti) WHERE {
  ?seduta a <http://dati.senato.it/osr/SedutaAssemblea> ;
          <http://dati.senato.it/osr/dataSeduta> ?data ;
          <http://dati.senato.it/osr/legislatura> 18 .
  FILTER(STR(?data) >= "2020-02-01" && STR(?data) <= "2020-05-31")
  OPTIONAL { ?v a <http://dati.senato.it/osr/Votazione> ; <http://dati.senato.it/osr/seduta> ?seduta }
} GROUP BY ?seduta ?data ORDER BY ?data
```

Risultato (conteggio voti per seduta, estratto): 2020-03-04 → 70 voti (normale); poi **zero** dal 2020-03-10 al 2020-04-16 incluso (10 sedute d'Assemblea consecutive, tra cui la fiducia Cura Italia del 9/4); ripresa parziale il 2020-04-21 (1 voto) e il 2020-04-30 (11 voti); torna a livelli normali dal 2020-05-06 (21 voti).

Le sedute in questa finestra non sono vuote di per sé: contengono regolarmente `osr:Intervento` (i discorsi in Aula ci sono), manca solo la classe `osr:Votazione`.

# Causa probabile

Durante il lockdown il Senato adottò per un periodo il voto per appello nominale a gruppi ridotti (procedura anti-assembramento), diversa dal voto elettronico ordinario. Il dataset leg.18 registra "nominale con appello" solo per 5 voti del 2022: la modalità di voto straordinaria di marzo-aprile 2020 non sembra essere stata digitalizzata in questo dataset.

# Conseguenza per il tooling

Un vuoto da `senato-votes` in questa finestra **non significa "nessuna votazione avvenuta"** — le fonti terze (stampa, OpenParlamento) confermano che le sedute prevedevano voti regolari, incluse fiducie importanti (Cura Italia 9/4, Liquidità inizio aprile). Significa che questo specifico dataset LOD non li registra per il periodo.

# Citations

[1] Conteggio voti per seduta d'Assemblea, legislatura 18, febbraio-maggio 2020, verificato 2026-07-08: zero `osr:Votazione` dal 2020-03-10 al 2020-04-16 incluso, su 10 sedute consecutive.

[2] Seduta `sedutaassemblea/22107` (2020-04-09, fiducia Cura Italia): esiste con `osr:dataSeduta`, zero `osr:Votazione` con `osr:seduta` verso quella seduta.

[3] Esito noto del voto di fiducia Cura Italia da fonte terza (Corriere della Sera, 2020-04-09): 142 sì, 99 no, 4 astenuti — non verificabile via SPARQL Senato per l'assenza del dato.
