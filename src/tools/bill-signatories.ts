import { z } from "zod";
import { cdQuery, snQuery } from "../core/client.js";
import { OCD_PREFIXES, OSR_PREFIXES } from "../core/prefixes.js";
import { flattenBindings } from "../core/flatten.js";
import { personHtmlUrl } from "../core/html-url.js";
import type { Tool } from "./types.js";

const inputSchema = z.object({
  billUri: z
    .string()
    .url()
    .describe(
      "URI del DDL. Camera (es. http://dati.camera.it/ocd/attocamera.rdf/ac19_2696) o Senato (es. http://dati.senato.it/ddl/25597). Il ramo è rilevato dall'URI.",
    ),
  limit: z.number().int().min(1).max(1000).default(200),
});

const columns = ["name", "role", "is_primary", "person_uri", "html_url"];

const RDFS_LABEL = "http://www.w3.org/2000/01/rdf-schema#label";

// Camera: primo/co-firmatari come proprietà dirette dell'atto
// (ocd:primo_firmatario / ocd:altro_firmatario → deputato).
// Per i decreti-legge / atti di iniziativa governativa il firmatario NON è un
// deputato ma un blank node "membro di governo": il nome vive un hop più in là
// via ocd:rif_persona (→ persona.rdf), e il dicastero è in ocd:ruolo. Senza
// seguirli, il nome torna vuoto (bug: 5 righe con name="" sui decreti governativi).
function cameraQuery(billUri: string, limit: number): string {
  return `${OCD_PREFIXES}
SELECT ?ruolo ?dep ?firstName ?surname ?label
       ?persona ?govRole ?pFirstName ?pSurname ?pLabel
WHERE {
  { <${billUri}> ocd:primo_firmatario ?dep . BIND("primo" AS ?ruolo) }
  UNION
  { <${billUri}> ocd:altro_firmatario ?dep . BIND("co" AS ?ruolo) }
  OPTIONAL { ?dep foaf:firstName ?firstName }
  OPTIONAL { ?dep foaf:surname ?surname }
  OPTIONAL { ?dep <${RDFS_LABEL}> ?label }
  OPTIONAL {
    ?dep ocd:rif_persona ?persona .
    OPTIONAL { ?persona foaf:firstName ?pFirstName }
    OPTIONAL { ?persona foaf:surname ?pSurname }
    OPTIONAL { ?persona <${RDFS_LABEL}> ?pLabel }
  }
  OPTIONAL { ?dep ocd:ruolo ?govRole }
}
LIMIT ${limit}`;
}

// Senato: firmatari via osr:iniziativa → senatore, con flag osr:primoFirmatario.
function senatoQuery(billUri: string, limit: number): string {
  return `${OSR_PREFIXES}
SELECT ?presentatore ?senatore ?primoFirmatario
WHERE {
  <${billUri}> osr:iniziativa ?init .
  OPTIONAL { ?init osr:presentatore ?presentatore }
  OPTIONAL { ?init osr:senatore ?senatore }
  OPTIONAL { ?init osr:primoFirmatario ?primoFirmatario }
}
LIMIT ${limit}`;
}

// La rdfs:label del deputato Camera arriva col suffisso
// ", XIX Legislatura della Repubblica": si tiene solo la parte prima della virgola.
function cleanCameraName(firstName: string, surname: string, label: string): string {
  const composed = `${firstName} ${surname}`.trim();
  if (composed) return composed;
  return (label.split(",")[0] ?? "").trim();
}

export const billSignatoriesTool: Tool<typeof inputSchema> = {
  name: "bill-signatories",
  description:
    "[CAMERA/SENATO] Firmatari di un DDL: primo firmatario e cofirmatari con nome e link al profilo. Per gli atti di iniziativa governativa (decreti-legge e DDL del Governo) i proponenti sono i ministri: il ruolo è 'Governo — <dicastero>' (Camera, es. 'Governo — Ministro dell'Interno') o 'Governo (proponente)' (Senato) invece di 'primo firmatario', con is_primary=false (i proponenti sono più d'uno, non un singolo parlamentare). Il ramo è rilevato automaticamente dall'URI del DDL (ottenibile da bill-progress).",
  inputSchema,
  examples: [
    "italianparliament bill-signatories show --bill-uri http://dati.camera.it/ocd/attocamera.rdf/ac19_2696",
    "italianparliament bill-signatories show --bill-uri http://dati.senato.it/ddl/25597 --format jsonl",
  ],
  async execute(input) {
    const isSenato = input.billUri.includes("dati.senato.it");

    if (isSenato) {
      const raw = flattenBindings(await snQuery(senatoQuery(input.billUri, input.limit)));
      // Riconosci gli atti governativi: se osr:senatore è vuoto, il
      // presentatore è un membro del governo (stringa, non URI).
      const isGov = raw.some((r) => !r.senatore && r.presentatore);
      const rows = raw.map((r) => {
        if (!r.senatore && r.presentatore) {
          // Atto governativo: presentatore è una stringa tipo
          // "Pres. Consiglio  Giorgia Meloni (Gov. Meloni-I)".
          // Non c'è un URI persona → niente html_url.
          return {
            name: r.presentatore,
            role: isGov ? "Governo (proponente)" : "primo firmatario",
            is_primary: isGov ? "false" : "true",
            person_uri: "",
            html_url: "",
          };
        }
        return {
          name: r.presentatore ?? "",
          role: r.primoFirmatario === "1" ? "primo firmatario" : "cofirmatario",
          is_primary: r.primoFirmatario === "1" ? "true" : "false",
          person_uri: r.senatore ?? "",
          html_url: personHtmlUrl(r.senatore),
        };
      });
      return { rows, columns };
    }

    const raw = flattenBindings(await cdQuery(cameraQuery(input.billUri, input.limit)));
    const rows = raw.map((r) => {
      // Iniziativa governativa: il firmatario è un membro di governo (blank node),
      // il nome è sulla persona collegata via ocd:rif_persona. Coerente col ramo
      // Senato: role esplicito "Governo — <dicastero>", is_primary=false (i
      // proponenti governativi sono più d'uno, non un singolo primo firmatario).
      if (r.persona) {
        return {
          name: cleanCameraName(r.pFirstName ?? "", r.pSurname ?? "", r.pLabel ?? ""),
          role: r.govRole ? `Governo — ${r.govRole}` : "Governo (proponente)",
          is_primary: "false",
          person_uri: r.persona,
          html_url: personHtmlUrl(r.persona),
        };
      }
      return {
        name: cleanCameraName(r.firstName ?? "", r.surname ?? "", r.label ?? ""),
        role: r.ruolo === "primo" ? "primo firmatario" : "cofirmatario",
        is_primary: r.ruolo === "primo" ? "true" : "false",
        person_uri: r.dep ?? "",
        html_url: personHtmlUrl(r.dep),
      };
    });
    return { rows, columns };
  },
};
