import type { ZodTypeAny, z } from "zod";
import type { Row } from "../core/types.js";

export type ToolResult = {
  rows: Row[];
  columns: string[];
  /**
   * Nota dinamica calcolata a runtime, mostrata SOLO quando il risultato è
   * vuoto. A differenza di `emptyHint` (statico), dipende dall'input: serve a
   * qualificare un vuoto ambiguo (es. finestra di date recente non ancora
   * caricata nel LOD). Se presente, ha precedenza sull'emptyHint statico.
   */
  hint?: string;
};

export type Tool<S extends ZodTypeAny = ZodTypeAny> = {
  name: string;
  description: string;
  inputSchema: S;
  examples: string[];
  /**
   * Messaggio mostrato al posto del default quando il risultato è vuoto.
   * Serve a direzionare i client che non caricano la skill: quando un dato
   * manca, il rischio di confabulazione è massimo, quindi qui si mette una
   * nota specifica (es. "riprova per numero, non per keyword"). Solo MCP.
   */
  emptyHint?: string;
  execute(input: z.infer<S>): Promise<ToolResult>;
};
