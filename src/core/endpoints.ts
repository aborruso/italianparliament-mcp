export const CAMERA_ENDPOINT = "https://dati.camera.it/sparql";
export const SENATO_ENDPOINT = "https://dati.senato.it/sparql";

export const DEFAULT_TIMEOUT_MS = 60_000;
// L'endpoint della Camera "flappa" (finestre di errore di pochi secondi):
// 5 tentativi con backoff esponenziale (~4s totali) assorbono la gran parte
// di questi buchi transitori senza esporre l'errore all'utente.
export const DEFAULT_MAX_RETRIES = 5;
