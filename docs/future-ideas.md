# Future ideas

## Akoma Ntoso bulk data Senato — testo DDL e resoconti commissione

Fonte: `github.com/SenatoDellaRepubblica/AkomaNtosoBulkData`

### Pattern URL

- Path repo: `Leg{N}/Atto{idFase8cifre}/`
- `idFase` = stesso ID già esposto dal nostro tool `bill` Senato (es. `58027` → `Atto00058027`)
- Sottocartelle:
  - `ddlpres/{id}-ft.akn.xml` — testo del DDL presentato (Akoma Ntoso XML)
  - `sommcomm/{id}-rc.akn.xml` — resoconti sedute di commissione

Esempio raw:
`https://raw.githubusercontent.com/SenatoDellaRepubblica/AkomaNtosoBulkData/master/Leg19/Atto00058027/ddlpres/01410923-ft.akn.xml`

### Cosa colma

1. **Testo completo dei DDL Senato** in Akoma Ntoso strutturato (articoli, commi, modifiche). Oggi MCP ha solo metadati SPARQL — gap già noto (testo AIC/DDL mancante).
2. **Resoconti di commissione Senato** in formato strutturato: dibattito in commissione, complementare a `speeches` (che copre solo `osr:interviene` di aula).
3. **Mapping diretto**: il nostro `bill` Senato restituisce già `idFase`, quindi l'URL raw è componibile senza nuove query SPARQL.

### Possibili nuovi tool MCP

- `bill-text` (Senato): scarica e parsa AKN del DDL → articolato strutturato o testo plain con riferimenti per articolo/comma.
- `committee-transcripts` (Senato): elenco e lettura resoconti di commissione di un atto.

### Da verificare prima dell'implementazione

- Copertura: cartelle `ddlpres` non sempre popolate. Misurare su un campione XIX legislatura quanti atti hanno `-ft.akn.xml`.
- Camera: questo bulk è solo Senato. Cercare equivalente Camera o accettare asimmetria.
- Parsing AKN: scegliere libreria/strategia (XPath custom vs libreria akoma-ntoso esistente).

## Affordance di scoperta CLI stile opensdmx (orchestrazione LLM a freddo)

