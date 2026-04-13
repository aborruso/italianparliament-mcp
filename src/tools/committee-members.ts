import { z } from "zod";
import { cdQuery, snQuery } from "../core/client.js";
import { OCD_PREFIXES, OSR_PREFIXES } from "../core/prefixes.js";
import { flattenBindings } from "../core/flatten.js";
import type { Tool } from "./types.js";

const RDFS_LABEL = "http://www.w3.org/2000/01/rdf-schema#label";

function stripLegLabel(label: string): string {
  return label.replace(/,\s*.* Legislatura della Repubblica\s*$/, "").trim();
}

const inputSchema = z.object({
  chamber: z
    .enum(["camera", "senato", "both"])
    .default("both")
    .describe("Ramo del parlamento: camera, senato o both"),
  committeeUri: z
    .string()
    .url()
    .optional()
    .describe(
      "URI della commissione (Camera: http://dati.camera.it/ocd/organo.rdf/o19_3502, Senato: http://dati.senato.it/commissione/0-1). Ottenibile da committees.",
    ),
  memberUri: z
    .string()
    .url()
    .optional()
    .describe("URI del parlamentare — restituisce tutte le commissioni di cui fa parte"),
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
  "chamber",
  "member_uri",
  "member_name",
  "committee_uri",
  "committee_name",
  "role",
  "start_date",
  "end_date",
  "legislature",
];

interface Row {
  chamber: string;
  member_uri: string;
  member_name: string;
  committee_uri: string;
  committee_name: string;
  role: string;
  start_date: string;
  end_date: string;
  legislature: string;
}

async function queryCamera(input: z.infer<typeof inputSchema>): Promise<Row[]> {
  const filters: string[] = [];

  if (input.committeeUri) {
    filters.push(`FILTER(?organo = <${input.committeeUri}>)`);
  }
  if (input.memberUri) {
    filters.push(`FILTER(?deputy_uri = <${input.memberUri}>)`);
  }
  if (input.legislature) {
    filters.push(
      `?organo ocd:rif_leg <http://dati.camera.it/ocd/legislatura.rdf/repubblica_${input.legislature}> .`,
    );
  }
  if (input.activeOnly) {
    filters.push(`FILTER(!BOUND(?endDate))`);
  }

  // Camera uses ocd:ufficioParlamentare for roles (PRESIDENTE, VICEPRESIDENTE, SEGRETARIO, CAPOGRUPPO)
  // and ocd:haMembro blank nodes for plain members (no role in ufficioParlamentare)
  // We query ufficioParlamentare for all roles including COMPONENTE (= plain member)
  const query = `${OCD_PREFIXES}
SELECT DISTINCT ?deputy_uri ?label ?organo ?organo_label ?carica ?startDate ?endDate
WHERE {
  ?uff a ocd:ufficioParlamentare .
  ?uff ocd:rif_organo ?organo .
  ?uff ocd:rif_deputato ?deputy_uri .
  ?uff ocd:carica ?carica .
  ?uff ocd:startDate ?startDate .
  OPTIONAL { ?uff ocd:endDate ?endDate }
  ?organo <${RDFS_LABEL}> ?organo_label .
  ?deputy_uri <${RDFS_LABEL}> ?label .
  ${filters.join("\n  ")}
}
ORDER BY ?carica ?label
LIMIT ${input.limit}
OFFSET ${input.offset}`;

  const results = await cdQuery(query);
  const raw = flattenBindings(results);
  return raw.map((r) => ({
    chamber: "camera",
    member_uri: r.deputy_uri ?? "",
    member_name: stripLegLabel(r.label ?? ""),
    committee_uri: r.organo ?? "",
    committee_name: r.organo_label ?? "",
    role: r.carica ?? "",
    start_date: r.startDate ?? "",
    end_date: r.endDate ?? "",
    legislature: input.legislature ? String(input.legislature) : "",
  }));
}

async function querySenato(input: z.infer<typeof inputSchema>): Promise<Row[]> {
  const filters: string[] = [];

  if (input.committeeUri) {
    filters.push(`FILTER(?commissione = <${input.committeeUri}>)`);
  }
  if (input.memberUri) {
    filters.push(`FILTER(?senatore_uri = <${input.memberUri}>)`);
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
  ?senatore_uri <${RDFS_LABEL}> ?senatore_nome .
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
  return raw.map((r) => ({
    chamber: "senato",
    member_uri: r.senatore_uri ?? "",
    member_name: r.senatore_nome ?? "",
    committee_uri: r.commissione ?? "",
    committee_name: r.commissione_nome ?? "",
    role: r.carica ?? "",
    start_date: r.inizio ?? "",
    end_date: r.fine ?? "",
    legislature: r.legislatura ?? "",
  }));
}

export const committeeMembersTool: Tool<typeof inputSchema> = {
  name: "committee-members",
  description:
    "[CAMERA+SENATO] Composizione delle commissioni parlamentari: chi ne fa parte, con ruolo " +
    "(Presidente, Vicepresidente, Segretario, Capogruppo, Componente/Membro) e date. " +
    "Filtrabile per commissione, parlamentare, legislatura e camera. " +
    "Combinare con committees (Senato) o specificare un URI organo Camera.",
  inputSchema,
  examples: [
    "italianparliament committee-members list --committee-uri http://dati.camera.it/ocd/organo.rdf/o19_3502 --chamber camera",
    "italianparliament committee-members list --committee-uri http://dati.senato.it/commissione/0-1 --chamber senato --legislature 19",
    "italianparliament committee-members list --member-uri http://dati.camera.it/ocd/deputato.rdf/d307575_19 --chamber camera",
    "italianparliament committee-members list --member-uri http://dati.senato.it/senatore/17542 --chamber senato --legislature 19",
    "italianparliament committee-members list --legislature 19 --active-only false --limit 50",
  ],
  async execute(input) {
    const chamber = input.chamber;
    let rows: Row[] = [];

    if (chamber === "camera" || chamber === "both") {
      rows = rows.concat(await queryCamera(input));
    }
    if (chamber === "senato" || chamber === "both") {
      rows = rows.concat(await querySenato(input));
    }

    return { rows, columns };
  },
};
