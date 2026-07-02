---
name: cli-recipes
description: Ricette di comandi CLI che mappano bene su domande giornalistiche comuni (voto su un DDL, fiducia, relatore, dettaglio nominale)
metadata:
  type: project
---

Recipe verificate nel retest del 2026-07-01, riusabili direttamente:

- **"Come è andato il voto (finale/fiducia/ODG) su un DDL alla Camera?"** → `votes list --legislature 19 --bill-code <numero>` (senza `--confidence-vote`, mostra tutto: fiducia, finale, ODG). Aggiungere `--confidence-vote true` per isolare solo la fiducia.
- **"Chi ha votato come su quel voto (Camera)?"** → `vote-detail show --vote-uri <uri dalla riga precedente> [--group-acronym <sigla>]`.
- **"Come è andato il voto su un DDL al Senato?"** → `senato-votes list --legislature 19 --ddl-uri <uri>` OPPURE per data `--date-from`/`--date-to` se non si conosce l'uri. Isola automaticamente emendamenti in sequenza, controprove, voto finale.
- **"Chi ha votato come al Senato?"** → `senato-vote-detail show --vote-uri <uri>`. Nota: `group_label` è la denominazione estesa del gruppo, non la sigla/acronimo come in Camera.
- **"Chi è il relatore di un DDL (Camera o Senato)?"** → `bill-rapporteurs list --bill-uri <uri>` (auto-detect camera/senato dall'uri, ora copre entrambe le camere).
- **"A che punto è l'iter di un DDL?"** → Senato: `bill-progress list --keyword "<tema>"` o `--ddl-uri`. Camera: `bill-progress list --uri <ac19_uri>` (dà la timeline completa passo-passo, non solo l'ultimo stato).
- **"Trova l'interrogazione di question time su un tema preciso"** → `aic list --legislature 19 --keyword <tema> --count-only` prima (per stimare quante righe aspettarsi), poi senza `--count-only` con `--limit` adeguato. Il filtro ora funziona realmente (vedi [[gaps_closed_2026_07_01]]), ma fa substring match: con parole corte/acronimi verificare manualmente i risultati.
- **"Trova l'URI di un parlamentare per nome"** → `search find --name "<nome>" --chamber both`. Se il parlamentare ha cambiato camera e la query con nome+cognome non trova il lato Senato, ripetere con `--chamber senato` esplicito o con solo cognome (vedi bug in [[recurring_gaps]]).

Sempre preferire `--format jsonl` per il parsing successivo con `jq`.
