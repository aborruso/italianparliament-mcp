# Camera dei Deputati (OCD)

Endpoint SPARQL: `https://dati.camera.it/sparql`. Ontologia OCD (namespace `http://dati.camera.it/ocd/`).

# Entità

* [Sedute e attività delle commissioni](sedute-commissione.md) - `ocd:seduta` per organo e per data; proprietà reali (`dc:date` stringa `AAAAMMGG`, `ocd:rif_organo`, `ocd:rif_leg`) e filtro legislatura obbligatorio.
* [Composizione delle commissioni](composizione-commissione.md) - chi ne fa parte con ruolo e date; due path RDF da unire (`ocd:membro` + `ocd:ufficioParlamentare`), trappola bicamerale sui presidenti senatori (`ocd:rif_senatore`).
* [Date degli atti di sindacato ispettivo (aic)](aic-date.md) - `dc:date` è presentazione (a volte composta `pres-modifica`), `ocd:endDate` è conclusione/trattazione; la seduta NON è un link strutturato (numero solo in `dc:description`). Trappola question time.
* [Iter di un atto — timeline degli stati](iter-statoIter.md) - la cronologia dell'iter è una timeline via `ocd:rif_statoIter` (uno stato per fase, `dc:date`+`dc:title`); copertura alla pari tra legislature (18 = 19). Il ramo Senato dà per design solo lo stato corrente (timeline nel feed RSS), asimmetria di ramo non di legislatura.

# Assenti

* [Assenti verificati](assenti.md) - dati che NON esistono nel LOD OCD (emendamenti, …).
