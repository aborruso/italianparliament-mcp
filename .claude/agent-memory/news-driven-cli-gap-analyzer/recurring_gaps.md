---
name: recurring-gaps
description: Gap ricorrenti confermati nel retest 2026-07-01, non ancora chiusi — usare come checklist rapida nei prossimi retest
metadata:
  type: project
---

Confermati con evidenza reale (comandi CLI + SPARQL) nel retest del 2026-07-01. Se un prossimo retest li ritrova, non serve rifare tutta l'indagine: basta uno smoke test mirato.

- **`amendments` è Senato-only.** L'help della CLI lo dichiara esplicitamente ("Senato amendments"). Per la Camera non esiste alcun modo — né tool né SPARQL testato con successo — di elencare gli emendamenti a un DDL. Questo è il gap più rilevante per notizie tipo "legge elettorale", "DDL sicurezza", cioè quasi ogni provvedimento Camera con battaglia di emendamenti in Aula.
- **`amendments list --ddl-uri` (Senato) esiste ma il dataset sembra non popolato per DDL recenti.** Testato su 3 DDL del 2026 (consenso informato scolastico ddl/59761, DL sicurezza ddl/59938, gruppo accise ddl/59566): sempre 0 risultati, confermato anche via SPARQL diretto su `osr:Emendamento`/`osr:oggetto`. Gli emendamenti che *sono* popolati appartengono a DDL di inizio XIX legislatura (es. ddl/56260, 2022). Non è chiaro se sia un cutoff ETL preciso: da non enunciare come "dati fermi al 2023" senza riverificare (il MAX(?e) via SPARQL è inaffidabile, ordina le URI come stringhe non come numeri).
- **`ddl_uri`/`bill_uri` quasi sempre vuoto nell'output di `votes`/`senato-votes`**, anche quando è il campo stesso usato per filtrare. Esempio concreto: fiducia DL Lavoro (`votazione/19-432-3`, 94-61-2) ha `ddl_uri:""`, l'unico collegamento al provvedimento è il testo libero nel `label` ("Disegno di legge n.1933..."). Root cause: il filtro passa da `osr:oggetto`/`oggettotrattazione`, non dal DDL diretto, e il campo di output non viene sempre valorizzato back.
- **`search find --chamber both` perde risultati Senato con query nome+cognome insieme.** Esempio: `--name "Ignazio La Russa" --chamber both` → solo righe Camera (0 Senato), mentre `--name "La Russa" --chamber both` (solo cognome) O `--chamber senato` esplicito con nome completo trovano correttamente il senatore. Sembra un problema di matching (ordine/concatenazione dei token) lato query Senato quando ci sono più parole. Rischio concreto: il workflow raccomandato "usa sempre search per trovare l'URI" può fallire silenziosamente per nomi completi di persone che sono state sia deputati sia senatori.
- **`sindacato-ispettivo` campo `esito` sempre vuoto.** KO strutturale confermato ancora al 2026-07-01 (anche su record freschissimi, presentati lo stesso giorno del test): il dato non esiste lato endpoint Senato, non è un problema di tooling.
- **Nessun filtro `--type` su `aic list`** per isolare specificamente le interrogazioni a risposta immediata (question time). `--date-from`/`--date-to` su un singolo giorno non è affidabile per isolare la seduta di question time (ha restituito 30 righe di cui nessuna "RISPOSTA IMMEDIATA" in un test).
- **`aic --keyword` fa substring match senza confini di parola.** Falsi positivi tipo "CETA" dentro "Acetamiprid" o "Cetara" (comune). Impatta soprattutto keyword corte/acronimi (PNRR, IVA, ecc.).

Vedi anche [[gaps_closed_2026_07_01]] per cosa NON ritestare da zero.
