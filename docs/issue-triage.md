# Convenzione di triage delle issue

Come etichettiamo e gestiamo le issue di questo repo. Ricostruita dalle scelte già fatte; va applicata a **ogni** issue, incluse quelle appena create.

## Regola: triage sempre, alla creazione

Ogni issue, nel momento in cui viene aperta, riceve subito:

1. **un label di tipo** (obbligatorio);
2. **un label di priorità** `priority: …` (obbligatorio).

Un'issue senza questi due label è non-triata: va completata.

## Prima di aprire: cerca i duplicati

Prima di creare una issue, cercare tra le esistenti (aperte e chiuse) se il tema è già coperto: `gh issue list --search "<parole chiave>" --state all`. Aprire un doppione è l'errore che questo processo previene.

## Gestione dei duplicati

Quando due issue coprono lo stesso tema:

- **Default**: si tiene la **più vecchia** (mantiene la storia e i riferimenti) e si chiude la più recente, trasferendo nella vecchia i dettagli utili che aveva la nuova.
- **Eccezione**: se la più recente è **nettamente migliore** (più completa, verifiche aggiornate), si tiene quella e si trasferiscono i dettagli utili dalla vecchia.
- In entrambi i casi: **cross-link** tra le due (commento con `#N`), trasferimento dei dettagli utili, chiusura con reason **`not planned`** e commento che spiega la scelta.

## Label di tipo

- `enhancement` — nuova feature o tool, o arricchimento di uno esistente.
- `documentation` — documentazione.
- `bug` — qualcosa non funziona.
- `question` — serve chiarire prima di decidere.
- `gap-dataset` — **additivo**, non alternativo: si aggiunge quando la **radice** del problema è un limite o un'assenza nella fonte LOD. Il codice può solo mitigare (workaround, scraping di fonti non-LOD); il caso va seguito anche col gestore del dato. Convive con `enhancement`/`documentation`.

## Label di priorità

Criteri (dalle descrizioni dei label):

- `priority: high` — problema **reale**, **alto impatto**, **azionabile** subito. Riservata: al momento nessuna issue aperta la porta.
- `priority: medium` — via di mezzo. **Euristica osservata**: nuovi tool ed enhancement di buon valore giornalistico stanno qui (es. nuove fonti, tool compositi, arricchimenti di scheda).
- `priority: low` — basso impatto, oppure **bloccata** da un limite a monte, oppure **già mitigata**. Rifiniture e casi-limite.

## Esempi di riferimento

- `enhancement` + `priority: medium` → nuovo tool o arricchimento di valore (es. #10 enrich scheda, #18 tool documenti Camera, #45 bulk data AKN).
- `enhancement` + `gap-dataset` + `priority: low` → miglioria bloccata da un'assenza nel LOD (es. #26 person_uri ministri, #33 committee-sessions Senato).
- `documentation` + `priority: low/medium` → doc e verifiche (es. #11, #32).
- `gap-dataset` + `priority: medium` → assenza di dato da mitigare e segnalare al gestore (es. #36 votazioni Senato mar-apr 2020).
