import { z } from "zod";
import { cdQuery, snQuery } from "../core/client.js";
import { OCD_PREFIXES, OSR_PREFIXES } from "../core/prefixes.js";
import { flattenBindings } from "../core/flatten.js";
import type { Tool } from "./types.js";

const inputSchema = z.object({
  billUri: z
    .string()
    .url()
    .describe(
      "URI del DDL. Camera (es. http://dati.camera.it/ocd/attocamera.rdf/ac19_2807) o Senato (es. http://dati.senato.it/ddl/59313). Il ramo è rilevato dall'URI.",
    ),
  limit: z.number().int().min(1).max(500).default(100),
});

const columns = [
  "rapporteur_name",
  "rapporteur_type",
  "committee",
  "date",
  "deputy_uri",
];

const RDFS_LABEL = "http://www.w3.org/2000/01/rdf-schema#label";

// Camera: relatori via dibattito → discussione → relatore (ocd:rif_relatore).
function cameraQuery(billUri: string, limit: number): string {
  return `${OCD_PREFIXES}
SELECT DISTINCT ?relatoreLabel ?relatoreType ?dibattitoLabel ?startDate ?deputatoUri
WHERE {
  <${billUri}> ocd:rif_dibattito ?dib .
  ?dib <${RDFS_LABEL}> ?dibattitoLabel .
  OPTIONAL { ?dib ocd:startDate ?startDate }
  ?dib ocd:rif_discussione ?disc .
  ?disc ocd:rif_relatore ?rel .
  ?rel <${RDFS_LABEL}> ?relatoreLabel .
  OPTIONAL { ?rel ocd:rif_deputato ?deputatoUri }
  OPTIONAL { ?rel dc:type ?relatoreType }
}
ORDER BY ?startDate ?dibattitoLabel
LIMIT ${limit}`;
}

// Senato: relatori via osr:relatore (blank node con label, tipoRelatore, organo,
// dataNomina, senatore). Mappati sulle stesse colonne della Camera.
function senatoQuery(billUri: string, limit: number): string {
  return `${OSR_PREFIXES}
SELECT DISTINCT ?relatoreLabel ?tipoRelatore ?organo ?dataNomina ?senatoreUri
WHERE {
  <${billUri}> osr:relatore ?rel .
  ?rel <${RDFS_LABEL}> ?relatoreLabel .
  OPTIONAL { ?rel osr:tipoRelatore ?tipoRelatore }
  OPTIONAL { ?rel osr:organo ?organo }
  OPTIONAL { ?rel osr:dataNomina ?dataNomina }
  OPTIONAL { ?rel osr:senatore ?senatoreUri }
}
ORDER BY ?dataNomina ?relatoreLabel
LIMIT ${limit}`;
}

export const billRapporteursTool: Tool<typeof inputSchema> = {
  name: "bill-rapporteurs",
  description:
    "[CAMERA/SENATO] Relatori di un DDL: nome, tipo (Relatore / f.f.), commissione/organo assegnato e data. Il ramo (Camera o Senato) è rilevato automaticamente dall'URI del DDL.",
  inputSchema,
  examples: [
    "italianparliament bill-rapporteurs list --bill-uri http://dati.camera.it/ocd/attocamera.rdf/ac19_2807",
    "italianparliament bill-rapporteurs list --bill-uri http://dati.senato.it/ddl/59313",
  ],
  async execute(input) {
    const isSenato = input.billUri.includes("dati.senato.it");

    if (isSenato) {
      const raw = flattenBindings(await snQuery(senatoQuery(input.billUri, input.limit)));
      const rows = raw.map((r) => ({
        rapporteur_name: r.relatoreLabel ?? "",
        rapporteur_type: r.tipoRelatore ?? "",
        committee: r.organo ?? "",
        date: r.dataNomina ?? "",
        deputy_uri: r.senatoreUri ?? "",
      }));
      return { rows, columns };
    }

    const raw = flattenBindings(await cdQuery(cameraQuery(input.billUri, input.limit)));
    const rows = raw.map((r) => ({
      rapporteur_name: r.relatoreLabel ?? "",
      rapporteur_type: r.relatoreType ?? "",
      committee: r.dibattitoLabel ?? "",
      date: r.startDate ?? "",
      deputy_uri: r.deputatoUri ?? "",
    }));
    return { rows, columns };
  },
};
