# Camera dei Deputati (OCD)

Endpoint SPARQL: `https://dati.camera.it/sparql`. Ontologia OCD (namespace `http://dati.camera.it/ocd/`).

# Entità

* [Sedute e attività delle commissioni](sedute-commissione.md) - `ocd:seduta` per organo e per data; proprietà reali (`dc:date` stringa `AAAAMMGG`, `ocd:rif_organo`, `ocd:rif_leg`) e filtro legislatura obbligatorio.
* [Composizione delle commissioni](composizione-commissione.md) - chi ne fa parte con ruolo e date; due path RDF da unire (`ocd:membro` + `ocd:ufficioParlamentare`), trappola bicamerale sui presidenti senatori (`ocd:rif_senatore`).

# Assenti

* [Assenti verificati](assenti.md) - dati che NON esistono nel LOD OCD (emendamenti, …).
