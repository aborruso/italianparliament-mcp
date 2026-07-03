Dati anagrafici dei parlamentari (nascita, genere, luogo)

Cosa espone il LOD su nascita, genere e luogo di un parlamentare, e le trappole per interrogarli in massa. Verificato il 2026-07-03 su Schlein (Camera, `308930`) e La Russa/altri (Senato, `senatore/1275`, `senatore/32`).

## Camera

Due nodi distinti con lo stesso id numerico:

- `ocd:deputato.rdf/d{id}_{leg}` = **ruolo nella legislatura** (gruppo, commissioni, mandato, elezione).
- `ocd:persona.rdf/p{id}` = **anagrafica** (`foaf:Person`): qui stanno nascita, account social, bio testuale.

Join tra i due: passano entrambi dal mandato — `?dep ocd:rif_mandatoCamera ?m . ?pers ocd:rif_mandatoCamera ?m`.

Proprietà anagrafiche (sul nodo persona):

- **Genere**: `foaf:gender`, valori `female` / `male`.
- **Nascita**: `?pers bio:Birth ?b . ?b bio:date ?d ; ocd:rif_luogo ?luogo`.
  - `bio:date` = stringa `YYYYMMDD` (es. `19850504`).
  - `ocd:rif_luogo` = URI `luogo.rdf/{comune}_{provincia}_{regione}` (es. `catania_catania_sicilia`); per l'estero `{citta}_{stato}` (es. `lugano_svizzera`).
  - **La gerarchia geografica È presente, dentro l'URI** (stringa composta): filtrabile per comune / provincia / regione via `STRENDS`/`CONTAINS`. NON sono entità RDF distinte (non esiste un nodo "Regione Sicilia"), ma per filtri e conteggi basta il pattern sulla stringa. Es.: donne nate in Sicilia = `FILTER(STRENDS(STR(?luogo),'_sicilia'))` → 10 deputate leg.19.
- **Bio testuale**: `dc:description` (titolo di studio + carriera, testo libero non strutturato).

Trappola: **serve `DISTINCT`** — il doppio `rdf:type` genera righe duplicate.

## Senato

Nodo unico `osr:Senatore`. La nascita è esposta in due forme ridondanti, entrambe presenti (verificato: `COUNT` = 1 per ciascuna):

- `osr:dataNascita` (stringa `YYYY-MM-DD`, es. `1946-08-12`) e `osr:cittaNascita` (stringa città nuda, es. `Rovigo`, `Varese`).
- `bio:birth ?b . ?b bio:date ?d ; bio:place ?p . ?p rdfs:label ?citta`.

- **Genere**: `foaf:gender`, valori `F` / `M`.
- Il tool `senators list` già restituisce `birth_date`, `birth_city`, `gender`, `election_region` per ogni senatore.

Trappola filtro legislatura: usare `?s osr:mandato ?m . ?m osr:legislatura ?leg . FILTER(?leg={n})`. **NON** funziona `?m osr:legislatura {n}` come triple diretto (il letterale tipizzato non matcha in quella posizione → risultato vuoto).

Limite geografico: **il luogo di nascita è solo la città, senza provincia né regione.** Nessuna gerarchia. `osr:regioneElezione` esiste ma è la regione di **elezione**, non di nascita.

## Conseguenze per i filtri demografici

| Filtro | Camera | Senato |
|---|---|---|
| genere | ✅ `foaf:gender` (`female`/`male`) | ✅ `foaf:gender` (`F`/`M`) |
| intervallo data di nascita | ✅ `bio:date` `YYYYMMDD` | ✅ `osr:dataNascita` `YYYY-MM-DD` |
| luogo nascita — città | ✅ (dall'URI luogo) | ✅ `osr:cittaNascita` |
| luogo nascita — provincia/regione | ✅ (nell'URI luogo) | ❌ solo città |

Note operative:
- **Formati data diversi** (Camera `YYYYMMDD`, Senato `YYYY-MM-DD`): i filtri per intervallo vanno costruiti per-endpoint.
- **Valori genere diversi** (`female`/`male` vs `F`/`M`): normalizzare l'input utente prima del filtro.
- **"Nato/a in regione X"**: nativo su Camera; sul Senato serve un lookup esterno comune→provincia→regione (ISTAT) su `osr:cittaNascita` — motivo per cui conviene materializzare gli elenchi distinti in CSV e normalizzare lì la geografia.
