/**
 * Camera e Senato pubblicano nome/cognome e genere in formati diversi
 * (es. "GIORGIA"/"MELONI"/"female" alla Camera vs "Marco"/"Meloni"/"M" al
 * Senato). Questi helper uniformano l'output nei tool che mescolano righe
 * delle due camere nello stesso set di colonne.
 */
export function toTitleCase(s: string): string {
  if (!s) return s;
  return s.toLowerCase().replace(/(^|[\s'-])\p{L}/gu, (c) => c.toUpperCase());
}

export function normalizeGender(g: string): string {
  if (g === "M") return "male";
  if (g === "F") return "female";
  return g;
}
