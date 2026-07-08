---
type: Gotcha
title: Firmatari di decreti-legge e atti governativi — Camera (OCD)
description: Sui decreti-legge e DDL del Governo, ocd:primo_firmatario NON punta a un deputato ma a un blank node "membro di governo"; il nome del ministro è un hop più in là via ocd:rif_persona, il dicastero in ocd:ruolo. Senza seguirli il nome torna vuoto.
resource: https://dati.camera.it/sparql
tags: [camera, ocd, firmatari, governo, decreto-legge, blank-node]
timestamp: 2026-07-08
---

Per un atto di **iniziativa parlamentare** i firmatari sono deputati raggiunti direttamente: `<atto> ocd:primo_firmatario ?dep` e `ocd:altro_firmatario ?dep`, dove `?dep` è un URI `deputato.rdf/d<id>_<leg>` con `foaf:firstName`/`foaf:surname`/`rdfs:label` propri. Fin qui nessuna trappola.

# La trappola: i proponenti governativi sono blank node

Per un **decreto-legge** o un **DDL a iniziativa governativa**, `ocd:primo_firmatario` non punta a un deputato ma a un **blank node** (`nodeID://…`) che rappresenta il ministro *in quanto membro del Governo*. Su quel nodo **non** ci sono `foaf:firstName`/`foaf:surname`/`rdfs:label`: chi interroga solo il nodo del firmatario ottiene un `name` **vuoto** e scambia il dato per un bug o per "nessun firmatario".

Il nodo espone invece tre proprietà utili:

- `ocd:rif_persona` → l'URI `persona.rdf/p<id>` del ministro (lì vivono `foaf:firstName`/`foaf:surname`/`rdfs:label`);
- `ocd:ruolo` → il **dicastero** come stringa (es. `"Ministro dell'Interno"`, `"Presidente del Consiglio dei ministri"`);
- `ocd:rif_membroGoverno` → l'URI del mandato di governo (`membroGoverno.rdf/…`).

## Discriminante affidabile parlamentare vs governativo

Il blank node governativo ha `ocd:rif_persona`/`ocd:ruolo` e **non** ha `foaf:firstName` diretto; il deputato ordinario ha `foaf:firstName` diretto e **non** ha `ocd:rif_persona`. La presenza di `ocd:rif_persona` sul firmatario è quindi un discriminante netto. Verificato il 2026-07-08: DDL Piano Casa (`ac19_2920`, decreto-legge) → 5 blank node governativi; AC 2941 (Ziello, iniziativa parlamentare) → deputati diretti.

## Query: risolvere il nome anche per gli atti governativi

```sparql
PREFIX ocd: <http://dati.camera.it/ocd/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?dep ?firstName ?persona ?govRole ?pLabel WHERE {
  { <http://dati.camera.it/ocd/attocamera.rdf/ac19_2920> ocd:primo_firmatario ?dep }
  UNION
  { <http://dati.camera.it/ocd/attocamera.rdf/ac19_2920> ocd:altro_firmatario ?dep }
  OPTIONAL { ?dep foaf:firstName ?firstName }
  OPTIONAL { ?dep ocd:rif_persona ?persona . OPTIONAL { ?persona rdfs:label ?pLabel } }
  OPTIONAL { ?dep ocd:ruolo ?govRole }
}
```

Esito Piano Casa: Piantedosi (Ministro dell'Interno), Salvini (Infrastrutture e trasporti), Giorgetti (Economia e finanze), Foti (Affari europei), Meloni (Presidente del Consiglio).

# Note

- **Nessun `html_url` per i ministri**: l'URI del proponente governativo è un `persona.rdf`, non un `deputato.rdf`; il pattern della scheda istituzionale della Camera non è derivabile da `persona.rdf` senza risolvere il mandato (stesso limite di gov-members / person-career). Il valore aggiunto è nome + dicastero.
- **`is_primary` non è esclusivo**: i proponenti governativi con `ocd:primo_firmatario` sono più d'uno (a Piano Casa tutti e 5 i ministri); trattarli come "primo firmatario" unico è fuorviante — meglio un ruolo esplicito `Governo — <dicastero>`. Simmetrico alla stessa non-esclusività sul ramo Senato (`osr:primoFirmatario`).
