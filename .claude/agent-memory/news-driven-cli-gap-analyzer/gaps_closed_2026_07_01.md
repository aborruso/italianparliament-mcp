---
name: gaps-closed-2026-07-01
description: Gap noti (dal retest 2026-06-28) confermati CHIUSI nel retest del 2026-07-01 — non ritestare da zero, verificare solo con uno smoke test rapido
metadata:
  type: project
---

Retest del 2026-07-01 su CLI v0.7.1. Questi gap, noti da retest precedenti, sono confermati risolti con evidenza reale:

- **Votazioni Senato**: `senato-votes list` e `senato-vote-detail show` esistono e funzionano bene. Testato: `senato-votes list --legislature 19 --date-from 2026-06-20 --date-to 2026-06-25` ha trovato voto finale DL accise (79-51) e fiducia DL Lavoro (94-61-2); `senato-vote-detail show --vote-uri ...` ha restituito 193 senatori con nome/gruppo/voto. Anche `--ddl-uri` come filtro funziona (isola tutti i voti di un DDL, inclusi emendamenti in sequenza).
- **`bill-rapporteurs` copre ora anche il Senato** (prima solo Camera). Testato su `http://dati.senato.it/ddl/59761`: ha restituito correttamente relatore in commissione e in assemblea con nome e data, coerente con fonte giornalistica primaria (comunicato di seduta Senato).
- **`aic --keyword` ora FILTRA davvero** (prima: "accettato ma ignorato silenziosamente" — bug chiuso). Verificato con countOnly: keyword "xylella" → 28/40587, keyword inventato → 0, keyword reale → sottoinsieme coerente. Residuo: substring match senza confini di parola (falsi positivi tipo "CETA" dentro "Acetamiprid"/"Cetara") — vedi [[recurring_gaps]].
- **`amendments list --ddl-uri`** esiste ora come filtro Senato (prima: "nessun filtro per singolo DDL/atto"). ATTENZIONE: il filtro funziona ma il dataset sottostante sembra non popolato per DDL recenti (2026) — vedi [[recurring_gaps]] per il dettaglio, non è la stessa cosa di "gap chiuso al 100%".

Prossimo retest: non ripartire da questi punti, verificare solo con un comando smoke-test rapido che siano ancora presenti (help + un caso reale), poi concentrarsi su gap nuovi/residui.
