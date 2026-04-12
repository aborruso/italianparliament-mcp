import { describe, it, expect } from "vitest";
import { sparqlTool } from "./sparql.js";

describe("sparql tool", () => {
  describe("validation", () => {
    it("rejects non-SELECT queries", async () => {
      await expect(
        sparqlTool.execute({
          query: "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }",
          endpoint: "camera",
          limit: 10,
        }),
      ).rejects.toThrow("Solo query SELECT supportate");
    });

    it("rejects DELETE queries", async () => {
      await expect(
        sparqlTool.execute({
          query: "DELETE WHERE { ?s ?p ?o }",
          endpoint: "camera",
          limit: 10,
        }),
      ).rejects.toThrow("Solo query SELECT supportate");
    });
  });

  describe("integration", () => {
    it("executes a count query on Camera", async () => {
      const result = await sparqlTool.execute({
        query: "PREFIX ocd: <http://dati.camera.it/ocd/> SELECT (COUNT(?s) AS ?n) WHERE { ?s a ocd:legislatura }",
        endpoint: "camera",
        limit: 1,
      });
      expect(result.rows.length).toBe(1);
      expect(Number(result.rows[0].n)).toBeGreaterThan(0);
    }, 30000);

    it("executes a count query on Senato", async () => {
      const result = await sparqlTool.execute({
        query: "PREFIX osr: <http://dati.senato.it/osr/> SELECT (COUNT(?s) AS ?n) WHERE { ?s a osr:Senatore }",
        endpoint: "senato",
        limit: 1,
      });
      expect(result.rows.length).toBe(1);
      expect(Number(result.rows[0].n)).toBeGreaterThan(0);
    }, 30000);
  });
});
