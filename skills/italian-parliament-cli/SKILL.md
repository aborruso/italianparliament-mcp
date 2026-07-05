---
name: italian-parliament-cli
description: Query Italian Parliament open data from the command line (italianparliament CLI). Use when the user wants to run shell pipelines, export CSV/JSONL, or script analysis over deputies, senators, bills, votes, speeches, and groups.
compatibility: Requires the @aborruso/italianparliament-mcp npm package installed globally (provides the `italianparliament` command)
metadata:
  author: aborruso
  version: "1.3"
---

# Italian Parliament CLI Skill

Use the `italianparliament` CLI to query Camera dei Deputati and Senato della Repubblica open data from the shell.

## Installation

```bash
npm install -g @aborruso/italianparliament-mcp
# provides the `italianparliament` command
```

## Discovery (orchestration)

```bash
italianparliament guide                  # typical workflow (discover → URI → detail)
italianparliament which "testo ddl"      # capability → command (exit 0 match, 2 no-match); add --json for ranked output
italianparliament <command> --help       # options + examples
```

## General syntax

```
italianparliament <resource> <action> [--option value ...]
```

Default output: **CSV** (for spreadsheets, `duckdb`, `mlr`). Add `--format jsonl` for `jq`/streaming.

## Default legislature

Current legislature is **19**. Most commands default to 19 when `--legislature` is omitted.

## Command reference

See [full command reference](references/commands.md).

## Common patterns

**Count deputies in a legislature**
```bash
italianparliament deputies list --legislature 19 --format csv | wc -l
```

**Export all bills as CSV**
```bash
italianparliament bills list --legislature 19 --format csv > bills-19.csv
```

**Find an MP by name**
```bash
italianparliament search find --name meloni
```

**Top 20 MPs by interrogations (AIC)**
```bash
italianparliament rank list --rank-by aic-primo-firmatario --legislature 19 --limit 20
```

**Who voted against in a vote**
```bash
italianparliament vote-detail show --vote-uri <vote-uri> --format jsonl | \
  jq 'select(.vote=="Contrario")'
```

**Dissidenti, e altri obiettivi giornalistici derivabili senza tool dedicato**
Vedi [obiettivi giornalistici](references/obiettivi-giornalistici.md): ricette pronte (es. i "ribelli" che votano contro la linea di gruppo) combinando i tool esistenti.

**A person's full career (legislatures + government)**
```bash
italianparliament person-career show --uri http://dati.camera.it/ocd/deputato.rdf/d302103_19
```

**Government members filtered by name**
```bash
italianparliament gov-members list --name draghi
```

**Group ranking by AIC, also per member**
```bash
italianparliament group-rank list --rank-by aic --legislature 19   # colonna count_per_member già calcolata
```

## Ricerca testuale (`--keyword`)

`--keyword` (su `bills`, `aic`, `committee-sessions`, ecc.) è un **match letterale** sul **titolo formale** dell'atto, non una ricerca semantica: cerca la stringa così com'è nel testo ufficiale. Il lessico giornalistico spesso **non coincide** con quello normativo, quindi un risultato vuoto è quasi sempre un mismatch di parole, **non** un dato assente.

Regole d'oro:

- **Usa il termine normativo, non quello giornalistico.** Es. `elezione` (non `elettorale`), `disabilità`/`portatori di handicap`, `sostegno` (non `fuorisede`/`fuori sede`). In dubbio, prova entrambi.
- **Prova più sinonimi e radici di parola** prima di concludere. Preferisci la **radice** breve che copre più forme: `elett` → elettorale/elettori/elezione; `ambient` → ambiente/ambientale. Se il tool matcha a confini di parola (es. `aic --keyword`), usa più keyword separate.
- **Vuoto ≠ assente.** Se non trovi nulla, riformula con un sinonimo o una radice prima di dire all'utente che il dato non c'è. Solo dopo 2-3 varianti fallite l'assenza è credibile.
- **Sindacato ispettivo (Senato) non è ricercabile per argomento**: `sindacato-ispettivo --keyword` non filtra sull'oggetto perché il LOD Senato non espone l'oggetto/testo dell'atto (solo tipo, numero, data, firmatari). Il testo vive solo nella pagina HTML esterna. Non promettere ricerche tematiche su questo tool.

## Tips

- Pipe CSV into `duckdb -c "SELECT ... FROM read_csv_auto('/dev/stdin')"` for SQL analysis
- Use `--limit` to cap results during exploration
- URIs from `list` commands can be passed to `show` commands
- **Senato confidence votes have empty `ddl_uri`**: `senato-votes list --ddl-uri <uri>` won't return a *fiducia* — the bill link is only in the `label` text. Filter by **seduta date** (`--date-from`/`--date-to`), then match the DDL via `label`. Also check `ddl_uri` on any "final" vote found by date: it may belong to a different act (unified text).
