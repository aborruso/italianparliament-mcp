import { z } from "zod";
import { snQuery } from "../core/client.js";
import { OSR_PREFIXES } from "../core/prefixes.js";
import { flattenBindings } from "../core/flatten.js";
import type { Tool } from "./types.js";

const inputSchema = z.object({
  ddlUri: z
    .string()
    .url()
    .describe("URI del DDL Senato (es. http://dati.senato.it/ddl/56260)"),
  limit: z.number().int().min(1).max(1000).default(200),
  offset: z.number().int().min(0).default(0),
});

const columns = [
  "session_uri",
  "date",
  "committee",
  "committee_uri",
  "session_type",
  "interventions",
];

export const committeeSessionsTool: Tool<typeof inputSchema> = {
  name: "committee-sessions",
  description:
    "[SENATO] Sedute di commissione in cui un DDL è stato trattato, con data, commissione, tipo di seduta e numero di interventi. Mostra l'iter del provvedimento nelle commissioni (dove si fa il lavoro istruttorio). Richiede l'URI del DDL (da bill-progress o member-bills).",
  inputSchema,
  examples: [
    "italianparliament committee-sessions list --ddl-uri http://dati.senato.it/ddl/56260",
    "italianparliament committee-sessions list --ddl-uri http://dati.senato.it/ddl/56260 --format jsonl",
  ],
  async execute(input) {
    const query = `${OSR_PREFIXES}
SELECT ?seduta ?date ?tipo ?comm (MIN(?tb) AS ?commName) (COUNT(DISTINCT ?int) AS ?interventi)
WHERE {
  ?int a osr:Intervento ; osr:oggetto ?o ; osr:seduta ?seduta .
  ?o osr:relativoA <${input.ddlUri}> .
  ?seduta osr:dataSeduta ?date .
  OPTIONAL { ?seduta osr:tipoSeduta ?tipo }
  OPTIONAL { ?seduta osr:commissione ?comm . OPTIONAL { ?comm osr:titoloBreve ?tb } }
}
GROUP BY ?seduta ?date ?tipo ?comm
ORDER BY ?date
LIMIT ${input.limit}
OFFSET ${input.offset}`;

    const results = await snQuery(query);
    const raw = flattenBindings(results);
    if (raw.length === 0) {
      throw new Error(
        `Nessuna seduta di commissione trovata per il DDL: ${input.ddlUri} (potrebbe non essere ancora stato esaminato in commissione).`,
      );
    }
    const rows = raw.map((r) => ({
      session_uri: r.seduta ?? "",
      date: r.date ?? "",
      committee: r.commName ?? "",
      committee_uri: r.comm ?? "",
      session_type: r.tipo ?? "",
      interventions: r.interventi ?? "",
    }));
    return { rows, columns };
  },
};
