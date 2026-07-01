# LOD wiki — schema Camera (OCD) e Senato (OSR)

Bundle [OKF](https://github.com/google/open-knowledge-format) (Open Knowledge Format): mappa curata e verificata dello schema Linked Open Data del Parlamento italiano, pensata per orientare un orchestratore AI *prima* di interrogare gli endpoint SPARQL ("compile, don't retrieve").

Il differenziale rispetto a una semplice descrizione dell'ontologia sono le **trappole** operative e gli **assenti verificati**: ciò che nel dato non esiste, per impedire relazioni plausibili ma inesistenti (schema hallucination).

# Camera (OCD)

* [Camera](camera/) - endpoint `dati.camera.it/sparql`, ontologia OCD; entità, trappole e assenti.

# Senato (OSR)

* [Senato](senato/) - endpoint `dati.senato.it/sparql`, ontologia OSR; entità, trappole e assenti.
