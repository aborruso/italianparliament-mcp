---
name: exa-query-patterns
description: Query Exa efficaci per trovare notizie parlamentari italiane con aggancio a dati verificabili (voti, DDL, question time, emendamenti)
metadata:
  type: project
---

Pattern di query `mcp__exa__web_search_exa` che hanno reso risultati concreti e verificabili (non pura opinione) nel retest del 2026-07-01:

- **"Camera dei Deputati votazione aula <mese> <anno>"** → trova sia articoli di stampa (Sole24Ore, Il Dubbio) con numero di DDL/articolo e date esatte, sia pagine ufficiali camera.it/documenti.camera.it con schede votazione dettagliate (utili per validare i dati CLI riga per riga).
- **"Senato disegno di legge approvato <mese> <anno>"** → intercetta bene i "Comunicati di seduta" ufficiali del Senato (senato.it/lavori/assemblea/comunicato-di-seduta), che riportano relatore, gruppo, numero di voti a favore/contro per ogni DDL approvato in una seduta: ottima fonte primaria per validare `bill-rapporteurs`/`senato-votes`.
- **"question time interrogazione parlamentare <mese> <anno> governo risposta"** → trova gli articoli ANSA che elencano ministro per ministro, e per ogni ministro l'elenco delle interrogazioni con firmatario e gruppo (es. "Marattin - Misto", "Bignami - FDI"): permette di costruire query CLI mirate su `aic --keyword` con il tema esatto.
- **"emendamenti aula Camera Senato DDL <tema> <mese> <anno>"** → utile per trovare provvedimenti con battaglia di emendamenti in corso (buon terreno per testare `amendments`/`votes`), ma occhio: molti risultati più vecchi (aprile 2026, DL sicurezza) restano più ricchi di dettaglio rispetto a notizie recentissime ancora in corso.

Nota metodologica: le notizie di provvedimenti già votati (voto avvenuto pochi giorni prima del retest) sono le migliori per il testing perché permettono un confronto diretto numero-per-numero tra fonte giornalistica e output CLI. Le notizie su voti futuri (es. "atteso il 7-9 luglio") restituiscono correttamente 0 righe dalla CLI — non è un fallimento del tool, va riconosciuto e non scambiato per gap.
