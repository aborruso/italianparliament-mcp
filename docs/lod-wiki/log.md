# LOD wiki — log

## 2026-07-01

* **Creation**: [sedute commissione Senato](/senato/sedute-commissione.md) (Entity Map) — schema `osr:SedutaCommissione` per commissione+data; proprietà reali (`osr:dataSeduta`, `osr:titoloBreve`), trappola doppia etichetta (→ `MIN(?tb)`+`GROUP BY`), assente attività femminicidio (0 sedute su `commissione/0-141` e `4-223`).
* **Creation**: [sedute commissione Camera](/camera/sedute-commissione.md) (Entity Map) — schema `ocd:seduta`+`ocd:organo` per organo+data; `dc:date` stringa `AAAAMMGG`, `ocd:rif_organo`, filtro legislatura obbligatorio (`repubblica_<N>`). La Commissione femminicidio (`o19_3941`) ha qui i suoi 181 URI seduta / 157 date distinte (fino a giu 2026): l'attività "viva" della bicamerale è solo in OCD.
* **Initialization**: creata struttura del bundle OKF (`index.md`, `camera/`, `senato/`).
* **Creation**: prima concept page verificata — [emendamenti Camera assenti dal LOD](/camera/assenti.md), esito del sondaggio endpoint del 2026-07-01 (issue #19).
* **Creation**: [trappole Virtuoso — Senato](/senato/trappole.md) (Gotcha), con il quirk di matching nomi fn/ln separati verificato oggi (issue #20). Correzione successiva: rimossa l'affermazione troppo forte "curl diretto → 403" (non stabile alla verifica) e ammorbidita la nota sulle subquery aggregate (`COUNT` semplice può funzionare; forme più complesse restano fragili).
* **Creation**: [collegare Votazione al DDL](/senato/votazione-ddl-link.md) (Query Template) — link parziale + resolver `osr:fase="S.<num>"`, da indagine LOD (issue #21).
* **Update**: resolver #21 **implementato** nei tool `senato-votes`/`votes` (colonna `bill_number` + fallback `ddl_uri`/`bill_uri`); Camera via verifica `dc:identifier`, non URI fabbricato (v0.8.0).
