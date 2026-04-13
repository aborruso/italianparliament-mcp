import { z } from "zod";
import { snQuery } from "../core/client.js";
import { OSR_PREFIXES } from "../core/prefixes.js";
import { flattenBindings } from "../core/flatten.js";
import type { Tool } from "./types.js";

const inputSchema = z.object({
  committeeUri: z
    .string()
    .url()
    .optional()
    .describe(
      "URI della commissione Senato (es. http://dati.senato.it/commissione/0-1). Ottenibile da committees.",
    ),
  senatorUri: z
    .string()
    .url()
    .optional()
    .describe("URI del senatore — restituisce tutte le commissioni di cui fa parte"),
  legislature: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Numero legislatura (es. 19)"),
  activeOnly: z
    .boolean()
    .default(true)
    .describe("Solo membri attualmente in carica (senza data fine). Default: true."),
  limit: z.number().int().min(1).max(1000).default(200),
  offset: z.number().int().min(0).default(0),
});

const columns = [
  "senator_uri",
  "senator_name",
  "committee_uri",
  "committee_name",
  "role",
  "start_date",
  "end_date",
  "legislature",
];

export const committeeMembersTool: Tool<typeof inputSchema> = {
  name: "committee-members",
  description:
    "[SENATO] Composizione delle commissioni del Senato: chi ne fa parte, con ruolo (Presidente, Vicepresidente, Segretario, Membro) e date. " +
    "Filtrabile per commissione, senatore e legislatura. Combinare con committees per avere la lista commissioni.",
  inputSchema,
  examples: [
    "italianparliament committee-members list --committee-uri http://dati.senato.it/commissione/0-1 --legislature 19",
    "italianparliament committee-members list --senator-uri http://dati.senato.it/senatore/29110 --legislature 19",
    "italianparliament committee-members list --legislature 19 --active-only false --limit 50",
  ],
  async execute(input) {
    const filters: string[] = [];

    if (input.committeeUri) {
      filters.push(`FILTER(?commissione = <${input.committeeUri}>)`);
    }
    if (input.senatorUri) {
      filters.push(`FILTER(?senatore_uri = <${input.senatorUri}>)`);
    }
    if (input.legislature) {
      filters.push(`?aff osr:legislatura ${input.legislature} .`);
    }
    if (input.activeOnly) {
      filters.push(`FILTER(!BOUND(?fine))`);
    }

    const query = `${OSR_PREFIXES}
SELECT ?senatore_uri ?senatore_nome ?commissione (MIN(?cn) AS ?commissione_nome) ?carica ?inizio ?fine ?legislatura
WHERE {
  ?senatore_uri a osr:Senatore .
  ?senatore_uri <http://www.w3.org/2000/01/rdf-schema#label> ?senatore_nome .
  ?senatore_uri osr:afferisce ?aff .
  ?aff a osr:Afferenza .
  ?aff osr:commissione ?commissione .
  ?aff osr:carica ?carica .
  OPTIONAL { ?aff osr:inizio ?inizio }
  OPTIONAL { ?aff osr:fine ?fine }
  OPTIONAL { ?aff osr:legislatura ?legislatura }
  OPTIONAL { ?commissione osr:titoloBreve ?cn }
  ${filters.join("\n  ")}
}
GROUP BY ?senatore_uri ?senatore_nome ?commissione ?carica ?inizio ?fine ?legislatura
ORDER BY ?carica ?senatore_nome
LIMIT ${input.limit}
OFFSET ${input.offset}`;

    const results = await snQuery(query);
    const raw = flattenBindings(results);
    const rows = raw.map((r) => ({
      senator_uri: r.senatore_uri ?? "",
      senator_name: r.senatore_nome ?? "",
      committee_uri: r.commissione ?? "",
      committee_name: r.commissione_nome ?? "",
      role: r.carica ?? "",
      start_date: r.inizio ?? "",
      end_date: r.fine ?? "",
      legislature: r.legislatura ?? "",
    }));
    return { rows, columns };
  },
};
