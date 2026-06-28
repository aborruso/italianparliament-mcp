# Processo di release

Release manuale, senza CI. Il pacchetto **non** è pubblicato su npm; la
distribuzione avviene via server MCP (stdio + Cloudflare Worker), skill e
pacchetto `.dxt`.

## Passi per una nuova versione `X.Y.Z`

1. **Allinea la versione in 3 punti** (devono restare identici):
   - `package.json` → campo `version`
   - `src/server.ts` → `version:` passato a `new McpServer(...)`
   - `src/worker.ts` → campo `version` dell'info endpoint **e** il contatore `tools:` (numero di tool registrati)

2. **Build e type-check** (il type-check del MCP SDK richiede heap maggiorato):

   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npx tsc --noEmit
   npm run build         # CLI + MCP stdio (dist/cli.js, dist/index.js)
   npm run build:worker  # Cloudflare Worker (dist/worker.js)
   npm test              # vitest
   ```

3. **Aggiorna la documentazione**: `LOG.md` (voce in cima, data `YYYY-MM-DD`),
   `README.md`, e le skill in `skills/` se sono cambiati comandi/tool.

4. **Commit e push** su `main`:

   ```bash
   git add -A
   git commit -m "feat(...): ..."
   git push origin main
   ```

5. **Tag annotato** e push del tag:

   ```bash
   git tag -a vX.Y.Z -m "vX.Y.Z — <sintesi>"
   git push origin vX.Y.Z
   ```

6. **GitHub Release** con note:

   ```bash
   gh release create vX.Y.Z --title "vX.Y.Z — <titolo>" --notes "..."
   ```

7. **Deploy del Worker** su Cloudflare:

   ```bash
   npm run deploy        # = build:worker + wrangler deploy
   ```

   Verifica del deploy:

   ```bash
   curl -s https://italianparliament-mcp.andy-pr.workers.dev/   # version + tools
   ```

## Note

- `dist/` è in `.gitignore`: gli artefatti sono ricostruiti al deploy, non versionati.
- Il comando CLI `bill-text fetch` è **solo locale** (usa `node:child_process`
  e un browser via `agent-browser`): non entra nel bundle del Worker, che
  espone solo i tool basati su SPARQL/URL.
- Convenzione versioni: pre-1.0. Bump *minor* (`0.X.0`) per nuove capacità
  utente, *patch* (`0.0.Z`) per fix.
