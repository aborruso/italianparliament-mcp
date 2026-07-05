---
type: Gotcha
title: Emendamenti al Senato — firmatario assente dal LOD, presente nell'AKN
description: osr:Emendamento NON espone il firmatario/proponente nel LOD; il dato esiste solo nel testo AKN linkato da osr:URLTestoXml (dietro WAF).
resource: https://dati.senato.it/sparql
tags: [senato, osr, emendamenti, firmatario, assenti, waf]
timestamp: 2026-07-05
---

Al Senato gli emendamenti **sono** nel LOD come classe `osr:Emendamento` (a differenza della Camera, dove non esistono affatto nel LOD — vedi [assenti Camera](../camera/assenti.md)). Ma il **firmatario/proponente non c'è**.

# Cosa espone `osr:Emendamento` (e cosa no)

Verificato il 2026-07-05 su un campione di 200 istanze: le uniche proprietà sono

- `osr:numero`, `osr:tipo`, `osr:legislatura`, `osr:flagCommissione`
- `osr:URLTesto` (link testo HTML), `osr:URLTestoXml` (link testo AKN/Akoma Ntoso)
- `osr:oggetto` → `osr:OggettoTrattazione` (che ha solo `osr:relativoA` → DDL, `osr:legislatura`, `type`)
- `rdf:type`, `rdfs:label`

**Nessuna proprietà di firmatario** sull'emendamento né sull'oggetto, e **nessuna relazione inversa** senatore→emendamento (query `?sen ?p ?e . ?e a osr:Emendamento` → vuota). L'assenza è reale a monte, non un limite di query.

Nota performance: lo scan dataset-wide `SELECT DISTINCT ?p WHERE { ?s a osr:Emendamento . ?s ?p ?o }` va in timeout su Virtuoso; usare un campione bounded (`{ SELECT ?s WHERE {...} LIMIT 200 } ?s ?p ?o`).

# Il dato esiste fuori dal LOD: il testo AKN

Il proponente è nel testo **AKN (Akoma Ntoso)** puntato da `osr:URLTestoXml`. Verificato su `emendamento/1067383` (`.../Emendc/01366896/01364883.akn`): l'header porta i nomi in chiaro (es. «Amidei Ancorotti Fallucchi Maffoni Silvestroni») e i tag strutturati

```xml
<an:TLCRole id="tipoSenatore" href="http://dati.senato.it/Senatore" showAs="Senatore"/>
<an:docProponent refersTo="#ID0E5" as="#tipoSenatore"/>
<an:docProponent refersTo="#ID0EIB" as="#tipoSenatore"/>
...
```

Il **primo** `an:docProponent` è il primo firmatario, i successivi i cofirmatari.

Trappola accesso: `www.senato.it` è **dietro AWS WAF** — `curl` diretto restituisce 403 (301→CloudFront in HTTP, 403 in HTTPS). Il recupero richiede un fetch browser-class (agente browser con token WAF), non `curl`.

# Conseguenza per il tooling

Il tool `amendments` (Senato) oggi non espone il firmatario perché non è nel LOD. Il tool `camera-amendments` (Camera) invece **lo espone** (`first_signatory`) facendo scraping fuori dal LOD (app HTML `documenti.camera.it`). L'asimmetria è quindi di **tooling** — un ramo esce dal LOD, l'altro no — su un limite LOD condiviso (nessun firmatario emendamento nel LOD di nessuna delle due camere). È colmabile allo stesso modo: parsing dell'AKN `URLTestoXml`, con il primo `docProponent` come primo firmatario.

# Citations

[1] Verifica 2026-07-05: proprietà di `osr:Emendamento` (campione 200) e assenza legame senatore→emendamento; endpoint `dati.senato.it/sparql`. Testo AKN `emendamento/1067383` recuperato via agente browser (WAF): 5 `an:docProponent`.
