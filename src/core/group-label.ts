/**
 * Le label dei gruppi parlamentari della Camera (rdfs:label, dc:title) sono
 * pubblicate troncate, con la forma "NOME (ACRONIMO) (DD.MM.YYYY" — la
 * parentesi sulla data di inizio resta aperta e mai chiusa.
 * Questo helper rimuove quella coda restituendo solo "NOME (ACRONIMO)".
 */
export function cleanGroupLabel(label: string): string {
  return label.replace(/\s*\(\d{2}\.\d{2}\.\d{4}.*$/, "").trim();
}
