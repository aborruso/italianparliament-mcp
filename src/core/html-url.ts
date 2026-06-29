/**
 * Genera URL human-readable (schede istituzionali camera.it / senato.it) a
 * partire dagli URI SPARQL. Funzioni pure, nessuna chiamata di rete.
 *
 * Pattern verificati su pagine reali (legislatura 19):
 * - Deputato:  http://dati.camera.it/ocd/deputato.rdf/d{ID}_{LEG}
 *              → https://www.camera.it/deputati/elenco/{LEG}-{ID}
 * - Senatore:  http://dati.senato.it/senatore/{N}
 *              → https://www.senato.it/composizione/senatori/elenco-alfabetico/scheda-attivita?did={N}
 *
 * Per le legislature passate il pattern del sito potrebbe differire: qui si
 * emette comunque l'URL best-effort (la correttezza è garantita per la 19).
 */

/**
 * URL della scheda istituzionale di una persona (deputato o senatore) dal suo URI.
 * Ritorna stringa vuota se l'URI non corrisponde a un pattern noto.
 */
export function personHtmlUrl(uri: string | undefined | null): string {
  if (!uri) return "";

  // Deputato Camera: .../deputato.rdf/d<id>_<leg> oppure dr<id>_<leg> (Regno)
  const dep = uri.match(/dati\.camera\.it\/ocd\/deputato\.rdf\/dr?(\d+)_(\d+)$/);
  if (dep) {
    const [, id, leg] = dep;
    return `https://www.camera.it/deputati/elenco/${leg}-${id}`;
  }

  // Senatore: http://dati.senato.it/senatore/<n>
  const sen = uri.match(/dati\.senato\.it\/senatore\/(\d+)$/);
  if (sen) {
    return `https://www.senato.it/composizione/senatori/elenco-alfabetico/scheda-attivita?did=${sen[1]}`;
  }

  return "";
}

/**
 * URL della scheda istituzionale di un atto/DDL dal suo URI.
 * Gestisce sia gli atti Camera sia i DDL Senato. Stringa vuota se ignoto.
 *
 * - Atto Camera: .../attocamera.rdf/ac{LEG}_{ID}
 *   → https://www.camera.it/leg{LEG}/126?leg={LEG}&idDocumento={ID}
 * - DDL Senato:  http://dati.senato.it/ddl/{N}
 *   → https://www.senato.it/leggi-e-documenti/disegni-di-legge/scheda-ddl?tab=datiGenerali&did={N}
 */
export function actHtmlUrl(uri: string | undefined | null): string {
  if (!uri) return "";

  const cam = uri.match(/attocamera\.rdf\/ac(\d+)_(\d+)$/);
  if (cam) {
    const [, leg, id] = cam;
    return `https://www.camera.it/leg${leg}/126?leg=${leg}&idDocumento=${id}`;
  }

  const ddl = uri.match(/dati\.senato\.it\/ddl\/(\d+)$/);
  if (ddl) {
    return `https://www.senato.it/leggi-e-documenti/disegni-di-legge/scheda-ddl?tab=datiGenerali&did=${ddl[1]}`;
  }

  return "";
}

/**
 * Feed RSS per-DDL del Senato (iter dettagliato). Richiede la legislatura,
 * non presente nell'URI del DDL. Stringa vuota se URI non-DDL o leg mancante.
 *
 * http://dati.senato.it/ddl/{N} (+ leg) → .../feed-rss/documenti/ddl/rss/{N}/{leg}
 */
export function ddlRssUrl(
  uri: string | undefined | null,
  legislature: number | string | undefined | null,
): string {
  if (!uri || !legislature) return "";
  const ddl = uri.match(/dati\.senato\.it\/ddl\/(\d+)$/);
  if (!ddl) return "";
  return `https://www.senato.it/feed-rss/documenti/ddl/rss/${ddl[1]}/${legislature}`;
}
