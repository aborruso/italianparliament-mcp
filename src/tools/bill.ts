import { z } from "zod";
import { cdQuery } from "../core/client.js";
import { OCD_PREFIXES } from "../core/prefixes.js";
import { flattenBindings } from "../core/flatten.js";
import type { Tool } from "./types.js";

const inputSchema = z.object({
  uri: z.string().url().describe("URI completo dell'atto Camera"),
});

const columns = [
  "uri",
  "label",
  "title",
  "type",
  "date",
  "description",
  "initiative",
  "identifier",
  "sponsor_uri",
  "cosignatories",
  "legislature_uri",
  "url",
  "html_url",
];

export const billTool: Tool<typeof inputSchema> = {
  name: "bill",
  description:
    "[CAMERA] Scheda di un singolo atto della Camera: titolo, tipo, data, iniziativa, firmatario, stato.",
  inputSchema,
  examples: [
    "italianparliament bill show --uri http://dati.camera.it/ocd/attocamera.rdf/ac19_1234",
    "italianparliament bill show --uri http://dati.camera.it/ocd/attocamera.rdf/ac19_1 --format jsonl",
  ],
  async execute(input) {
    const query = `${OCD_PREFIXES}
SELECT ?label ?title ?type ?date ?description ?initiative
       ?identifier ?primo_firmatario ?rif_leg ?url
WHERE {
  <${input.uri}> rdfs:label ?label .
  OPTIONAL { <${input.uri}> dc:title ?title }
  OPTIONAL { <${input.uri}> dc:type ?type }
  OPTIONAL { <${input.uri}> dc:date ?date }
  OPTIONAL { <${input.uri}> dc:description ?description }
  OPTIONAL { <${input.uri}> ocd:iniziativa ?initiative }
  OPTIONAL { <${input.uri}> dc:identifier ?identifier }
  OPTIONAL { <${input.uri}> ocd:primo_firmatario ?primo_firmatario }
  OPTIONAL { <${input.uri}> ocd:rif_leg ?rif_leg }
  OPTIONAL { <${input.uri}> dcterms:isReferencedBy ?url }
}
LIMIT 1`;

    const cosigsQuery = `${OCD_PREFIXES}
SELECT ?contributor WHERE {
  <${input.uri}> dc:contributor ?contributor
}`;

    const [results, cosigsResults] = await Promise.all([
      cdQuery(query),
      cdQuery(cosigsQuery),
    ]);
    const raw = flattenBindings(results);
    if (raw.length === 0) {
      throw new Error(`Nessun atto trovato per URI: ${input.uri}`);
    }
    const r = raw[0];
    const cosigs = flattenBindings(cosigsResults).map((x) => x.contributor ?? "").filter(Boolean);
    const m = input.uri.match(/ac(\d+)_(\d+)$/);
    const html_url = m
      ? `https://www.camera.it/leg19/126?leg=${m[1]}&idDocumento=${m[2]}`
      : "";
    const rows = [
      {
        uri: input.uri,
        label: r.label ?? "",
        title: r.title ?? "",
        type: r.type ?? "",
        date: r.date ?? "",
        description: r.description ?? "",
        initiative: r.initiative ?? "",
        identifier: r.identifier ?? "",
        sponsor_uri: r.primo_firmatario ?? "",
        cosignatories: cosigs.join(" | "),
        legislature_uri: r.rif_leg ?? "",
        url: r.url ?? "",
        html_url,
      },
    ];
    return { rows, columns };
  },
};