Modello: la CLI di [opensdmx](https://github.com/ondata/opensdmx) è progettata per essere orchestrata da un LLM *senza skill*, mettendo il workflow dentro la CLI stessa (catena `providers → search → info → values/constraints → get`, comando `which`, comando `guide`). Oggi italianparliament ha le basi agent-friendly (output strutturato, errori puliti, `Examples:`, concatenazione via URI) ma delega il workflow alla skill compagna. Per un LLM che invoca la CLI nuda, opensdmx è più scopribile.

### Fatto (baseline opensdmx)

- ✅ Comando `guide` (flusso tipico di orchestrazione).
- ✅ Comando `which <capacità>` (mappa capacità→comando), con **exit code 0/2** e output `--json` ranked.
- ✅ Enum validi negli **errori** (wrapper `runTool` valida l'input Zod prima di execute).

### Da fare — upgrade ispirati al piano LLM di Miller (issue #2098)

Riferimento: `plans/plan-2098-llm.md` del repo `johnkerl/miller` (cita esplicitamente @aborruso sulla distinzione codelist/constraint).

1. **Catalogo machine-readable** (Miller PR1): comando `catalog` che dumpa in JSON tutti i tool con nome, descrizione, flag, **value-set degli enum**, esempi, + `version`/`schema_version` come **cache key** per un orchestratore. Quasi gratis: l'MCP `tools/list` è già questo catalogo (espone le inputSchema Zod); serve l'equivalente CLI.
2. **Enum esposti *proattivamente*** (Miller PR3, "codelist"): i value-set degli enum statici (`vote-type`, `rank-by`, `initiative`, `format`, `chamber`, `order`) compaiono in `--help` e nel catalogo, non solo on-error. "Gli agenti allucinano i *valori*, non solo i flag": emettere l'enum reale attacca l'allucinazione alla radice.
3. **`did_you_mean`** (Miller PR4): su risorsa/comando/flag errato, suggerire il più vicino (Levenshtein) **come riga di comando già corretta e copia-incollabile**, non come prosa.
4. **codelist vs constraint** (Miller PR6 `describe`): distinguere i valori **fissi** (enum, codelist → catalogo) dai valori **data-dipendenti** (constraint: sigle gruppo, legislature disponibili, nomi commissione). Questi ultimi sono già scopribili via `groups list`/`legislatures list`, ma il legame non è esplicito: l'help del flag dovrebbe dire "valori validi via `groups list`", oppure un comando `values`/`describe` che li interroga.
5. **Esempi testati in CI** (Miller cross-cutting #5): un esempio eseguibile per ogni comando, verificato in CI per evitare che marciscano (oggi testati a mano).
6. **Env var "agent-mode"** (`ITALIANPARLIAMENT_AGENT` o simile): una sola variabile che flippa tutto l'output in JSON + errori strutturati.

### Note

- Il dominio è diverso da opensdmx/Miller (entità URI-driven, non cubi/record filtrati per dimensione): la scoperta naturale qui è già `search`/`groups list`/`legislatures list`. Manca soprattutto l'**etichettatura esplicita** del flusso e l'introspezione dei valori (#2, #4).
- Decidere se questi affordance vivono nella CLI (più self-orchestrating) o restano nella skill. opensdmx/Miller scelgono la CLI.

## Flag `--confidence-vote` su `senato-votes` (fiducia al Senato via regex sulla label)

**Contesto**: `votes` (Camera) ha il flag `--confidence-vote` che filtra i voti di fiducia. `senato-votes` non ce l'ha. Verifica fatta in v0.4.1: nell'endpoint SPARQL del Senato **non esiste un predicato strutturato** che marchi una votazione come fiducia. I predicati disponibili su una `osr:Votazione` sono `osr:tipoVotazione` ("nominale con appello"/"elettronica" — la *modalità*, non il *tipo politico*), `osr:esito`, contatori, `osr:seduta`. La parola "fiducia" compare **solo nel testo di `rdfs:label`** (es. "Disegno di legge n.1933. Votazione questione di fiducia.").

**Ulteriore caveat emerso**: anche il `ddl_uri` di una votazione di fiducia è **vuoto** (il legame col DDL è solo nella `label`). Quindi `senato-votes list --ddl-uri <uri>` non restituisce le fiducie — oggi documentato come workaround "filtra per data seduta" (README "Note sui dati" + 2 skill).

**Idea**: aggiungere `--confidence-vote <bool>` a `senato-votes list` che filtri internamente con `FILTER(regex(str(?label), "fiducia", "i"))`. Così si recupera la simmetria con `votes` Camera e si toglie la necessità del workaround per-data. Implementazione piccola (un ramo di filtro in più nella query), nessun nuovo tool.

**Variante/complemento**: estrarre anche il numero DDL dalla `label` con regex (es. "n.1933") per popolare `ddl_uri` quando è vuoto, così le fiducie diventano recuperabili anche via `--ddl-uri`. Più invasivo (post-processing TS sui risultati) ma risolve il caveat alla radice. Da valutare copertura/affidabilità del pattern della label su più legislature.

**Riferimento**: emerso dalla verifica del case study `docs/case-study-salario-giusto.md` (v0.4.1).

## Indicatori stile Openpolis (forza / compattezza / affidabilità / ribelli)

**Contesto**: il riferimento esplicito del progetto è [openparlamento](https://parlamento19.openpolis.it/) di Openpolis. Le sue **classifiche e indicatori originali non sono derivabili da SPARQL grezzo** — richiedono calcolo TS lato MCP aggregando molti `vote-detail`/`senato-vote-detail`. Già mappati come gap in `docs/user-stories-parlamento.md` (A5, C2, D3, G1 + indicatori A0) ma non raccolti qui come possibili feature. Con v0.4.0 (`senato-vote-detail` ora ha `group_label`) e v0.4.1 i mattoni ci sono tutti; manca solo lo strato di calcolo.

**Indicatori che farebbero il salto verso il pubblico "giornalista puro"** (tutti derivabili, nessun nuovo SPARQL):

1. **Profilo di voto di un parlamentare nel tempo** — "come ha votato il senatore X nell'ultima legislatura, voto per voto". Oggi serve iterare manualmente sui `vote-detail` (uno per votazione). Un tool `member-votes` che, dato un `senator_uri`/`deputy_uri` + range, restituisca tutte le sue scelte + il gruppo alla data + il esito della votazione. È il prerequisito di tutti gli indicatori sotto.
2. **Voti ribelli** (A5, C2) — votazioni in cui un parlamentare vota **diversamente dalla maggioranza del proprio gruppo**. Calcolabile dal profilo di voto sopra + il `group_label` già presente. Per la Camera già possibile aggregando `vote-detail`; per il Senato ora possibile grazie a `group_label` (prima ❌, vedi user-stories A5/D3).
3. **Tasso di ribellione per gruppo** — % di voti in cui i membri di un gruppo non si sono allineati alla maggioranza del gruppo. Classico titolo d'apertura ("il gruppo più disciplinato / più ribelle"). Aggregazione del punto 2.
4. **Indice di compattezza gruppo** (D3, Openpolis) — `% partecipazione` + `% voto in linea col gruppo`. Per il Senato ora fattibile (prima ❌). Richiede l'iterazione su tutte le votazioni di un periodo.
5. **Indice di forza / affidabilità** (Openpolis) — punteggio per incarichi parlamento+governo (ponderazione istituzioni/organi/ruoli). Meno "grezzo" degli altri: richiede una **scelta editoriale di ponderazione** (che peso a una presidenza di commissione vs un sottosegretariato). Va decisa e documentata, non solo calcolata.
6. **Classifica dei più assenti** (G1) — derivabile dal profilo di voto (1), ma **pesante**: richiede di processare tutte le votazioni di un periodo per tutti i parlamentari. Valutare caching o pre-computazione.

**Cosa NON è replicabile** (editoriale Openpolis, fuori scope dati grezzi):
- **Atto chiave / Voto chiave** — classificazione editoriale, non nel dato.
- **Decreto omnibus / minotauro / salvo intese** — etichette editoriali su DDL.

**Dipendenze tra le idee**: il punto 1 (profilo di voto) è il **prerequisito** dei punti 2-4 e 6. Ha senso implementarlo per primo: sblocca quasi tutto il resto con un solo nuovo tool. Il punto 5 (indice di forza) è indipendente ma richiede prima una decisione di design sulla ponderazione.

**Nota su costi/performance**: i punti 4 e 6 iterano su *tutte* le votazioni di un periodo per *tutti* i parlamentari — potenzialmente centinaia di query SPARQL. Valutare: (a) fetch parallela con rate-limit, (b) caching locale su periodo/legislatura, (c) un endpoint "batch" apposito invece del tool singolo. Il punto 1 (profilo di un solo parlamentare) invece è leggero.

**Riferimento**: `docs/user-stories-parlamento.md` sezioni A, C, D, G + "Indicatori originali Openpolis".

## Comando `schema` — mappa curata dell'albero LOD (Camera/Senato) per l'orchestratore AI

**Contesto**: gran parte del costo per un'AI che orchestra i tool è l'**orientamento a tentoni** sulla forma dei dati — scoprire via query lente (su endpoint instabili/WAF) che `osr:tipoSeduta` è la fascia oraria, che `OggettoTrattazione.relativoA` punta solo al DDL, che le sedute Camera `src` sono solo storiche, che `dc:title` delle votazioni è vuoto, ecc. L'ontologia però è **stabile**: la mappa si scrive una volta e si riusa. Oggi questa conoscenza vive sparsa nella memoria di progetto e va ricostruita a ogni sessione fresca.

**Idea**: un comando `schema` (subcommand CLI + tool MCP, come da convenzione) che stampa in forma compatta e leggibile da LLM l'**albero delle entità principali e le relazioni chiave** dei due modelli — Camera (OCD) e Senato (OSR). Curato **staticamente** (non generato live): veloce, sempre disponibile, indipendente da uptime/WAF.

**Valore oltre l'albero**: includere le **note-trappola** (`tipoSeduta`=orario, `dc:title` vuoto, quirk Virtuoso: no subquery COUNT / `STR()` nei FILTER / legislatura integer nudo / date `xsd:date` tipizzate; Camera rifiuta `PREFIX rdfs`) e la riga **✗ assenti** (es. audizioni come tipo, soggetti auditi — da verifica dedicata). È ciò che un orchestratore fresco non sa e che evita query sbagliate/fallite.

**Esempio di output (Senato, estratto)**:
```
SENATO (osr: http://dati.senato.it/osr/)  — Virtuoso
Senatore ──membro──> Gruppo (Denominazione, filtro temporale asOf)
Ddl ──firmatario──> Senatore ; ──dataPresentazione (xsd:date)
SedutaCommissione: commissione · dataSeduta · tipoSeduta(=fascia oraria!) · legislatura
Intervento ──oggetto──> OggettoTrattazione ──relativoA──> Ddl ; ──seduta──> Seduta ; ──interviene──(inv)── Senatore
Votazione: dc:description = titolo reale (dc:title vuoto)
⚠ no subquery COUNT · FILTER con STR() · legislatura integer nudo
✗ assenti: audizioni come tipo · soggetti auditi
```

**Da dove esce il contenuto**: quasi tutto è già in memoria di progetto (decine di note su proprietà/filtri/quirk) + esplorazione fatta + verifica audizioni. Non va inventato, va raccolto e strutturato.

**Domande aperte / decisioni di design**:
- Formato: testo ad albero (orientamento) e/o `--format json` (uso programmatico)? Valutare se un JSON-LD context / schema descrittivo è più riusabile.
- Granularità: solo ~10 entità principali per camera, o anche l'elenco proprietà per entità (più completo, più verboso)?
- Statico vs semi-live: file curato a mano (consigliato) o enumerazione tipi + annotazioni manuali sopra.

**Riferimento**: emerso il 2026-07-01 dall'indagine sulle audizioni (coordinamento agente-dominio + agente-LOD); vedi memoria `project_audizioni_coverage`.

### Prior art e spunti (ricerca exa, 2026-07-01)

Diversi progetti confermano il pattern "dai all'AI lo schema prima di interrogare". Spunti concreti:

- **thiwi/OntoMCP** — compila OWL/RDFS/SHACL in JSON Schema + Zod ed espone via MCP tool mirati: `list_domain_entities`, `get_entity_schema`, `get_entity_graph_context`. Motivazione identica alla nostra: "fewer hallucinated data models". Deterministico. → modello di riferimento per i *nomi* dei tool.
- **rareba/sparql-mcp** — oltre alla query generica, ha *helper pre-cotti* con la nota chiave: "pre-baked queries so the LLM doesn't re-derive the schema on every call". Più introspezione generica (list classes, most-used predicates, sample instances, prefixes). Conferma esattamente il costo che vogliamo togliere.
- **ryaker/SparrowOntology** — ha un tool `start_here` = "schema orientation: class counts, schema-first workflow": è letteralmente il nostro comando d'orientamento. Più `export_json_ld`.
- **emekaokoye/mcp-rdf-explorer** — espone lo schema come **MCP resource** `schema://all` (classi+proprietà) e i template SPARQL come resource `queries://{name}`. Spunto: pubblicare la mappa come *resource* oltre che come tool.
- **shimo4228/claude-skill-jsonld-knowledge-graph** — Claude skill che genera un `graph.jsonld` companion accanto a `llms.txt`, con entità/relazioni come triple schema.org. Design move rilevante per noi: **"schema-absence enforcement"** = mappare esplicitamente ciò che NON esiste per impedire relazioni sbagliate — allineato alla nostra riga **✗ assenti** (audizioni, auditi). Anche "volatile-state exclusion" (non mettere versioni/conteggi volatili nello schema).
- **LinkML** (linkml.io) — da un singolo schema YAML "polyglot" deriva sia il **JSON-LD context** (semantica) sia il **JSON Schema** (struttura). Se un domani vogliamo una sola fonte di verità da cui generare più formati, è la via.
- **Paper arXiv 2603.10700** ("Structured Linked Data as a Memory Layer for Agent-Orchestrated Retrieval") — pagine entità arricchite con JSON-LD + istruzioni in stile `llms.txt` danno +~30% accuracy in pipeline agentiche. Conferma il valore del combinare struttura (JSON-LD) e guida testuale (llms.txt).

**Sintesi per il nostro caso**: due approcci combinabili — (a) un **tool/resource MCP di orientamento** (`schema` / `start_here` stile OntoMCP+Sparrow) e (b) un **file companion** curato (JSON-LD e/o testo `llms.txt`-style, stile shimo4228). Il nostro *differenziale* rispetto a tutti questi resta lo stesso: le **note-trappola** operative (quirk Virtuoso, `tipoSeduta`=orario, `dc:title` vuoto, `PREFIX rdfs` rifiutato) e i **✗ assenti verificati** — che nessuno di questi cattura, tranne in parte "schema-absence enforcement". JSON-LD è adatto per la parte struttura/relazioni; le trappole e gli assenti stanno meglio come annotazioni testuali affiancate (pattern llms.txt).

### Spunto migliore: pattern "LLM Wiki" di Karpathy ("compile, don't retrieve") — jsonstat/llm-wiki

Il repo `jsonstat/llm-wiki` non è rilevante per il *formato* JSON-stat, ma per il **pattern che applica**: la [LLM Wiki di Karpathy](https://karpathy.ai/blog/llmwiki.html). Idea centrale: **"compila, non recuperare"**.
- RAG tradizionale: recupera chunk grezzi a ogni query — stateless, ripetitivo (come reinterpretare il sorgente ogni volta).
- LLM Wiki: pre-compila le fonti in una **knowledge base Markdown interlinkata**, mantenuta dall'LLM e curata dall'umano — stateful, che *si accumula nel tempo*.

È la formulazione esatta del problema che questa idea affronta: **non ri-derivare lo schema LOD a ogni sessione**.

**Struttura del pattern** (dal repo):
- `SKILLS.md` = lo strato "schema"/manuale operativo per l'LLM (folder, workflow di ingest, template di pagina, regole di citazione, protocollo Q&A, checklist di lint/audit). È l'`.editorconfig` della conoscenza.
- `raw/` = fonti immutabili.
- `wiki/` = pagine Markdown compilate, una per concetto, con `[[wiki-link]]`, `index.md`, `log.md` append-only.

**Perché per noi è meglio del JSON-LD puro**:
1. Metà del nostro contenuto NON è struttura formale ma **note-trappola operative** (quirk Virtuoso, `tipoSeduta`=orario, `dc:title` vuoto, `PREFIX rdfs` rifiutato) e **assenti verificati** (audizioni, auditi). Markdown le cattura meglio di un `@context` JSON-LD.
2. **Usiamo GIÀ questo pattern**: l'auto-memory del progetto (`memory/*.md` atomici + `MEMORY.md` indice + `[[link]]`) È una LLM Wiki privata. La proposta è la sua versione **di dominio, versionata nel repo, condivisibile** con altri AI/utenti (non solo la mia memoria di sessione).
3. Nessun build, leggibile da umano e da qualunque LLM.

**Forma concreta ipotizzata**: `docs/lod-wiki/` con `SKILLS.md` (come interrogare/mantenere) + una pagina per entità principale (Senatore, Ddl, SedutaCommissione, OggettoTrattazione, Votazione, …) + pagine `trappole.md` e `assenti.md` + `index.md`. Poi, opzionalmente, esporla come **tool/resource MCP** (`schema` che serve l'index/le pagine) — così l'orchestratore la legge senza toccare l'endpoint. Il JSON-LD resta un possibile output *derivato* per la sola parte struttura (à la LinkML), ma il cuore è la wiki Markdown.

**Decisione aperta**: LLM Wiki Markdown (consigliata, coerente col nostro sistema di memoria) vs tool MCP che compila da JSON Schema/Zod (OntoMCP) vs JSON-LD context (LinkML). Probabile combinazione: wiki Markdown come fonte di verità + esposizione MCP.

### Formato consigliato: OKF (Open Knowledge Format) — la LLM Wiki *specificata*

`/home/aborruso/git/ai-specs/specs/okf/SPEC.md` (Open Knowledge Format v0.1, Google Cloud, Apache-2.0) è la scelta di formato per la LOD wiki: è il pattern LLM Wiki reso **standard e interoperabile**, senza tooling. La sua §10 lo dichiara esplicitamente ("LLM wiki repositories" + "metadata as code", ma *specificato*).

Perché combacia col nostro caso quasi 1:1:
- **Bundle** = directory di Markdown con frontmatter YAML. Nessuno schema registry, nessun SDK: "if you can `cat` a file, you can read OKF; if you can `git clone`, you can ship it".
- **Concept** = un `.md` per unità di conoscenza. Frontmatter: `type` (unico obbligatorio), `title`, `description`, `resource` (URI canonico dell'asset), `tags`, `timestamp`.
- **`resource`** → per noi è l'**URI RDF reale** della classe/proprietà (es. `http://dati.senato.it/osr/SedutaCommissione`). Lega ogni concept al dato vero.
- **`# Schema`** (sezione body convenzionale) → tabella delle proprietà dell'entità. **`# Citations`** → le query SPARQL di verifica.
- **Cross-link** markdown bundle-relative (`/senato/commissione.md`); link rotto = *conoscenza non ancora scritta* (consumo permissivo). **`index.md`** = progressive disclosure; **`log.md`** = storia.
- Consumo tollerante (type sconosciuti, campi extra, link rotti) → adatto a una KB che cresce e viene generata in parte da agenti.

**La nostra auto-memory è già quasi-OKF**: Markdown + frontmatter (`type`, `description`) + `[[link]]` + `MEMORY.md` indice. Adottare OKF = renderla uno **standard condivisibile** (link markdown `/path.md` al posto di `[[wikilink]]`, `resource` per l'URI, conformance §9).

**Mapping concreto** (bundle `docs/lod-wiki/` conforme OKF):
```
docs/lod-wiki/
├── index.md
├── camera/  (index.md, seduta.md, atto.md, organo.md, trappole.md, …)
└── senato/  (index.md, senatore.md, ddl.md, seduta-commissione.md,
              oggetto-trattazione.md, votazione.md, trappole.md, assenti.md)
```
Esempio `senato/seduta-commissione.md`:
```markdown
---
type: RDF Class
title: SedutaCommissione
description: Seduta di una commissione del Senato.
resource: http://dati.senato.it/osr/SedutaCommissione
tags: [senato, commissioni]
---
# Schema
| Proprietà | Range | Note |
|-----------|-------|------|
| osr:commissione | Commissione | |
| osr:tipoSeduta | string | ⚠ FASCIA ORARIA (antimeridiana/pomeridiana), non la natura |
| osr:dataSeduta | xsd:date | |
# Assenti
- audizioni come tipo di seduta — non modellate ([[assenti]])
# Citations
[1] query di verifica del 2026-07-01
```
Valori `type` utili: `RDF Class`, `RDF Property`, `Endpoint`, `Gotcha` (trappola), `Query Template`.

**Conclusione affinata**: pattern **LLM Wiki** (Karpathy, "compile don't retrieve") → formato **OKF** (Markdown+frontmatter specificato) come fonte di verità nel repo → opzionale esposizione via **tool/resource MCP** (stile OntoMCP/mcp-rdf-explorer `schema://all`) e/o output **JSON-LD** derivato (à la LinkML) per chi vuole la struttura machine-readable. Il differenziale resta nostro: `# Schema` con le trappole + concept `assenti` verificati.

## Tool per documenti Camera (`ocd:DOC`) — incl. Doc. XVII indagini conoscitive

**Contesto**: il tool `documents` copre solo il Senato (`osr:Documento`/`osr:tipoDoc`). Per la Camera la classe `ocd:DOC` è raggiungibile solo via `sparql` generico. Verificato il 2026-07-01 (indagine audizioni): la Camera espone in `ocd:DOC` gli **esiti documentali** delle attività conoscitive delle Commissioni:
- **Doc. XVII** — `dc:type`="DOCUMENTI CONCLUSIVI DI INDAGINI CONOSCITIVE SVOLTE DA COMMISSIONI DELLA CAMERA… Art. 144, c.3 Reg.", serie corrente fino a leg 19, con commissione, seduta di delibera, tema e URL al testo (`dcterms:isReferencedBy`).
- Documenti su **atti UE** e altre serie tipizzate via `dc:type`.

**Proposta**: tool `camera-documents` (o `documents --chamber camera`) sulla classe `<http://dati.camera.it/ocd/DOC>`; filtri `--type`/`--legislature`/`--keyword`, output con `html_url` da `dcterms:isReferencedBy`. È il pendant Camera del già esistente lato Senato: sblocca "trova l'esito dell'indagine conoscitiva X" anche per la Camera. Ricordare i quirk Camera (URI pieni, no full-scan) e enumerare prima i valori distinti di `dc:type` per l'enum del filtro.

**Riferimento**: issue #18; memoria `project_audizioni_coverage`. Nota: l'**evento-audizione** e i **soggetti auditi** restano assenti dai dati SPARQL (solo web) — questo tool copre l'*esito documentale*, non l'audizione in sé.

### Evoluzione 2026 dei concetti (OpenAlex + verifica exa)

I concetti trovati su OpenAlex (schema linking, KBQA, grounding — fondamenti 2023-2025) nel 2026 sono maturati e **convergono sulla nostra idea** da tre direzioni. Verifica exa (lug 2026):

**1. Text-to-SPARQL: da "retrieval" a "schema realization"** — la generazione di query oggi è agentica e *schema-first*:
- **SchemaForge** (arXiv 2508.01815) — meccanismo centrale "question-conditioned **schema-slice alignment**": si isola la *fetta di schema* rilevante, che poi **vincola** generazione e verifica della query. È il nostro "indice di orientamento" ma calcolato per-domanda.
- **AgenticT2S** (ACL ARR 2026) — multi-agente con schema-aware routing + verifica a due stadi: +21 pt accuracy, −46% token vs baseline.
- **SELF-KBQA / Graph Explorer** (ACL Findings 2026) — nominano il problema che ci riguarda: **schema hallucination** = l'LLM genera relazioni *plausibili ma inesistenti* (es. un immaginario `tipoAudizione`). Il grounding esplicito nello schema lo previene. È la giustificazione formale delle nostre note-trappola + `assenti`.

**2. MCP: progressive disclosure e failure-mode nello schema** — ormai prassi de facto:
- **Progressive Disclosure MCP** (whitepaper, gen 2026) — rivelare lo schema gradualmente dà 85-100× di risparmio token; le **Agent Skills** di Anthropic sono progressive disclosure di alto livello che "impacchettano conoscenza organizzativa che i modelli generici non hanno".
- **Convergence of Schema-Guided Dialogue + MCP** (arXiv 2602.18764) — 5 principi di schema design; il n.3 è **"Failure Mode Documentation"** e il n.5 "Inter-Tool Relationship Declaration": validano *formalmente* che documentare trappole e relazioni nello schema è design corretto, non accessorio.
- **mcp-proto-okn** (arXiv 2605.30283), **TogoMCP**, **Neo4j MCP** — tutti espongono `get_schema` (classi/predicati/proprietà) + `get_query_template` (pattern SPARQL per casi speciali). → modello diretto per il nostro tool `schema` + i template di query canonici (che abbiamo già in memory).

**3. LLM Wiki (OKF): da idea a pattern con studi empirici** — in 3 mesi:
- Fonte: [gist di Karpathy](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) (apr 2026): 3 layer (raw / wiki compilato / **schema**), "compiled once, kept current, not re-derived on every query". LangChain lo formalizza come **"Wiki Memory"** (giu 2026): substrato più semplice = *files*; adatto a durable domain knowledge, non a stato conversazionale.
- Lezioni operative dagli studi (da recepire nella nostra wiki OKF):
  - **Compilation gap** (WiCER, arXiv 2605.07068): il compilatore LLM tende a over-comprimere 2-3× e perdere fatti critici → non riassumere troppo; serve un loop *Compile-Evaluate-Refine*.
  - **Error Book** (Retrieval-as-Reasoning, arXiv 2605.25480): loop persistente contro dangling link, contraddizioni, fatti non supportati.
  - **Claim-citation alignment** (Vector RAG vs Wiki, arXiv 2605.18490): il vantaggio del wiki è che la pagina contiene *la frase di supporto* → per noi = ogni concept con `# Citations` alla query di verifica.
  - **Ibrido L1/L2** (particula.tech): wiki per lo schema stabile (L1, sempre in context, ~100K token), SPARQL live per i dati volatili (L2). È esattamente la nostra separazione "mappa curata vs endpoint".

**Implicazione**: la direzione (LLM Wiki/OKF + tool `schema`/`get_query_template` MCP + progressive disclosure) non è una scommessa — nel 2026 è il punto di convergenza sia della ricerca KBQA (schema realization, anti schema-hallucination) sia della prassi MCP (failure-mode documentation, progressive disclosure). Il nostro differenziale operativo (trappole Virtuoso, `tipoSeduta`=orario, `assenti` verificati) coincide con il principio validato "Failure Mode Documentation".

## Scraper audizioni — mappa delle pagine web (Camera/Senato)

Le **audizioni come evento** e i **soggetti auditi** NON sono nei dati SPARQL (verificato: solo l'esito documentale Doc. XVII è nel triplestore — vedi issue #18). L'unica fonte per "chi è stato audito il giorno Y in commissione Z" è il **web**. Analisi fatta con agent-browser il 2026-06-30/07-01, utile per un eventuale scraper dedicato.

**Camera — no WAF, struttura pulita e scrapeable**
- `camera.it/leg19/202` — "Resoconti stenografici delle audizioni": elenco **per mese** con commissione, data, oggetto/soggetto audito, link al resoconto.
- `camera.it/leg19/203` — "Indagini conoscitive".
- `camera.it/leg19/471` — "Stenografici delle Commissioni".
- Link ai testi con URL **deterministico** (costruibile senza scraping del listing):
  `documenti.camera.it/apps/commonServices/getDocumento.ashx?idLegislatura=19&sezione=bollettini&tipoDoc=comunicato&anno=YYYY&mese=MM&giorno=DD&idCommissione=<id>`
- Campi estraibili per record: commissione, data, oggetto, soggetto audito (nome + qualifica, nel testo), URL resoconto.

**Senato — dietro AWS WAF (curl bloccato → usare agent-browser), più frammentato**
- `senato.it/lavori` (home); `senato.it/1095` (Giunte e Commissioni) → rimanda alle **sezioni delle singole commissioni** per o.d.g., resoconti, schede di seduta (niente indice centralizzato come la Camera).
- Entry point: `senato.it/lavori/agenda-aula-e-commissioni?range=w|d` e `senato.it/commissioni-e-giunte/riepilogo-delle-convocazioni`.
- Lo scraping Senato è più oneroso: navigazione per commissione, via browser reale per il WAF.

**Indicazione**: partire dalla Camera (`/leg19/202`), miglior rapporto sforzo/resa. Uno scraper produrrebbe il dato mancante (evento + auditi) da affiancare al tool `ocd:DOC` (esito documentale). Vedi memoria `project_audizioni_coverage` (sezione "Livello WEB") e `feedback_waf_use_agent_browser`.
